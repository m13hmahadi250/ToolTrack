/**
 * ToolTrack Smart Offline Code Autocomplete & Pattern Engine
 * Context-aware code completion and ghost-text prediction for Python, C, and C++.
 * Includes fuzzy matching for library methods, variables, typos, abbreviations,
 * and adaptive local learning.
 */

export interface CompletionSuggestion {
  text: string;           // The exact full completion snippet or rest-of-line string
  displayText: string;    // Human readable display label
  kind: 'function' | 'method' | 'variable' | 'keyword' | 'snippet' | 'import' | 'pattern';
  detail?: string;        // Short type or module description (e.g., 'pd.DataFrame method')
  documentation?: string; // Extended docstring or explanation
  insertText?: string;    // Override insert text if different from text
  boost?: number;         // Priority ranking score
}

// Memory of accepted completions for local adaptive learning
const LOCAL_STORAGE_KEY = 'tt_accepted_suggestions_v1';

function getAcceptedWeights(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordAcceptedSuggestion(text: string): void {
  try {
    const weights = getAcceptedWeights();
    const key = text.trim();
    weights[key] = (weights[key] || 0) + 1;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weights));
  } catch {}
}

/**
 * Fast Fuzzy Match Scoring Function
 * Returns a score > 0 for match (higher score = better match)
 * Supports prefix matching, subsequence matching, acronyms, and Levenshtein distance typos.
 */
export function fuzzyMatchScore(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  const q = query.toLowerCase().trim();
  const c = candidate.toLowerCase().trim();

  if (!q) return 0;

  // 1. Exact match
  if (q === c) return 100;

  // 2. Exact prefix match
  if (c.startsWith(q)) return 90 + (q.length / c.length) * 5;

  // 3. Substring match
  if (c.includes(q)) return 80;

  // 4. Acronym / Abbreviation match (e.g. `tts` -> `train_test_split`, `std` -> `StandardScaler`)
  const acronym = c
    .split(/[_.\s]/)
    .map((w) => w[0])
    .join('')
    .toLowerCase();
  if (acronym && acronym.startsWith(q)) return 75;

  // 5. Subsequence match (characters appear in order)
  let qIdx = 0;
  let cIdx = 0;
  while (qIdx < q.length && cIdx < c.length) {
    if (q[qIdx] === c[cIdx]) {
      qIdx++;
    }
    cIdx++;
  }
  if (qIdx === q.length) {
    return 65;
  }

  // 6. Typo Tolerance / Levenshtein Distance for inputs >= 3 characters
  if (q.length >= 3) {
    const dist = levenshteinDistance(q, c.slice(0, Math.min(c.length, q.length + 2)));
    if (dist <= 2) {
      return 55 - dist * 10;
    }
  }

  return 0;
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// --- KNOWLEDGE BASE PATTERNS & SNIPPETS ---

// Python Data Science & Core Knowledge Base
const PYTHON_PATTERNS: Array<{
  trigger: RegExp;
  getCompletions: (context: ContextInfo) => CompletionSuggestion[];
}> = [
  // 1. Imports & Aliases
  {
    trigger: /^import\s+pandas\s*$/i,
    getCompletions: () => [
      { text: ' as pd', displayText: 'import pandas as pd', kind: 'import', detail: 'Pandas alias', boost: 20 },
    ],
  },
  {
    trigger: /^import\s+numpy\s*$/i,
    getCompletions: () => [
      { text: ' as np', displayText: 'import numpy as np', kind: 'import', detail: 'NumPy alias', boost: 20 },
    ],
  },
  {
    trigger: /^import\s+matplotlib\s*$/i,
    getCompletions: () => [
      { text: '.pyplot as plt', displayText: 'import matplotlib.pyplot as plt', kind: 'import', detail: 'Pyplot alias', boost: 20 },
    ],
  },
  {
    trigger: /^imp?o?r?t?\s*$/i,
    getCompletions: () => [
      { text: 'import pandas as pd', displayText: 'import pandas as pd', kind: 'import', detail: 'Data analysis & DataFrames', boost: 10 },
      { text: 'import numpy as np', displayText: 'import numpy as np', kind: 'import', detail: 'Multi-dimensional arrays & math', boost: 10 },
      { text: 'import matplotlib.pyplot as plt', displayText: 'import matplotlib.pyplot as plt', kind: 'import', detail: 'Plotting & visualization', boost: 10 },
      { text: 'import os, sys', displayText: 'import os, sys', kind: 'import', detail: 'System & OS utilities', boost: 8 },
      { text: 'import math', displayText: 'import math', kind: 'import', detail: 'Mathematical functions', boost: 8 },
      { text: 'import json', displayText: 'import json', kind: 'import', detail: 'JSON encoder and decoder', boost: 7 },
      { text: 'import random', displayText: 'import random', kind: 'import', detail: 'Random number generation', boost: 7 },
      { text: 'import time', displayText: 'import time', kind: 'import', detail: 'Time access and conversions', boost: 7 },
    ],
  },
  {
    trigger: /^from\s+sklearn\.\s*$/i,
    getCompletions: () => [
      { text: 'model_selection import train_test_split', displayText: 'model_selection import train_test_split', kind: 'import', detail: 'Train/test split', boost: 20 },
      { text: 'preprocessing import StandardScaler', displayText: 'preprocessing import StandardScaler', kind: 'import', detail: 'Feature scaling', boost: 20 },
      { text: 'linear_model import LogisticRegression, LinearRegression', displayText: 'linear_model import LinearRegression...', kind: 'import', detail: 'Linear models', boost: 18 },
      { text: 'ensemble import RandomForestClassifier', displayText: 'ensemble import RandomForestClassifier', kind: 'import', detail: 'Random forest', boost: 18 },
      { text: 'metrics import accuracy_score, classification_report', displayText: 'metrics import accuracy_score...', kind: 'import', detail: 'Evaluation metrics', boost: 18 },
    ],
  },

  // 2. Pandas Methods (`pd.` or `df.`)
  {
    trigger: /\bpd\.$/i,
    getCompletions: () => [
      { text: 'DataFrame(data)', displayText: 'DataFrame(data)', kind: 'method', detail: 'pd.DataFrame', documentation: 'Two-dimensional tabular data.' },
      { text: 'read_csv("dataset.csv")', displayText: 'read_csv(filepath)', kind: 'method', detail: 'pd.read_csv', documentation: 'Read CSV into DataFrame.' },
      { text: 'Series(data)', displayText: 'Series(data)', kind: 'method', detail: 'pd.Series' },
      { text: 'concat([df1, df2], axis=0)', displayText: 'concat([df1, df2])', kind: 'method', detail: 'pd.concat' },
      { text: 'merge(df1, df2, on="key")', displayText: 'merge(df1, df2, on=...)', kind: 'method', detail: 'pd.merge' },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\.[a-zA-Z_0-9]*$/i,
    getCompletions: () => [
      { text: 'head(3)', displayText: 'head(3)', kind: 'method', detail: 'First 3 rows', boost: 25 },
      { text: 'head()', displayText: 'head()', kind: 'method', detail: 'First 5 rows', boost: 20 },
      { text: 'isnull().sum()', displayText: 'isnull().sum()', kind: 'method', detail: 'Count null values per column', boost: 25 },
      { text: 'idxmax()', displayText: 'idxmax()', kind: 'method', detail: 'Index of maximum value', boost: 25 },
      { text: 'describe()', displayText: 'describe()', kind: 'method', detail: 'Descriptive statistics', boost: 20 },
      { text: 'info()', displayText: 'info()', kind: 'method', detail: 'Concise summary of DataFrame', boost: 20 },
      { text: 'fillna(0)', displayText: 'fillna(value)', kind: 'method', detail: 'Fill missing values', boost: 20 },
      { text: 'dropna()', displayText: 'dropna()', kind: 'method', detail: 'Remove missing values', boost: 20 },
      { text: 'groupby("col").mean()', displayText: 'groupby(by)', kind: 'method', detail: 'Group by column', boost: 20 },
      { text: 'to_csv("output.csv", index=False)', displayText: 'to_csv(filepath)', kind: 'method', detail: 'Save to CSV', boost: 20 },
    ],
  },
  {
    trigger: /\b(?:df|data|dataset|frame)\["[^"]+"\]\.[a-zA-Z_0-9]*$/i,
    getCompletions: (ctx) => {
      const match = ctx.linePrefix.match(/\b(?:df|data|dataset|frame)\["([^"]+)"\]/);
      const col = match ? match[1] : 'col';
      return [
        { text: `fillna(df["${col}"].mean())`, displayText: `fillna(df["${col}"].mean())`, kind: 'method', detail: 'Impute missing values with column mean', boost: 30 },
        { text: 'fillna(0)', displayText: 'fillna(0)', kind: 'method', detail: 'Fill missing with 0', boost: 20 },
        { text: 'str.strip().str.title()', displayText: 'str.strip().str.title()', kind: 'method', detail: 'Clean title case string', boost: 25 },
        { text: 'mean()', displayText: 'mean()', kind: 'method', detail: 'Column average', boost: 25 },
      ];
    },
  },

  // 3. Matplotlib Methods (`plt.`)
  {
    trigger: /\bplt\.[a-zA-Z_0-9]*$/i,
    getCompletions: () => [
      { text: 'bar(df["Product"], df["Sales"])', displayText: 'bar(x, y)', kind: 'method', detail: 'Bar chart', boost: 25 },
      { text: 'plot(x, y)', displayText: 'plot(x, y)', kind: 'method', detail: 'Line plot', boost: 20 },
      { text: 'scatter(x, y)', displayText: 'scatter(x, y)', kind: 'method', detail: 'Scatter plot', boost: 20 },
      { text: 'xlabel("Product")', displayText: 'xlabel("Product")', kind: 'method', detail: 'X label', boost: 25 },
      { text: 'ylabel("Sales")', displayText: 'ylabel("Sales")', kind: 'method', detail: 'Y label', boost: 25 },
      { text: 'title("Product vs Sales")', displayText: 'title("Title")', kind: 'method', detail: 'Title', boost: 25 },
      { text: 'show()', displayText: 'show()', kind: 'method', detail: 'Show figure', boost: 30 },
    ],
  },

  // 4. Scikit-Learn Model Preprocessing & Training
  {
    trigger: /\btrain_test_split\($/i,
    getCompletions: () => [
      {
        text: 'X, y, test_size=0.25, random_state=42)',
        displayText: 'X, y, test_size=0.25, random_state=42)',
        kind: 'snippet',
        detail: 'Standard train/test split parameters',
        boost: 30,
      },
    ],
  },
  {
    trigger: /\bscaler\.[a-zA-Z_0-9]*$/i,
    getCompletions: () => [
      { text: 'fit_transform(X_train)', displayText: 'fit_transform(X_train)', kind: 'method', detail: 'Fit and transform X_train', boost: 30 },
      { text: 'transform(X_test)', displayText: 'transform(X_test)', kind: 'method', detail: 'Transform X_test', boost: 30 },
    ],
  },
  {
    trigger: /\bmodel\.[a-zA-Z_0-9]*$/i,
    getCompletions: () => [
      { text: 'fit(X_train_scaled, y_train)', displayText: 'fit(X_train_scaled, y_train)', kind: 'method', detail: 'Fit model on scaled training set', boost: 30 },
      { text: 'predict(X_test_scaled)', displayText: 'predict(X_test_scaled)', kind: 'method', detail: 'Predict target on scaled test set', boost: 30 },
      { text: 'score(X_test_scaled, y_test)', displayText: 'score(...)', kind: 'method', detail: 'Evaluate accuracy score', boost: 25 },
    ],
  },
];

// C / C++ Knowledge Base
const CPP_PATTERNS: Array<{
  trigger: RegExp;
  getCompletions: (context: ContextInfo) => CompletionSuggestion[];
}> = [
  {
    trigger: /^#inc?l?u?d?e?\s*$/i,
    getCompletions: () => [
      { text: '#include <iostream>', displayText: '#include <iostream>', kind: 'import', detail: 'Standard C++ I/O stream' },
      { text: '#include <vector>', displayText: '#include <vector>', kind: 'import', detail: 'Dynamic array container' },
      { text: '#include <string>', displayText: '#include <string>', kind: 'import', detail: 'Std::string class' },
      { text: '#include <algorithm>', displayText: '#include <algorithm>', kind: 'import', detail: 'STL algorithms' },
    ],
  },
  {
    trigger: /^std::[a-zA-Z_0-9]*$/i,
    getCompletions: () => [
      { text: 'cout << ', displayText: 'std::cout <<', kind: 'method', detail: 'Output stream' },
      { text: 'cin >> ', displayText: 'std::cin >>', kind: 'method', detail: 'Input stream' },
      { text: 'vector<int> ', displayText: 'std::vector<T>', kind: 'keyword', detail: 'Dynamic array' },
      { text: 'sort(v.begin(), v.end());', displayText: 'std::sort(...)', kind: 'function', detail: 'Sort elements' },
      { text: 'endl', displayText: 'std::endl', kind: 'keyword', detail: 'Newline and flush' },
    ],
  },
];

export interface ContextInfo {
  language: 'python' | 'cpp' | 'c';
  fullCode: string;
  currentLineText: string;
  linePrefix: string;
  cursorOffset: number;
  importedModules: string[];
  declaredVariables: string[];
}

export function analyzeContext(
  fullCode: string,
  cursorOffset: number,
  language: 'python' | 'cpp' | 'c'
): ContextInfo {
  const linePrefix = fullCode.slice(0, cursorOffset).split('\n').pop() || '';
  const currentLineText = fullCode.slice(0, cursorOffset).split('\n').pop() || '';

  const importedModules: string[] = [];
  const declaredVariables: string[] = [];

  const lines = fullCode.split('\n');

  if (language === 'python') {
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('import ')) {
        const mod = trimmed.replace('import ', '').split(' as ')[0].trim();
        importedModules.push(mod);
      } else if (trimmed.startsWith('from ')) {
        const parts = trimmed.split(' import ');
        if (parts[0]) importedModules.push(parts[0].replace('from ', '').trim());
      }

      const varMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/);
      if (varMatch && !['if', 'elif', 'while', 'for', 'def', 'class', 'import'].includes(varMatch[1])) {
        if (!declaredVariables.includes(varMatch[1])) {
          declaredVariables.push(varMatch[1]);
        }
      }
    }
  } else {
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('#include')) {
        importedModules.push(trimmed);
      }
      const cppVarMatch = trimmed.match(/(?:int|double|float|std::string|char|auto|std::vector<[^>]+>)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (cppVarMatch && cppVarMatch[1]) {
        declaredVariables.push(cppVarMatch[1]);
      }
    }
  }

  return {
    language,
    fullCode,
    currentLineText,
    linePrefix,
    cursorOffset,
    importedModules,
    declaredVariables,
  };
}

/**
 * Predicts the next ghost text completion string based on fuzzy match context & knowledge base.
 */
export function predictGhostText(context: ContextInfo): { textToInsert: string; fullSuggestion: string; kind: string } | null {
  const linePrefix = context.linePrefix;
  const trimmedPrefix = linePrefix.trimStart();

  if (!trimmedPrefix) return null;

  const weights = getAcceptedWeights();
  const patterns = context.language === 'python' ? PYTHON_PATTERNS : CPP_PATTERNS;

  let candidates: Array<CompletionSuggestion & { fuzzyScore: number }> = [];

  // Extract last typed word or method call
  const lastWordMatch = trimmedPrefix.match(/([a-zA-Z_][a-zA-Z0-9_.]*)$/);
  const lastWord = lastWordMatch ? lastWordMatch[1] : '';

  // 1. Evaluate knowledge base pattern completions with fuzzy matching
  for (const pat of patterns) {
    if (pat.trigger.test(trimmedPrefix) || pat.trigger.test(linePrefix) || (lastWord && pat.trigger.test(lastWord))) {
      const suggestions = pat.getCompletions(context);
      for (const s of suggestions) {
        let score = (s.boost || 0) + 10;
        if (lastWord) {
          const methodOnly = lastWord.includes('.') ? lastWord.split('.').pop() || '' : lastWord;
          const matchTarget = s.text.split('(')[0];
          const fScore = fuzzyMatchScore(methodOnly, matchTarget);
          if (fScore > 0) {
            score += fScore;
          }
        }
        candidates.push({ ...s, fuzzyScore: score });
      }
    }
  }

  // 2. Fuzzy match against declared variables
  if (lastWord && lastWord.length >= 2) {
    for (const v of context.declaredVariables) {
      const fScore = fuzzyMatchScore(lastWord, v);
      if (fScore > 0 && v !== lastWord) {
        let insert = v;
        if (v.toLowerCase().startsWith(lastWord.toLowerCase())) {
          insert = v.slice(lastWord.length);
        }
        candidates.push({
          text: insert,
          displayText: v,
          kind: 'variable',
          detail: 'Declared variable',
          boost: 10,
          fuzzyScore: fScore + 10,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Rank by combined fuzzyScore + local acceptance weight
  candidates.sort((a, b) => {
    const weightA = weights[a.text.trim()] || 0;
    const weightB = weights[b.text.trim()] || 0;
    if (weightA !== weightB) return weightB - weightA;
    return b.fuzzyScore - a.fuzzyScore;
  });

  const best = candidates[0];
  if (!best || best.fuzzyScore < 10) return null;

  let textToInsert = best.text;

  // If trimmedPrefix overlaps with best text, compute remaining suffix
  if (best.text.toLowerCase().startsWith(trimmedPrefix.toLowerCase())) {
    textToInsert = best.text.slice(trimmedPrefix.length);
  } else if (lastWord && best.text.toLowerCase().startsWith(lastWord.toLowerCase())) {
    textToInsert = best.text.slice(lastWord.length);
  }

  if (!textToInsert) return null;

  return {
    textToInsert,
    fullSuggestion: best.displayText || best.text,
    kind: best.kind,
  };
}
