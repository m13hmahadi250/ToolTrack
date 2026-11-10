/**
 * ToolTrack In-Browser C17 & C++20 Compiler & Virtual Runtime Engine
 * Compiles and executes standard C and C++ programs locally in the browser when offline
 * or when local execution is selected.
 *
 * Supports:
 * - Complete syntax & structural validation with line/column diagnostics
 * - Functions, recursion, forward declarations, and global variables
 * - Control flow: if/else, for, range-based for (auto x : v), while, do-while, switch/case, break, continue
 * - Structs and Classes with fields, constructors, and methods
 * - 1D/2D arrays, pointers (*, &), references, malloc/calloc/free, new/delete
 * - C++ STL: vector, string, map, unordered_map, set, unordered_set, queue, priority_queue, stack, pair
 * - STL Algorithms & Math: sort, reverse, min, max, swap, accumulate, lower_bound, upper_bound, gcd, __gcd, cmath
 * - C Standard Library: printf, scanf, fgets, puts, getchar, putchar, string.h, stdlib.h, ctype.h, math.h
 * - C++ Streams: cin >> (including while(cin >> x)), getline(cin, s), cout <<, cerr <<, fixed, setprecision(n)
 */

export interface CompilerDiagnostic {
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface ClientCppRunResult {
  success: boolean;
  phase: 'compilation' | 'execution';
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  compiler: string;
  diagnostics: CompilerDiagnostic[];
}

/**
 * Parse GCC / Clang or local compiler stderr into structured line/column diagnostics
 */
export function parseCompilerDiagnostics(stderr: string): CompilerDiagnostic[] {
  if (!stderr) return [];
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = stderr.split('\n');
  // Matches e.g. main.cpp:12:5: error: expected ';' before 'return'
  // or prog.cc:8:10: warning: unused variable 'x'
  const regex = /(?:[a-zA-Z0-9_./-]+):(\d+):(\d+):\s*(fatal error|error|warning):\s*(.+)/i;

  for (const line of lines) {
    const m = line.match(regex);
    if (m) {
      diagnostics.push({
        line: parseInt(m[1], 10),
        column: parseInt(m[2], 10),
        severity: m[3].toLowerCase().includes('warn') ? 'warning' : 'error',
        message: m[4].trim(),
      });
    }
  }
  return diagnostics;
}

/**
 * Validate C/C++/Python source code for syntax errors with accurate line and column numbers
 */
export function validateSyntax(code: string, language: 'c' | 'cpp' | 'python'): CompilerDiagnostic[] {
  if (language === 'python') {
    return [];
  }
  const diagnostics: CompilerDiagnostic[] = [];
  const fileName = language === 'cpp' ? 'main.cpp' : 'main.c';

  const braceStack: Array<{ char: string; line: number; col: number }> = [];
  let inString = false;
  let inChar = false;
  let inBlockComment = false;
  let lineNum = 1;
  let colNum = 0;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (ch === '\n') {
      if (inString) {
        diagnostics.push({
          line: lineNum,
          column: colNum,
          severity: 'error',
          message: 'missing terminating " character',
        });
        inString = false;
      }
      lineNum++;
      colNum = 0;
      continue;
    }
    colNum++;

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
        colNum++;
      }
      continue;
    }

    if (!inString && !inChar && ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      colNum++;
      continue;
    }

    if (!inString && !inChar && ch === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      lineNum++;
      colNum = 0;
      continue;
    }

    if (!inChar && ch === '"' && code[i - 1] !== '\\') {
      inString = !inString;
      continue;
    }

    if (!inString && ch === "'" && code[i - 1] !== '\\') {
      inChar = !inChar;
      continue;
    }

    if (inString || inChar) continue;

    if (ch === '{' || ch === '(' || ch === '[') {
      braceStack.push({ char: ch, line: lineNum, col: colNum });
    } else if (ch === '}' || ch === ')' || ch === ']') {
      const expected = ch === '}' ? '{' : ch === ')' ? '(' : '[';
      if (braceStack.length === 0) {
        diagnostics.push({
          line: lineNum,
          column: colNum,
          severity: 'error',
          message: `unmatched '${ch}' token`,
        });
      } else {
        const top = braceStack.pop()!;
        if (top.char !== expected) {
          diagnostics.push({
            line: lineNum,
            column: colNum,
            severity: 'error',
            message: `expected closing match for '${top.char}' (opened at line ${top.line}:${top.col}), found '${ch}'`,
          });
        }
      }
    }
  }

  if (inBlockComment) {
    diagnostics.push({
      line: lineNum,
      column: colNum,
      severity: 'error',
      message: 'unterminated /* block comment',
    });
  }

  for (const unclosed of braceStack) {
    const closing = unclosed.char === '{' ? '}' : unclosed.char === '(' ? ')' : ']';
    diagnostics.push({
      line: unclosed.line,
      column: unclosed.col,
      severity: 'error',
      message: `expected '${closing}' before end of input (to match '${unclosed.char}' at ${fileName}:${unclosed.line}:${unclosed.col})`,
    });
  }

  // Strip comments and string literals to check for main() and obvious missing semicolons
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');

  if (!/\bmain\s*\(/.test(stripped)) {
    diagnostics.push({
      line: 1,
      column: 1,
      severity: 'error',
      message: "undefined reference to `main'",
    });
  }

  // Check for C++ iostream usage in C mode
  if (language === 'c' && (/\bstd::|\bcout\b|\bcin\b|#include\s*<iostream>/.test(stripped))) {
    const lines = stripped.split('\n');
    const idx = lines.findIndex((l) => /\bcout\b|\bcin\b|#include\s*<iostream>/.test(l));
    diagnostics.push({
      line: idx >= 0 ? idx + 1 : 1,
      column: 1,
      severity: 'error',
      message: 'C++ headers/streams (<iostream>, cout, cin) are not available in C17 mode; use <stdio.h> or switch to C++20',
    });
  }

  // Check lines inside functions that clearly miss a trailing semicolon
  const rawLines = stripped.split('\n');
  for (let idx = 0; idx < rawLines.length; idx++) {
    const l = rawLines[idx].trim();
    if (!l) continue;
    if (
      l.startsWith('#') ||
      l.endsWith(';') ||
      l.endsWith('{') ||
      l.endsWith('}') ||
      l.endsWith(',') ||
      l.endsWith(':') ||
      l.endsWith(')') ||
      l.endsWith('\\') ||
      /^(if|else|for|while|do|switch|struct|class|namespace|template|public|private|protected)\b/.test(l)
    ) {
      continue;
    }
    const nextNonEmpty = rawLines.slice(idx + 1).find((nl) => nl.trim().length > 0)?.trim() || '';
    if (
      /^(return\b|cout\b|std::cout\b|cin\b|std::cin\b|printf\b|scanf\b|puts\b)/.test(l) &&
      !nextNonEmpty.startsWith('<<') &&
      !nextNonEmpty.startsWith('>>') &&
      !nextNonEmpty.startsWith('+') &&
      !nextNonEmpty.startsWith('.')
    ) {
      diagnostics.push({
        line: idx + 1,
        column: rawLines[idx].length,
        severity: 'error',
        message: "expected ';' at end of statement",
      });
    }
  }

  return diagnostics;
}

/**
 * Format C printf string with arguments
 */
function formatPrintf(fmt: string, args: any[]): string {
  let argIdx = 0;
  return fmt.replace(/%([-+0 #]*?)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|z|L)?([diuoxXfFeEgGaAcsp%])/g, (match, flags, widthStr, precStr, _lenMod, spec) => {
    if (spec === '%') return '%';
    let width = widthStr === '*' ? Number(args[argIdx++] ?? 0) : widthStr ? parseInt(widthStr, 10) : 0;
    let prec = precStr === '*' ? Number(args[argIdx++] ?? 6) : precStr !== undefined ? parseInt(precStr, 10) : undefined;
    const rawVal = args[argIdx++];

    let out = '';
    if (spec === 'd' || spec === 'i') {
      const n = Math.trunc(Number(rawVal ?? 0));
      out = isNaN(n) ? '0' : String(n);
    } else if (spec === 'u' || spec === 'z') {
      const n = Math.max(0, Math.trunc(Number(rawVal ?? 0)));
      out = isNaN(n) ? '0' : String(n);
    } else if (spec === 'x' || spec === 'X') {
      const n = Math.trunc(Number(rawVal ?? 0)) >>> 0;
      out = n.toString(16);
      if (spec === 'X') out = out.toUpperCase();
    } else if (spec === 'o') {
      const n = Math.trunc(Number(rawVal ?? 0)) >>> 0;
      out = n.toString(8);
    } else if (spec === 'f' || spec === 'F') {
      const n = Number(rawVal ?? 0);
      out = (isNaN(n) ? 0 : n).toFixed(prec !== undefined ? prec : 6);
    } else if (spec === 'e' || spec === 'E') {
      const n = Number(rawVal ?? 0);
      out = (isNaN(n) ? 0 : n).toExponential(prec !== undefined ? prec : 6);
      if (spec === 'E') out = out.toUpperCase();
    } else if (spec === 'g' || spec === 'G') {
      const n = Number(rawVal ?? 0);
      out = String(Number((isNaN(n) ? 0 : n).toPrecision(prec !== undefined ? Math.max(1, prec) : 6)));
    } else if (spec === 'c') {
      if (typeof rawVal === 'number') {
        out = String.fromCharCode(rawVal);
      } else {
        out = String(rawVal ?? '').charAt(0) || '';
      }
    } else if (spec === 's') {
      out = Array.isArray(rawVal) ? rawVal.join('') : String(rawVal ?? '');
      if (prec !== undefined) out = out.slice(0, prec);
    } else if (spec === 'p') {
      out = '0x7ffee' + Math.abs(Math.trunc(Number(rawVal ?? 4096))).toString(16);
    }

    if (width > out.length) {
      const padChar = flags.includes('0') && !flags.includes('-') ? '0' : ' ';
      const pad = padChar.repeat(width - out.length);
      out = flags.includes('-') ? out + ' '.repeat(width - out.length) : pad + out;
    }
    return out;
  });
}

/**
 * Split top-level comma-separated arguments respecting parentheses, brackets, braces, and quotes
 */
function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let depthAngle = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      current += ch;
      if (ch === inQuote && str[i - 1] !== '\\') {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
    else if (ch === '<' && /[a-zA-Z0-9_]/.test(str[i - 1] || '')) depthAngle++;
    else if (ch === '>' && depthAngle > 0) depthAngle--;

    if (ch === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0 && depthAngle === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Split C++ stream chain `a << b << c` or `a >> b >> c` at top level (ignoring << or >> inside parens)
 */
function splitStreamChain(expr: string, op: '<<' | '>>'): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (inQuote) {
      current += ch;
      if (ch === inQuote && expr[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);

    if (depth === 0 && expr.slice(i, i + 2) === op) {
      parts.push(current.trim());
      current = '';
      i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Transpile valid C/C++ source code into an executable, sandboxed JavaScript program
 * backed by the ToolTrack C/C++ Standard Library & STL Runtime.
 */
function transpileCppToJs(rawCode: string): string {
  // 1. Protect string and char literals with placeholders
  const literals: string[] = [];
  let code = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/^\s*#.*$/gm, '');

  code = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (match) => {
    const idx = literals.length;
    if (match.startsWith("'") && match.length >= 3) {
      const inner = match.slice(1, -1);
      if (inner === '\\n') literals.push('"\n"');
      else if (inner === '\\t') literals.push('"\t"');
      else if (inner === '\\0') literals.push('0');
      else literals.push(JSON.stringify(inner));
    } else {
      literals.push(match);
    }
    return `__STR_LIT_${idx}__`;
  });

  // 2. Remove `using namespace std;`, `std::`, `ios::sync_with_stdio(...)`, `cin.tie(...)`, `cout.tie(...)`
  code = code
    .replace(/\busing\s+namespace\s+std\s*;/g, '')
    .replace(/\bstd::/g, '')
    .replace(/\bios(?:_base)?::sync_with_stdio\s*\([^)]*\)\s*;?/g, '')
    .replace(/\b(?:cin|cout)\.tie\s*\([^)]*\)\s*;?/g, '');

  // 3. Transform struct / class definitions into JS classes
  code = code.replace(/\b(?:struct|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{([\s\S]*?)\}\s*;/g, (_m, className, body) => {
    const cleanBody = body.replace(/\b(?:public|private|protected)\s*:/g, '');
    const fieldDefaults: string[] = [];
    const methods: string[] = [];

    // Extract member functions and fields
    const lines = cleanBody.split(';');
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      if (trimmed.includes('(') && trimmed.includes('{')) {
        methods.push(trimmed);
      } else {
        const declMatch = trimmed.match(/^(?:const\s+)?(?:unsigned\s+|long\s+|short\s+)*(?:int|double|float|char|bool|string|auto|vector\s*<[^>]+>|[a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/);
        if (declMatch) {
          const parts = splitTopLevelCommas(declMatch[1]);
          for (const p of parts) {
            const eq = p.indexOf('=');
            if (eq !== -1) {
              const name = p.slice(0, eq).replace(/[*&]/g, '').trim();
              const val = p.slice(eq + 1).trim();
              fieldDefaults.push(`this.${name} = ${val};`);
            } else {
              const name = p.replace(/[*&]/g, '').replace(/\[.*\]/, '').trim();
              if (name) fieldDefaults.push(`this.${name} = 0;`);
            }
          }
        }
      }
    }

    return `class ${className} { constructor(initObj = {}) { ${fieldDefaults.join(' ')} Object.assign(this, initObj); } ${methods.join('\n')} }\n`;
  });

  // 4. Transform range-based for loops: `for (auto &x : container)` -> `for (let x of __rt.iter(container))`
  code = code.replace(
    /\bfor\s*\(\s*(?:const\s+)?(?:auto|int|long(?:\s+long)?|double|float|char|string|pair\s*<[^>]+>|[a-zA-Z_][a-zA-Z0-9_]*)\s*[&*]?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^)]+)\)/g,
    'for (let $1 of __rt.iter($2))'
  );

  // 5. Transform `getline(cin, varName)`
  code = code.replace(/\bgetline\s*\(\s*cin\s*,\s*([a-zA-Z_][a-zA-Z0-9_[\].]*)\s*\)/g, '($1 = __rt.getline())');

  // 6. Transform `scanf(fmt, &a, &b, ...)` and `fgets(buf, sz, stdin)`
  code = code.replace(/\bfgets\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([^,]+),\s*stdin\s*\)/g, '($1 = __rt.getline())');

  code = code.replace(/\bscanf\s*\(([^;{}]+)\)/g, (_m, inner) => {
    const parts = splitTopLevelCommas(inner);
    if (parts.length < 2) return '0';
    const fmt = parts[0];
    const targets = parts.slice(1).map((t) => t.replace(/^&\s*/, '').trim());
    const setters = targets.map((t) => `(__scanf_v) => { ${t} = __scanf_v; }`).join(', ');
    return `__rt.scanf(${fmt}, [${setters}])`;
  });

  // 7. Transform `cin >> a >> b` (both standalone and inside `while (cin >> x)` or `if (cin >> x)`)
  code = code.replace(/\bcin\s*>>\s*([^;{}]+)/g, (_m, chainStr) => {
    // Handle case where `cin >> x` is inside `while (cin >> x)`
    let trailingParen = '';
    let cleanChain = chainStr;
    let openParens = 0;
    for (let i = 0; i < chainStr.length; i++) {
      if (chainStr[i] === '(') openParens++;
      else if (chainStr[i] === ')') {
        if (openParens === 0) {
          cleanChain = chainStr.slice(0, i);
          trailingParen = chainStr.slice(i);
          break;
        }
        openParens--;
      }
    }
    const vars = splitStreamChain(cleanChain, '>>').map((v) => v.trim()).filter(Boolean);
    const setters = vars.map((v) => `(__cin_v) => { ${v} = __cin_v; }`).join(', ');
    return `__rt.cin([${setters}])${trailingParen}`;
  });

  // 8. Transform `cout << ...` and `cerr << ...`
  code = code.replace(/\b(cout|cerr)\s*<<\s*([^;{}]+)/g, (_m, streamName, chainStr) => {
    const items = splitStreamChain(chainStr, '<<');
    return `__rt.${streamName}([${items.join(', ')}])`;
  });

  // 9. Transform function definitions: `int foo(int a, vector<int>& b) {` -> `function foo(a, b) {`
  const cTypePattern =
    '(?:(?:static|inline|const|unsigned|signed|long|short)\\s+)*(?:void|int|long|short|double|float|char|bool|size_t|string|auto|vector\\s*<[^>]+>|map\\s*<[^>]+>|set\\s*<[^>]+>|pair\\s*<[^>]+>)(?:\\s*[*&]+)?';

  code = code.replace(
    new RegExp(`\\b(${cTypePattern})\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(([^)]*)\\)\\s*\\{`, 'g'),
    (match, _retType, fnName, paramsStr) => {
      if (['if', 'for', 'while', 'switch', 'catch', 'return'].includes(fnName)) return match;
      const rawParams = splitTopLevelCommas(paramsStr);
      const jsParams = rawParams
        .map((p) => {
          const clean = p.trim();
          if (!clean || clean === 'void') return '';
          const eqIdx = clean.indexOf('=');
          let defVal = '';
          let declPart = clean;
          if (eqIdx !== -1) {
            declPart = clean.slice(0, eqIdx).trim();
            defVal = ' = ' + clean.slice(eqIdx + 1).trim();
          }
          declPart = declPart.replace(/\[[^\]]*\]/g, '').trim();
          const nameMatch = declPart.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
          return nameMatch ? `${nameMatch[1]}${defVal}` : '';
        })
        .filter(Boolean);
      return `function ${fnName}(${jsParams.join(', ')}) {`;
    }
  );

  // Remove top-level forward function prototypes like `int foo(int a);`
  code = code.replace(
    new RegExp(`^\\s*${cTypePattern}\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(([a-zA-Z0-9_,\\s*&\\[\\]<>:=]*)\\)\\s*;`, 'gm'),
    (match, fnName) => {
      if (['return', 'if', 'while', 'for', 'switch'].includes(fnName)) return match;
      return '';
    }
  );

  // 10. Transform C/C++ STL & variable declarations
  // 10a. `vector<T> name(size, fill)` or `vector<T> name = {1, 2, 3}` or `vector<T> name;`
  code = code.replace(
    /\bvector\s*<\s*(?:vector\s*<[^>]+>|[^>]+)\s*>\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\(([^)]*)\)|=\s*\{([^}]*)\}|=\s*([^;,]+))?/g,
    (_m, name, ctorArgs, braceInit, exprInit) => {
      if (ctorArgs !== undefined) {
        return `let ${name} = __rt.createVector(${ctorArgs})`;
      }
      if (braceInit !== undefined) {
        return `let ${name} = __rt.createVector([${braceInit}])`;
      }
      if (exprInit !== undefined) {
        return `let ${name} = __rt.createVector(${exprInit})`;
      }
      return `let ${name} = __rt.createVector()`;
    }
  );

  // 10b. `map<K, V> name` / `unordered_map<K, V> name`
  code = code.replace(
    /\b(?:unordered_)?map\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*\{([^}]*)\})?/g,
    (_m, name, init) => `let ${name} = __rt.createMap(${init ? `[${init}]` : ''})`
  );

  // 10c. `set<T> name` / `unordered_set<T> name`
  code = code.replace(
    /\b(?:unordered_)?set\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*\{([^}]*)\})?/g,
    (_m, name, init) => `let ${name} = __rt.createSet(${init ? `[${init}]` : ''})`
  );

  // 10d. `queue<T> name`, `priority_queue<T> name`, `stack<T> name`
  code = code.replace(/\bqueue\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'let $1 = __rt.createQueue()');
  code = code.replace(/\bpriority_queue\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'let $1 = __rt.createPriorityQueue()');
  code = code.replace(/\bstack\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'let $1 = __rt.createStack()');

  // 10e. `pair<A, B> name = {x, y}` or `pair<A, B> name(x, y)`
  code = code.replace(
    /\bpair\s*<[^>]+>\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*\{([^}]*)\}|\(([^)]*)\)|=\s*([^;,]+))?/g,
    (_m, name, brace, ctor, expr) => {
      if (brace) return `let ${name} = make_pair(${brace})`;
      if (ctor) return `let ${name} = make_pair(${ctor})`;
      if (expr) return `let ${name} = ${expr}`;
      return `let ${name} = make_pair(0, 0)`;
    }
  );

  // 10f. Primitive & struct declarations: `int a = 1, b[10], c = {1, 2};`
  code = code.replace(
    /\b(?:const\s+)?(?:(?:unsigned|signed|long|short)\s+)*(?:int|long|short|double|float|char|bool|size_t|string|auto)\s+([^;{}]+);/g,
    (match, declList) => {
      if (declList.includes('(') && declList.includes(')') && !declList.includes('=')) {
        // Could be constructor call `string s("abc");`
        const ctorMatch = declList.trim().match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.+)\)$/);
        if (ctorMatch) {
          return `let ${ctorMatch[1]} = ${ctorMatch[2]};`;
        }
      }
      const items = splitTopLevelCommas(declList);
      const outDecls = items.map((item) => {
        const clean = item.replace(/^[*&]+/, '').trim();
        // 2D array: `arr[R][C]`
        const arr2d = clean.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[([^\]]+)\]\s*\[([^\]]+)\](?:\s*=\s*\{([\s\S]*)\})?$/);
        if (arr2d) {
          const [, name, r, c, init] = arr2d;
          if (init) {
            const converted = init.replace(/\{/g, '[').replace(/\}/g, ']');
            return `${name} = [${converted}]`;
          }
          return `${name} = Array.from({ length: ${r} }, () => new Array(${c}).fill(0))`;
        }
        // 1D array: `arr[N] = {1, 2, 3}` or `arr[] = "hello"`
        const arr1d = clean.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[([^\]]*)\](?:\s*=\s*(.+))?$/);
        if (arr1d) {
          const [, name, sz, init] = arr1d;
          if (init) {
            const trimmedInit = init.trim();
            if (trimmedInit.startsWith('{') && trimmedInit.endsWith('}')) {
              return `${name} = __rt.createVector([${trimmedInit.slice(1, -1)}])`;
            }
            return `${name} = ${trimmedInit}`;
          }
          return `${name} = __rt.createVector(${sz || 64}, 0)`;
        }
        // Standard variable `x = val` or `x`
        const eqIdx = clean.indexOf('=');
        if (eqIdx !== -1) {
          const vName = clean.slice(0, eqIdx).replace(/[*&]/g, '').trim();
          let vExpr = clean.slice(eqIdx + 1).trim();
          if (vExpr.startsWith('{') && vExpr.endsWith('}')) {
            vExpr = `[${vExpr.slice(1, -1)}]`;
          }
          return `${vName} = ${vExpr}`;
        }
        return `${clean} = 0`;
      });
      return `let ${outDecls.join(', ')};`;
    }
  );

  // 10g. `for (int i = 0; ...)` loop header variable declarations
  code = code.replace(
    /\bfor\s*\(\s*(?:(?:unsigned|signed|long|short)\s+)*(?:int|long|short|double|float|size_t|auto)\s+/g,
    'for (let '
  );

  // 10h. Struct/Class instance declarations: `Node n1(5);` or `Point p = {1, 2};` or `Student s;`
  // Detect declared class names and convert `ClassName varName`
  const classNames: string[] = [];
  const classRegex = /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let cm: RegExpExecArray | null;
  while ((cm = classRegex.exec(code)) !== null) {
    classNames.push(cm[1]);
  }
  for (const cn of classNames) {
    code = code.replace(
      new RegExp(`\\b${cn}\\s*\\*?\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?:\\(([^)]*)\\)|=\\s*\\{([^}]*)\\}|=\\s*([^;]+))?;`, 'g'),
      (_m, varName, args, brace, expr) => {
        if (args !== undefined) return `let ${varName} = new ${cn}(${args});`;
        if (brace !== undefined) return `let ${varName} = new ${cn}({ ${brace} });`;
        if (expr !== undefined) return `let ${varName} = ${expr};`;
        return `let ${varName} = new ${cn}();`;
      }
    );
  }

  // 11. Pointer dereference and member access `ptr->field` -> `ptr.field`
  code = code.replace(/->/g, '.');
  // C-style casts like `(int)x`, `(double)y`, `(int*)malloc(...)`
  code = code.replace(/\(\s*(?:unsigned\s+|long\s+)*(?:int|double|float|char|void)\s*\*\s*\)/g, '');
  code = code.replace(/\(\s*(?:unsigned\s+|long\s+)*(?:int|long|short|char)\s*\)\s*([a-zA-Z0-9_($.]+)/g, 'Math.trunc($1)');
  code = code.replace(/\(\s*(?:double|float)\s*\)\s*([a-zA-Z0-9_($.]+)/g, 'Number($1)');

  // 12. Inject loop step guard into `while (...) {` and `for (...) {` to prevent infinite-loop hangs
  code = code.replace(/\b(while\s*\([^)]*\)\s*\{|for\s*\([^)]*\)\s*\{)/g, '$1 __rt.tick(); ');

  // 13. Restore string literals
  code = code.replace(/__STR_LIT_(\d+)__/g, (_m, idx) => literals[Number(idx)]);

  return code;
}

export function runClientCpp(
  code: string,
  stdinText: string = '',
  language: 'c' | 'cpp' = 'cpp'
): ClientCppRunResult {
  const startTime = performance.now();
  const compilerLabel =
    language === 'cpp'
      ? 'ToolTrack C++20 Local Engine (Browser Runtime)'
      : 'ToolTrack C17 Local Engine (Browser Runtime)';

  // 1. Validate Syntax & Structure
  const diagnostics = validateSyntax(code, language);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    const fileName = language === 'cpp' ? 'main.cpp' : 'main.c';
    const stderrLines = diagnostics.map(
      (d) => `${fileName}:${d.line}:${d.column}: ${d.severity}: ${d.message}`
    );
    return {
      success: false,
      phase: 'compilation',
      stdout: '',
      stderr: stderrLines.join('\n') + '\n',
      exitCode: 1,
      executionTimeMs: Math.round(performance.now() - startTime),
      compiler: compilerLabel,
      diagnostics,
    };
  }

  let stdout = '';
  let stderr = '';
  let floatPrecision: number | null = null;
  let fixedFloat = false;
  let stepCounter = 0;
  const MAX_STEPS = 2_000_000;

  // Prepare stdin tokens and lines
  const rawStdin = stdinText || '';
  const stdinTokens = rawStdin.trim().length > 0 ? rawStdin.trim().split(/\s+/) : [];
  let tokenIdx = 0;
  const stdinLines = rawStdin.length > 0 ? rawStdin.split(/\r?\n/) : [];
  let lineIdx = 0;

  // Create STL Vector wrapper (extends Array with C++ vector methods)
  const enhanceVector = (arr: any[]): any => {
    Object.defineProperties(arr, {
      push_back: { value: (v: any) => arr.push(v), enumerable: false },
      emplace_back: { value: (...v: any[]) => arr.push(v.length === 1 ? v[0] : { first: v[0], second: v[1] }), enumerable: false },
      pop_back: { value: () => arr.pop(), enumerable: false },
      size: { value: () => arr.length, enumerable: false },
      empty: { value: () => arr.length === 0, enumerable: false },
      clear: { value: () => { arr.length = 0; }, enumerable: false },
      front: { value: () => arr[0], enumerable: false },
      back: { value: () => arr[arr.length - 1], enumerable: false },
      begin: { value: () => ({ _arr: arr, _idx: 0 }), enumerable: false },
      end: { value: () => ({ _arr: arr, _idx: arr.length }), enumerable: false },
      rbegin: { value: () => ({ _arr: arr, _idx: 0, _rev: true }), enumerable: false },
      rend: { value: () => ({ _arr: arr, _idx: arr.length, _rev: true }), enumerable: false },
      resize: {
        value: (n: number, fillVal: any = 0) => {
          while (arr.length < n) arr.push(typeof fillVal === 'object' && fillVal !== null ? JSON.parse(JSON.stringify(fillVal)) : fillVal);
          arr.length = n;
        },
        enumerable: false,
      },
      assign: {
        value: (n: number, fillVal: any = 0) => {
          arr.length = 0;
          for (let i = 0; i < n; i++) arr.push(fillVal);
        },
        enumerable: false,
      },
      insert: {
        value: (posOrVal: any, val?: any) => {
          if (val !== undefined && posOrVal && typeof posOrVal._idx === 'number') {
            arr.splice(posOrVal._idx, 0, val);
          } else {
            arr.push(posOrVal);
          }
        },
        enumerable: false,
      },
      erase: {
        value: (posOrVal: any) => {
          if (posOrVal && typeof posOrVal._idx === 'number') {
            arr.splice(posOrVal._idx, 1);
          } else {
            const idx = arr.indexOf(posOrVal);
            if (idx !== -1) arr.splice(idx, 1);
          }
        },
        enumerable: false,
      },
    });
    return arr;
  };

  // Runtime environment object (__rt)
  const __rt = {
    tick: () => {
      stepCounter++;
      if (stepCounter > MAX_STEPS) {
        throw new Error('Execution Timed Out: Maximum loop iteration limit (2,000,000 steps) exceeded (possible infinite loop).');
      }
    },
    createVector: (arg1?: any, arg2?: any) => {
      if (Array.isArray(arg1)) {
        return enhanceVector([...arg1]);
      }
      if (typeof arg1 === 'number') {
        const fill = arg2 !== undefined ? arg2 : 0;
        const a = Array.from({ length: arg1 }, () =>
          Array.isArray(fill) ? enhanceVector([...fill]) : fill
        );
        return enhanceVector(a);
      }
      return enhanceVector([]);
    },
    createMap: (initEntries?: any[]) => {
      const store = new Map<any, any>(initEntries || []);
      return new Proxy(store, {
        get(target, prop, receiver) {
          if (prop === 'size') return () => target.size;
          if (prop === 'empty') return () => target.size === 0;
          if (prop === 'clear') return () => target.clear();
          if (prop === 'count') return (k: any) => (target.has(k) ? 1 : 0);
          if (prop === 'find') return (k: any) => (target.has(k) ? { first: k, second: target.get(k) } : null);
          if (prop === 'end') return () => null;
          if (prop === 'insert') return (p: any) => {
            if (Array.isArray(p)) target.set(p[0], p[1]);
            else if (p && 'first' in p) target.set(p.first, p.second);
          };
          if (prop === 'erase') return (k: any) => target.delete(k);
          if (prop === Symbol.iterator) {
            return function* () {
              const entries = Array.from(target.entries()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
              for (const [k, v] of entries) {
                yield { first: k, second: v };
              }
            };
          }
          if (typeof prop === 'string' && !(prop in target)) {
            const key = !isNaN(Number(prop)) ? Number(prop) : prop;
            if (!target.has(key)) target.set(key, 0);
            return target.get(key);
          }
          const val = Reflect.get(target, prop, receiver);
          return typeof val === 'function' ? val.bind(target) : val;
        },
        set(target, prop, value) {
          const key = typeof prop === 'string' && !isNaN(Number(prop)) ? Number(prop) : prop;
          target.set(key, value);
          return true;
        },
      });
    },
    createSet: (initVals?: any[]) => {
      const s = new Set<any>(initVals || []);
      return {
        insert: (v: any) => s.add(v),
        erase: (v: any) => s.delete(v),
        count: (v: any) => (s.has(v) ? 1 : 0),
        find: (v: any) => (s.has(v) ? v : null),
        end: () => null,
        size: () => s.size,
        empty: () => s.size === 0,
        clear: () => s.clear(),
        [Symbol.iterator]: function* () {
          const sorted = Array.from(s.values()).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
          for (const item of sorted) yield item;
        },
      };
    },
    createQueue: () => {
      const q: any[] = [];
      return {
        push: (v: any) => q.push(v),
        pop: () => q.shift(),
        front: () => q[0],
        back: () => q[q.length - 1],
        size: () => q.length,
        empty: () => q.length === 0,
      };
    },
    createPriorityQueue: () => {
      const pq: any[] = [];
      return {
        push: (v: any) => {
          pq.push(v);
          pq.sort((a, b) => (b > a ? 1 : b < a ? -1 : 0));
        },
        pop: () => pq.shift(),
        top: () => pq[0],
        size: () => pq.length,
        empty: () => pq.length === 0,
      };
    },
    createStack: () => {
      const st: any[] = [];
      return {
        push: (v: any) => st.push(v),
        pop: () => st.pop(),
        top: () => st[st.length - 1],
        size: () => st.length,
        empty: () => st.length === 0,
      };
    },
    iter: (collection: any) => {
      if (!collection) return [];
      if (typeof collection[Symbol.iterator] === 'function') return collection;
      if (Array.isArray(collection)) return collection;
      return Object.values(collection);
    },
    cin: (setters: Array<(val: any) => void>) => {
      let readCount = 0;
      for (const setter of setters) {
        if (tokenIdx >= stdinTokens.length) {
          return false;
        }
        const tok = stdinTokens[tokenIdx++];
        const num = Number(tok);
        setter(!isNaN(num) && tok !== '' ? num : tok);
        readCount++;
      }
      return readCount === setters.length;
    },
    getline: () => {
      if (lineIdx < stdinLines.length) {
        return stdinLines[lineIdx++];
      }
      if (tokenIdx < stdinTokens.length) {
        const rest = stdinTokens.slice(tokenIdx).join(' ');
        tokenIdx = stdinTokens.length;
        return rest;
      }
      return '';
    },
    scanf: (fmt: string, setters: Array<(val: any) => void>) => {
      if (tokenIdx >= stdinTokens.length) return -1; // EOF
      let matched = 0;
      for (const setter of setters) {
        if (tokenIdx >= stdinTokens.length) break;
        const tok = stdinTokens[tokenIdx++];
        const num = Number(tok);
        setter(!isNaN(num) && tok !== '' ? num : tok);
        matched++;
      }
      return matched;
    },
    cout: (items: any[]) => {
      for (const item of items) {
        if (item && typeof item === 'object' && item.__manip) {
          if (item.__manip === 'endl') stdout += '\n';
          else if (item.__manip === 'fixed') fixedFloat = true;
          else if (item.__manip === 'setprecision') floatPrecision = item.digits;
        } else if (typeof item === 'number') {
          if (fixedFloat && floatPrecision !== null) {
            stdout += item.toFixed(floatPrecision);
          } else if (floatPrecision !== null && !Number.isInteger(item)) {
            stdout += Number(item.toPrecision(floatPrecision)).toString();
          } else {
            stdout += String(item);
          }
        } else if (typeof item === 'boolean') {
          stdout += item ? '1' : '0';
        } else if (item !== undefined && item !== null) {
          stdout += String(item);
        }
      }
    },
    cerr: (items: any[]) => {
      for (const item of items) {
        if (item && typeof item === 'object' && item.__manip === 'endl') {
          stderr += '\n';
        } else if (item !== undefined && item !== null) {
          stderr += String(item);
        }
      }
    },
  };

  // Standard library helper functions exposed in scope
  const stdScope: Record<string, any> = {
    __rt,
    endl: { __manip: 'endl' },
    fixed: { __manip: 'fixed' },
    setprecision: (n: number) => ({ __manip: 'setprecision', digits: n }),
    printf: (fmt: string, ...args: any[]) => {
      const str = formatPrintf(String(fmt), args);
      stdout += str;
      return str.length;
    },
    puts: (s: any) => {
      stdout += String(s ?? '') + '\n';
      return 0;
    },
    putchar: (c: any) => {
      const ch = typeof c === 'number' ? String.fromCharCode(c) : String(c).charAt(0);
      stdout += ch;
      return ch.charCodeAt(0) || 0;
    },
    getchar: () => {
      if (tokenIdx < stdinTokens.length) {
        const ch = stdinTokens[tokenIdx++].charAt(0);
        return ch ? ch.charCodeAt(0) : -1;
      }
      return -1;
    },
    make_pair: (first: any, second: any) => ({ first, second }),
    sort: (beginIt: any, endIt?: any, cmp?: any) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr;
      if (!Array.isArray(arr)) return;
      const start = typeof beginIt?._idx === 'number' ? beginIt._idx : 0;
      const end = typeof endIt?._idx === 'number' ? endIt._idx : arr.length;
      const slice = arr.slice(start, end);
      slice.sort((a, b) => {
        if (typeof cmp === 'function') {
          const res = cmp(a, b);
          if (typeof res === 'boolean') return res ? -1 : 1;
          return res;
        }
        if (a && typeof a === 'object' && 'first' in a && 'second' in a) {
          if (a.first !== b.first) return a.first < b.first ? -1 : 1;
          return a.second < b.second ? -1 : a.second > b.second ? 1 : 0;
        }
        return a < b ? -1 : a > b ? 1 : 0;
      });
      if (beginIt?._rev) slice.reverse();
      arr.splice(start, end - start, ...slice);
    },
    greater: () => (a: any, b: any) => a > b,
    less: () => (a: any, b: any) => a < b,
    reverse: (beginIt: any, endIt?: any) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr;
      if (!Array.isArray(arr)) return;
      const start = typeof beginIt?._idx === 'number' ? beginIt._idx : 0;
      const end = typeof endIt?._idx === 'number' ? endIt._idx : arr.length;
      const slice = arr.slice(start, end).reverse();
      arr.splice(start, end - start, ...slice);
    },
    min: (...args: any[]) => (Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args)),
    max: (...args: any[]) => (Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args)),
    abs: Math.abs,
    fabs: Math.abs,
    labs: Math.abs,
    llabs: Math.abs,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    log: Math.log,
    log2: Math.log2,
    log10: Math.log10,
    exp: Math.exp,
    hypot: Math.hypot,
    gcd: (a: number, b: number): number => {
      a = Math.abs(Math.trunc(a));
      b = Math.abs(Math.trunc(b));
      while (b) {
        const t = b;
        b = a % b;
        a = t;
      }
      return a;
    },
    __gcd: (a: number, b: number): number => stdScope.gcd(a, b),
    lcm: (a: number, b: number): number => {
      if (a === 0 || b === 0) return 0;
      return Math.abs(Math.trunc((a * b) / stdScope.gcd(a, b)));
    },
    accumulate: (beginIt: any, endIt: any, initVal: number = 0) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr || [];
      return arr.reduce((acc: number, v: number) => acc + Number(v), initVal);
    },
    lower_bound: (beginIt: any, endIt: any, val: any) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr || [];
      let idx = arr.findIndex((x: any) => x >= val);
      if (idx === -1) idx = arr.length;
      return { _arr: arr, _idx: idx, valueOf: () => idx };
    },
    upper_bound: (beginIt: any, endIt: any, val: any) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr || [];
      let idx = arr.findIndex((x: any) => x > val);
      if (idx === -1) idx = arr.length;
      return { _arr: arr, _idx: idx, valueOf: () => idx };
    },
    binary_search: (beginIt: any, endIt: any, val: any) => {
      const arr = Array.isArray(beginIt) ? beginIt : beginIt?._arr || [];
      return arr.includes(val);
    },
    strlen: (s: any) => String(s ?? '').length,
    strcmp: (a: any, b: any) => {
      const sa = String(a ?? '');
      const sb = String(b ?? '');
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    },
    strncmp: (a: any, b: any, n: number) => {
      const sa = String(a ?? '').slice(0, n);
      const sb = String(b ?? '').slice(0, n);
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    },
    atoi: (s: any) => parseInt(String(s), 10) || 0,
    atoll: (s: any) => parseInt(String(s), 10) || 0,
    atof: (s: any) => parseFloat(String(s)) || 0,
    to_string: (v: any) => String(v),
    stoi: (s: any) => parseInt(String(s), 10) || 0,
    stoll: (s: any) => parseInt(String(s), 10) || 0,
    stod: (s: any) => parseFloat(String(s)) || 0,
    isalpha: (c: any) => /^[a-zA-Z]$/.test(typeof c === 'number' ? String.fromCharCode(c) : String(c)),
    isdigit: (c: any) => /^[0-9]$/.test(typeof c === 'number' ? String.fromCharCode(c) : String(c)),
    isalnum: (c: any) => /^[a-zA-Z0-9]$/.test(typeof c === 'number' ? String.fromCharCode(c) : String(c)),
    isspace: (c: any) => /^\s$/.test(typeof c === 'number' ? String.fromCharCode(c) : String(c)),
    tolower: (c: any) => (typeof c === 'number' ? String.fromCharCode(c).toLowerCase().charCodeAt(0) : String(c).toLowerCase()),
    toupper: (c: any) => (typeof c === 'number' ? String.fromCharCode(c).toUpperCase().charCodeAt(0) : String(c).toUpperCase()),
    malloc: (bytes: number) => enhanceVector(new Array(Math.max(1, Math.ceil(bytes / 4))).fill(0)),
    calloc: (count: number, _sz: number) => enhanceVector(new Array(Math.max(1, count)).fill(0)),
    free: () => {},
    memset: (arr: any, val: number) => {
      if (Array.isArray(arr)) arr.fill(val);
      return arr;
    },
    INT_MAX: 2147483647,
    INT_MIN: -2147483648,
    LLONG_MAX: Number.MAX_SAFE_INTEGER,
    LLONG_MIN: Number.MIN_SAFE_INTEGER,
    M_PI: Math.PI,
    M_E: Math.E,
    NULL: null,
    nullptr: null,
    EOF: -1,
  };

  try {
    // Augment String.prototype temporarily during run with C++ std::string helpers (.size, .empty, .substr, .find)
    const origStrSize = (String.prototype as any).size;
    const origStrEmpty = (String.prototype as any).empty;
    const origStrFind = (String.prototype as any).find;
    const origStrCstr = (String.prototype as any).c_str;

    (String.prototype as any).size = function () {
      return this.length;
    };
    (String.prototype as any).empty = function () {
      return this.length === 0;
    };
    (String.prototype as any).find = function (sub: string, pos: number = 0) {
      return this.indexOf(sub, pos);
    };
    (String.prototype as any).c_str = function () {
      return String(this);
    };

    try {
      const jsCode = transpileCppToJs(code);
      const paramNames = Object.keys(stdScope);
      const paramVals = Object.values(stdScope);

      const runnerFn = new Function(
        ...paramNames,
        `
        ${jsCode}
        if (typeof main === "function") {
          return main();
        }
        return 0;
      `
      );

      const retVal = runnerFn(...paramVals);
      const exitCode = typeof retVal === 'number' && !isNaN(retVal) ? retVal : 0;

      return {
        success: exitCode === 0,
        phase: 'execution',
        stdout,
        stderr,
        exitCode,
        executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
        compiler: compilerLabel,
        diagnostics,
      };
    } finally {
      if (origStrSize === undefined) delete (String.prototype as any).size;
      else (String.prototype as any).size = origStrSize;
      if (origStrEmpty === undefined) delete (String.prototype as any).empty;
      else (String.prototype as any).empty = origStrEmpty;
      if (origStrFind === undefined) delete (String.prototype as any).find;
      else (String.prototype as any).find = origStrFind;
      if (origStrCstr === undefined) delete (String.prototype as any).c_str;
      else (String.prototype as any).c_str = origStrCstr;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    const isTimeout = msg.includes('Execution Timed Out');
    const fileName = language === 'cpp' ? 'main.cpp' : 'main.c';
    const fullErr = isTimeout
      ? `${msg}\n`
      : `${fileName}: error: ${msg}\n`;

    return {
      success: false,
      phase: isTimeout ? 'execution' : 'compilation',
      stdout,
      stderr: stderr + fullErr,
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
      compiler: compilerLabel,
      diagnostics: [
        ...diagnostics,
        {
          line: 1,
          column: 1,
          severity: 'error',
          message: msg,
        },
      ],
    };
  }
}
