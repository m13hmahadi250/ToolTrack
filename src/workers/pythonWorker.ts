/**
 * ToolTrack Python 3.12 Pyodide WebAssembly Worker
 *
 * Responsibilities:
 * - PythonRuntimeManager: Initializes pinned CPython 3.12 (Pyodide v0.26.4) in a dedicated Worker
 *   and reuses the active runtime across repeated executions.
 * - DependencyResolver & PackageManager: Uses CPython's built-in `ast` module + Pyodide lockfile
 *   mapping to accurately detect top-level, aliased, multiline, and nested imports while ignoring
 *   standard-library modules. Never loads NumPy/pandas/Matplotlib for `print("Hello, World!")`.
 * - StandardInputOutputManager: Streams stdout/stderr in real time, supports multi-line `input()`
 *   and `sys.stdin`, and guarantees buffer flushing before completion.
 * - PlotOutputManager: Configures Matplotlib headless `Agg` backend only when Matplotlib is imported,
 *   capturing `plt.show()`, `plt.savefig()`, and unclosed figures without duplicates or empty plots.
 */

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;
let runtimeInitDurationMs = 0;
const installedPackages = new Set<string>();

let activeRunStdout = '';
let activeRunStderr = '';

const COMPILER_CACHE_NAME = 'tooltrack-compiler-cache-v1';
const PYODIDE_VERSION = 'v0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

const PYTHON_PREAMBLE = `
import os
import sys
import io
import ast
import base64
import json
import builtins
import warnings

# Force non-interactive Agg backend in environment before Matplotlib is ever imported
os.environ['MPLBACKEND'] = 'Agg'
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib'

warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*Pyarrow.*')
warnings.filterwarnings('ignore', message='.*pyarrow.*')

_tooltrack_plots = []
_tooltrack_stdin_lines = []
_tooltrack_stdin_idx = 0

def _tooltrack_extract_imports(source_code=""):
    """Use CPython AST to extract all imported root module names (supports multiline, aliases, nested)."""
    found = []
    try:
        tree = ast.parse(source_code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root = alias.name.split('.')[0].strip()
                    if root and root not in found:
                        found.append(root)
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.level == 0:
                    root = node.module.split('.')[0].strip()
                    if root and root not in found:
                        found.append(root)
    except Exception:
        pass
    return json.dumps(found)

def _tooltrack_configure_io(stdin_text=""):
    global _tooltrack_stdin_lines, _tooltrack_stdin_idx
    sys.stdin = io.StringIO(stdin_text if stdin_text is not None else "")
    if stdin_text == "":
        _tooltrack_stdin_lines = []
    else:
        _tooltrack_stdin_lines = stdin_text.splitlines()
    _tooltrack_stdin_idx = 0

    def _custom_input(prompt=""):
        global _tooltrack_stdin_idx, _tooltrack_stdin_lines
        if prompt:
            sys.stdout.write(str(prompt))
            sys.stdout.flush()
        line = sys.stdin.readline()
        if line == "":
            raise EOFError("EOF when reading a line (provide input values in the Input / STDIN tab)")
        return line.rstrip("\\r\\n")

    builtins.input = _custom_input

def _tooltrack_setup_environment():
    global _tooltrack_plots
    _tooltrack_plots = []

    # Configure Pandas formatting only if already imported
    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            pd.set_option('display.max_columns', 25)
            pd.set_option('display.width', 1000)
            pd.set_option('display.max_colwidth', 80)
        except Exception:
            pass

def _tooltrack_setup_matplotlib_hook():
    """Only called when user code imports matplotlib/seaborn or matplotlib is already loaded."""
    try:
        import matplotlib
        matplotlib.use('Agg', force=True)
        import matplotlib.pyplot as plt

        if not getattr(plt, '_tooltrack_hooked', False):
            _orig_savefig = plt.savefig

            def _capture_current_figures():
                global _tooltrack_plots
                for fig_num in list(plt.get_fignums()):
                    fig = plt.figure(fig_num)
                    if not fig.axes and not fig.texts and not fig.images:
                        plt.close(fig)
                        continue
                    buf = io.BytesIO()
                    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor=fig.get_facecolor() or 'white')
                    buf.seek(0)
                    b64 = base64.b64encode(buf.read()).decode('utf-8')
                    if not _tooltrack_plots or _tooltrack_plots[-1] != b64:
                        _tooltrack_plots.append(b64)
                    plt.close(fig)

            def _custom_show(*args, **kwargs):
                _capture_current_figures()

            def _custom_savefig(*args, **kwargs):
                res = _orig_savefig(*args, **kwargs)
                try:
                    buf = io.BytesIO()
                    fig = plt.gcf()
                    if fig.axes or fig.texts or fig.images:
                        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor=fig.get_facecolor() or 'white')
                        buf.seek(0)
                        b64 = base64.b64encode(buf.read()).decode('utf-8')
                        if not _tooltrack_plots or _tooltrack_plots[-1] != b64:
                            _tooltrack_plots.append(b64)
                except Exception:
                    pass
                return res

            plt.show = _custom_show
            plt.savefig = _custom_savefig
            plt._tooltrack_hooked = True
    except Exception:
        pass

def _tooltrack_finalize_execution():
    global _tooltrack_plots
    try:
        sys.stdout.flush()
        sys.stderr.flush()
    except Exception:
        pass

    plots = list(_tooltrack_plots) if '_tooltrack_plots' in globals() else []

    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            pd.set_option('display.max_columns', 25)
            pd.set_option('display.width', 1000)
        except Exception:
            pass

    # Capture any remaining open Matplotlib figures not explicitly closed by plt.show()
    if 'matplotlib.pyplot' in sys.modules:
        try:
            import matplotlib.pyplot as plt
            for fig_num in list(plt.get_fignums()):
                fig = plt.figure(fig_num)
                if fig.axes or fig.texts or fig.images:
                    buf = io.BytesIO()
                    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor=fig.get_facecolor() or 'white')
                    buf.seek(0)
                    b64 = base64.b64encode(buf.read()).decode('utf-8')
                    if not plots or plots[-1] != b64:
                        plots.append(b64)
                plt.close(fig)
        except Exception:
            pass

    _tooltrack_plots = []

    # Inspect user globals for Pandas DataFrames to populate the interactive DataFrames tab
    dataframes = []
    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            user_globals = dict(globals())
            for var_name, val in user_globals.items():
                if var_name.startswith('_'):
                    continue
                if isinstance(val, pd.DataFrame):
                    preview_df = val.head(200)
                    cols = [str(c) for c in val.columns.tolist()]
                    dtypes = {str(k): str(v) for k, v in val.dtypes.items()}
                    rows_objects = []
                    for idx_val, row in preview_df.iterrows():
                        row_dict = {'__index__': str(idx_val)}
                        for c_name, cell_val in zip(cols, row.tolist()):
                            row_dict[c_name] = None if pd.isna(cell_val) else str(cell_val)
                        rows_objects.append(row_dict)
                    csv_str = val.head(2000).to_csv(index=True)
                    dataframes.append({
                        'name': var_name,
                        'rows': int(val.shape[0]),
                        'cols': int(val.shape[1]),
                        'columns': cols,
                        'dtypes': dtypes,
                        'previewRows': rows_objects,
                        'csvContent': csv_str
                    })
                    if len(dataframes) >= 8:
                        break
        except Exception:
            pass

    return json.dumps({'plots': plots, 'dataframes': dataframes})
`;

// Intercept self.fetch inside Pyodide Web Worker to serve cached WASM and wheels when offline
// and automatically persist newly downloaded Pyodide assets into CacheStorage.
const nativeWorkerFetch = self.fetch.bind(self);
self.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const isPyodideAsset =
    url.includes('pyodide') ||
    url.endsWith('.whl') ||
    url.endsWith('.wasm') ||
    url.endsWith('.zip') ||
    url.endsWith('.json') ||
    url.endsWith('.mjs') ||
    url.endsWith('.js');

  if ('caches' in self && isPyodideAsset) {
    try {
      const cache = await caches.open(COMPILER_CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        if (url.endsWith('.wasm') && cached.headers.get('content-type') !== 'application/wasm') {
          const buf = await cached.arrayBuffer();
          return new Response(buf, {
            status: 200,
            headers: { 'Content-Type': 'application/wasm' },
          });
        }
        return cached;
      }
    } catch (cErr) {
      console.warn('[Pyodide Worker CacheStorage Match Warning]:', cErr);
    }
  }

  try {
    const netRes = await nativeWorkerFetch(input, init);
    if (netRes.ok && 'caches' in self && isPyodideAsset && url.startsWith('http')) {
      try {
        const cache = await caches.open(COMPILER_CACHE_NAME);
        if (url.endsWith('.wasm')) {
          const cloneBuf = await netRes.clone().arrayBuffer();
          await cache.put(
            url,
            new Response(cloneBuf, {
              status: 200,
              headers: { 'Content-Type': 'application/wasm' },
            })
          );
        } else {
          await cache.put(url, netRes.clone());
        }
      } catch {}
    }
    return netRes;
  } catch (netErr: any) {
    if ('caches' in self) {
      try {
        const cache = await caches.open(COMPILER_CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) return cached;
      } catch {}
    }
    const filename = url.split('/').pop() || 'resource';
    throw new Error(
      `Offline Resource Missing: '${filename}' is not cached locally. Connect to the internet and open "Packages & Offline Setup" to cache the required runtime or scientific packages.`
    );
  }
};

async function initPyodide(initId?: string): Promise<any> {
  if (pyodideInstance) {
    if (initId) {
      postMessage({
        type: 'INIT_COMPLETE',
        id: initId,
        version: pyodideInstance.version || PYODIDE_VERSION,
        runtimeInitMs: runtimeInitDurationMs,
        installedPackages: Array.from(installedPackages),
      });
    }
    return pyodideInstance;
  }
  if (initPromise) {
    const py = await initPromise;
    if (initId) {
      postMessage({
        type: 'INIT_COMPLETE',
        id: initId,
        version: py.version || PYODIDE_VERSION,
        runtimeInitMs: runtimeInitDurationMs,
        installedPackages: Array.from(installedPackages),
      });
    }
    return py;
  }

  initPromise = (async () => {
    const t0 = performance.now();
    postMessage({
      type: 'STATUS',
      state: 'downloading_runtime',
      message: 'Loading Python 3.12 WebAssembly runtime...',
    });

    try {
      // 1. Pre-load pyodide.asm.js through self.fetch (reads from CacheStorage when offline)
      if (typeof (self as any)._createPyodideModule !== 'function') {
        const asmRes = await self.fetch(`${PYODIDE_INDEX_URL}pyodide.asm.js`);
        if (!asmRes.ok) {
          throw new Error(`Could not load pyodide.asm.js (HTTP ${asmRes.status})`);
        }
        const asmText = await asmRes.text();
        const asmBlob = new Blob([asmText], { type: 'application/javascript' });
        const asmBlobUrl = URL.createObjectURL(asmBlob);
        try {
          await import(/* @vite-ignore */ asmBlobUrl);
        } finally {
          URL.revokeObjectURL(asmBlobUrl);
        }
      }

      // 2. Load pyodide.mjs via self.fetch (CacheStorage-first)
      let loadPyodideFn: any = null;
      const mjsRes = await self.fetch(`${PYODIDE_INDEX_URL}pyodide.mjs`);
      if (!mjsRes.ok) {
        throw new Error(`Could not load pyodide.mjs (HTTP ${mjsRes.status})`);
      }
      const mjsText = await mjsRes.text();
      const mjsBlob = new Blob([mjsText], { type: 'application/javascript' });
      const mjsBlobUrl = URL.createObjectURL(mjsBlob);
      try {
        const pyodideModule = await import(/* @vite-ignore */ mjsBlobUrl);
        loadPyodideFn = pyodideModule.loadPyodide;
      } finally {
        URL.revokeObjectURL(mjsBlobUrl);
      }

      if (typeof loadPyodideFn !== 'function') {
        throw new Error('Pyodide bootstrap function could not be initialized.');
      }

      postMessage({
        type: 'STATUS',
        state: 'initializing',
        message: 'Initializing CPython 3.12 WebAssembly VM...',
      });

      const py = await loadPyodideFn({
        indexURL: PYODIDE_INDEX_URL,
        stdout: (text: string) => {
          const line = text.endsWith('\n') ? text : text + '\n';
          activeRunStdout += line;
          postMessage({ type: 'STDOUT', text: line });
          postMessage({ type: 'stdout', text: line });
        },
        stderr: (text: string) => {
          if (
            text.includes('Pyarrow will become a required dependency of pandas') ||
            text.includes('DeprecationWarning: Pyarrow') ||
            text.includes('issues/54466') ||
            text.includes('Arrow string type')
          ) {
            return;
          }
          const line = text.endsWith('\n') ? text : text + '\n';
          activeRunStderr += line;
          postMessage({ type: 'STDERR', text: line });
          postMessage({ type: 'stderr', text: line });
        },
      });

      await py.runPythonAsync(PYTHON_PREAMBLE);

      runtimeInitDurationMs = Math.round(performance.now() - t0);
      pyodideInstance = py;

      postMessage({
        type: 'INIT_COMPLETE',
        id: initId,
        state: 'ready',
        version: py.version || PYODIDE_VERSION,
        runtimeInitMs: runtimeInitDurationMs,
        installedPackages: Array.from(installedPackages),
        message: 'Python 3.12 runtime ready.',
      });
      postMessage({
        type: 'initialized',
        state: 'ready',
        version: py.version || PYODIDE_VERSION,
        runtimeInitMs: runtimeInitDurationMs,
        installed: Array.from(installedPackages),
        message: 'Python 3.12 runtime ready.',
      });

      return py;
    } catch (err: any) {
      initPromise = null;
      console.error('[Pyodide Worker Init Error]:', err);
      postMessage({
        type: 'ERROR',
        id: initId,
        state: 'failed',
        stderr: err.message || String(err),
        message: err.message || String(err),
      });
      throw err;
    }
  })();

  return initPromise;
}

const STDLIB_MODULES = new Set([
  'abc', 'argparse', 'array', 'ast', 'asyncio', 'base64', 'bisect', 'builtins',
  'calendar', 'cmath', 'collections', 'concurrent', 'contextlib', 'copy', 'csv',
  'ctypes', 'dataclasses', 'datetime', 'decimal', 'difflib', 'dis', 'email',
  'enum', 'errno', 'fnmatch', 'fractions', 'functools', 'gc', 'getopt', 'getpass',
  'gettext', 'glob', 'gzip', 'hashlib', 'heapq', 'hmac', 'html', 'http',
  'importlib', 'inspect', 'io', 'ipaddress', 'itertools', 'json', 'keyword',
  'linecache', 'locale', 'logging', 'lzma', 'math', 'mimetypes', 'numbers',
  'operator', 'os', 'pathlib', 'pickle', 'platform', 'pprint', 'profile',
  'pstats', 'queue', 'quopri', 'random', 're', 'reprlib', 'secrets', 'select',
  'shlex', 'shutil', 'signal', 'site', 'smtplib', 'socket', 'statistics',
  'string', 'stringprep', 'struct', 'subprocess', 'sys', 'sysconfig', 'tarfile',
  'tempfile', 'textwrap', 'threading', 'time', 'timeit', 'token', 'tokenize',
  'tomllib', 'trace', 'traceback', 'tracemalloc', 'types', 'typing',
  'unicodedata', 'unittest', 'urllib', 'uuid', 'venv', 'warnings', 'weakref',
  'xml', 'xmlrpc', 'zipapp', 'zipfile', 'zipimport', 'zlib', 'zoneinfo',
]);

// Package import mapping for Python AST & regex detection
const IMPORT_TO_PYODIDE_PKG: Record<string, string> = {
  numpy: 'numpy',
  pandas: 'pandas',
  matplotlib: 'matplotlib',
  pyplot: 'matplotlib',
  pylab: 'matplotlib',
  sklearn: 'scikit-learn',
  scikit_learn: 'scikit-learn',
  scipy: 'scipy',
  sympy: 'sympy',
  PIL: 'pillow',
  pillow: 'pillow',
  bs4: 'beautifulsoup4',
  beautifulsoup4: 'beautifulsoup4',
  requests: 'requests',
  statsmodels: 'statsmodels',
  sqlite3: 'sqlite3',
  openpyxl: 'openpyxl',
  networkx: 'networkx',
  yaml: 'pyyaml',
  pyyaml: 'pyyaml',
  regex: 'regex',
  joblib: 'joblib',
  xlrd: 'xlrd',
  micropip: 'micropip',
};

const MICROPIP_PACKAGES = new Set(['seaborn']);
const syncedFileSignatures = new Map<string, string>();

async function resolveCodeImports(
  py: any,
  code: string,
  userFiles: Array<{ name: string }> = []
): Promise<{ pyodidePkgs: string[]; micropipPkgs: string[] }> {
  // Fast-path: if the code has no `import` keyword at all (e.g., print("Hello, World!"), loops, math),
  // return immediately with zero extra Python AST round-trip overhead.
  if (!/\bimport\b/.test(code)) {
    return { pyodidePkgs: [], micropipPkgs: [] };
  }

  const pyodidePkgs = new Set<string>();
  const micropipPkgs = new Set<string>();
  const localModules = new Set(
    userFiles
      .filter((f) => f && f.name && f.name.endsWith('.py'))
      .map((f) => f.name.replace(/\.py$/, ''))
  );

  let rootModules: string[] = [];

  // 1. Primary: Use CPython's built-in AST parser for exact multiline/alias/nested import extraction
  try {
    py.globals.set('_tooltrack_tmp_src', code);
    const jsonStr = await py.runPythonAsync('_tooltrack_extract_imports(_tooltrack_tmp_src)');
    if (typeof jsonStr === 'string') {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        rootModules = parsed;
      }
    }
  } catch {}

  // 2. Fallback: Regex scan in case the user code has a syntax error or incomplete block
  if (rootModules.length === 0) {
    const lines = code.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.replace(/#.*$/, '').trim();
      if (!line) continue;
      const fromMatch = line.match(/^from\s+([a-zA-Z0-9_]+)/);
      if (fromMatch) {
        rootModules.push(fromMatch[1]);
        continue;
      }
      const importMatch = line.match(/^import\s+(.+)$/);
      if (importMatch) {
        const parts = importMatch[1].split(',');
        for (const part of parts) {
          const token = part.trim().split(/\s+/)[0].split('.')[0];
          if (token) rootModules.push(token);
        }
      }
    }
  }

  for (const mod of rootModules) {
    if (!mod || STDLIB_MODULES.has(mod) || localModules.has(mod)) {
      continue;
    }
    if (IMPORT_TO_PYODIDE_PKG[mod]) {
      pyodidePkgs.add(IMPORT_TO_PYODIDE_PKG[mod]);
    } else if (MICROPIP_PACKAGES.has(mod)) {
      micropipPkgs.add(mod);
    }
  }

  // If seaborn is requested, ensure numpy, pandas, matplotlib, scipy are loaded via Pyodide
  if (micropipPkgs.has('seaborn')) {
    pyodidePkgs.add('numpy');
    pyodidePkgs.add('pandas');
    pyodidePkgs.add('matplotlib');
    pyodidePkgs.add('scipy');
  }

  return {
    pyodidePkgs: Array.from(pyodidePkgs),
    micropipPkgs: Array.from(micropipPkgs),
  };
}

function listWorkspaceFiles(py: any): Array<{ name: string; size: number; isBinary: boolean }> {
  const results: Array<{ name: string; size: number; isBinary: boolean }> = [];
  const ignored = new Set(['.', '..', 'tmp', 'home', 'dev', 'proc', 'lib']);
  const dirsToScan = ['/home/pyodide', '/'];
  const seenNames = new Set<string>();

  for (const dir of dirsToScan) {
    try {
      const entries: string[] = py.FS.readdir(dir);
      for (const entry of entries) {
        if (ignored.has(entry) || entry.startsWith('.') || seenNames.has(entry)) continue;
        const fullPath = dir === '/' ? `/${entry}` : `${dir}/${entry}`;
        try {
          const stat = py.FS.stat(fullPath);
          if (py.FS.isFile(stat.mode)) {
            seenNames.add(entry);
            const isBin = /\.(xlsx|parquet|png|jpg|jpeg|webp|pdf|zip|sqlite|db)$/i.test(entry);
            results.push({
              name: entry,
              size: stat.size || 0,
              isBinary: isBin,
            });
          }
        } catch {}
      }
    } catch {}
  }

  return results;
}

function extractPythonErrorLine(tracebackText: string): number | undefined {
  const matches = [...tracebackText.matchAll(/File\s+"(?:<exec>|main\.py|[^"]*)",\s+line\s+(\d+)/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    return Number(lastMatch[1]);
  }
  return undefined;
}

self.onmessage = async (event: MessageEvent) => {
  const data = event.data || {};
  const msgType = data.type || data.action;
  const payload = data.payload || data;
  const id = data.id;

  try {
    if (msgType === 'INIT' || msgType === 'init') {
      await initPyodide(id);
      return;
    }

    if (msgType === 'RESET_KERNEL' || msgType === 'resetRuntime') {
      const py = await initPyodide();
      syncedFileSignatures.clear();
      await py.runPythonAsync(`
for _k in list(globals().keys()):
    if not _k.startswith('_') and _k not in ('os', 'sys', 'io', 'ast', 'base64', 'json', 'builtins', 'warnings'):
        try:
            del globals()[_k]
        except Exception:
            pass
`);
      await py.runPythonAsync(PYTHON_PREAMBLE);
      postMessage({
        type: 'RESULT',
        id,
        stdout: '',
        stderr: '',
        plots: [],
        dataframes: [],
        installedPackages: Array.from(installedPackages),
      });
      postMessage({
        type: 'runtimeReset',
        id,
        state: 'ready',
        installed: Array.from(installedPackages),
        message: 'Python namespace reset cleanly.',
      });
      return;
    }

    if (msgType === 'INSTALL_PACKAGE' || msgType === 'loadPackages' || msgType === 'installMicropip') {
      const py = await initPyodide();
      const singlePkg = (data.packageName || payload?.package || '').trim();
      const packages: string[] = singlePkg ? [singlePkg] : payload?.packages || [];

      for (const rawPkg of packages) {
        const mappedPkg = IMPORT_TO_PYODIDE_PKG[rawPkg] || rawPkg;
        if (STDLIB_MODULES.has(mappedPkg)) {
          continue;
        }
        if (installedPackages.has(mappedPkg)) {
          continue;
        }
        postMessage({
          type: 'STATUS',
          state: 'loading_packages',
          message: `Installing package '${mappedPkg}'...`,
        });
        try {
          await py.loadPackage(mappedPkg);
          installedPackages.add(mappedPkg);
        } catch {
          // Fallback to micropip for pure-Python packages on PyPI
          if (!installedPackages.has('micropip')) {
            await py.loadPackage('micropip');
            installedPackages.add('micropip');
          }
          const micropip = py.pyimport('micropip');
          await micropip.install(rawPkg);
          installedPackages.add(rawPkg);
        }
      }

      postMessage({
        type: 'RESULT',
        id,
        stdout: `Successfully loaded: ${packages.join(', ')}\n`,
        stderr: '',
        installedPackages: Array.from(installedPackages),
      });
      postMessage({
        type: 'packagesReady',
        id,
        state: 'ready',
        installed: Array.from(installedPackages),
      });
      return;
    }

    if (msgType === 'uploadFile' || msgType === 'UPLOAD_FILE') {
      const py = await initPyodide();
      const { name, data: fileData, isBinary } = payload;
      let bytesOrText: Uint8Array | string = fileData;
      if (isBinary && fileData instanceof ArrayBuffer) {
        bytesOrText = new Uint8Array(fileData);
      } else if (isBinary && ArrayBuffer.isView(fileData)) {
        bytesOrText = new Uint8Array(fileData.buffer, fileData.byteOffset, fileData.byteLength);
      } else if (isBinary && typeof fileData === 'string') {
        const binStr = atob(fileData.replace(/^data:[^;]+;base64,/, ''));
        const arr = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
        bytesOrText = arr;
      }

      try {
        py.FS.mkdirTree('/home/pyodide');
      } catch {}
      py.FS.writeFile(`/home/pyodide/${name}`, bytesOrText);
      try {
        py.FS.writeFile(`/${name}`, bytesOrText);
      } catch {}
      syncedFileSignatures.delete(name);

      const files = listWorkspaceFiles(py);
      postMessage({
        type: 'fileUploaded',
        name,
        path: `/home/pyodide/${name}`,
        files,
        id,
      });
      return;
    }

    if (msgType === 'listFiles' || msgType === 'LIST_FILES') {
      const py = await initPyodide();
      const files = listWorkspaceFiles(py);
      postMessage({ type: 'fileList', files, id });
      return;
    }

    if (msgType === 'downloadFile' || msgType === 'DOWNLOAD_FILE') {
      const py = await initPyodide();
      const { name } = payload;
      try {
        let content: Uint8Array;
        try {
          content = py.FS.readFile(`/home/pyodide/${name}`);
        } catch {
          content = py.FS.readFile(`/${name}`);
        }
        postMessage({ type: 'fileContent', name, content, id });
      } catch (err: any) {
        postMessage({ type: 'fileDownloadError', name, error: err.message || String(err), id });
      }
      return;
    }

    if (msgType === 'deleteFile' || msgType === 'DELETE_FILE') {
      const py = await initPyodide();
      const { name } = payload;
      syncedFileSignatures.delete(name);
      try {
        py.FS.unlink(`/home/pyodide/${name}`);
      } catch {}
      try {
        py.FS.unlink(`/${name}`);
      } catch {}
      const files = listWorkspaceFiles(py);
      postMessage({ type: 'fileList', files, id });
      return;
    }

    if (msgType === 'RUN' || msgType === 'runCode') {
      const py = await initPyodide();
      const code: string = data.code ?? payload?.code ?? '';
      const stdin: string = data.stdin ?? payload?.stdin ?? '';
      const rawFiles = data.files ?? payload?.files ?? [];
      const cellId = data.cellId ?? payload?.cellId;

      activeRunStdout = '';
      activeRunStderr = '';
      const startTime = performance.now();

      // Normalize files whether passed as Array<{name, content, isBinary, updatedAt}> or Record<string, string>
      const fileEntries: Array<{
        name: string;
        content: string;
        isBinary?: boolean;
        updatedAt?: number;
      }> = Array.isArray(rawFiles)
        ? rawFiles
        : Object.entries(rawFiles || {}).map(([name, content]) => ({
            name,
            content: String(content),
          }));

      // Sync only modified project files into Pyodide virtual FS before execution
      if (fileEntries.length > 0) {
        try {
          py.FS.mkdirTree('/home/pyodide');
        } catch {}
        for (const f of fileEntries) {
          if (!f || !f.name || f.content === undefined) continue;
          const sig = `${f.updatedAt || 0}:${f.content.length}:${f.content.slice(0, 32)}`;
          if (syncedFileSignatures.get(f.name) === sig) {
            continue;
          }
          try {
            if (f.isBinary && typeof f.content === 'string') {
              const binStr = atob(f.content.replace(/^data:[^;]+;base64,/, ''));
              const arr = new Uint8Array(binStr.length);
              for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
              py.FS.writeFile(`/home/pyodide/${f.name}`, arr);
              py.FS.writeFile(`/${f.name}`, arr);
            } else {
              py.FS.writeFile(`/home/pyodide/${f.name}`, String(f.content));
              py.FS.writeFile(`/${f.name}`, String(f.content));
            }
            syncedFileSignatures.set(f.name, sig);
          } catch {}
        }
      }

      // 1. Lazily detect and load ONLY packages actually imported by the code
      const { pyodidePkgs, micropipPkgs } = await resolveCodeImports(py, code, fileEntries);
      const missingPyodidePkgs = pyodidePkgs.filter((p) => !installedPackages.has(p));
      const missingMicropipPkgs = micropipPkgs.filter((p) => !installedPackages.has(p));

      if (missingPyodidePkgs.length > 0) {
        postMessage({
          type: 'STATUS',
          state: 'loading_packages',
          message: `Loading libraries: ${missingPyodidePkgs.join(', ')}...`,
        });
        for (const pkg of missingPyodidePkgs) {
          postMessage({ type: 'packageLoading', package: pkg });
          await py.loadPackage(pkg);
          installedPackages.add(pkg);
          postMessage({
            type: 'packageLoaded',
            package: pkg,
            installed: Array.from(installedPackages),
          });
        }
      }

      if (missingMicropipPkgs.length > 0) {
        postMessage({
          type: 'STATUS',
          state: 'loading_packages',
          message: `Installing pure-Python wheels: ${missingMicropipPkgs.join(', ')}...`,
        });
        if (!installedPackages.has('micropip')) {
          await py.loadPackage('micropip');
          installedPackages.add('micropip');
        }
        const micropip = py.pyimport('micropip');
        for (const mPkg of missingMicropipPkgs) {
          await micropip.install(mPkg);
          installedPackages.add(mPkg);
          postMessage({
            type: 'packageLoaded',
            package: mPkg,
            installed: Array.from(installedPackages),
          });
        }
      }

      const needsMatplotlibHook =
        pyodidePkgs.includes('matplotlib') ||
        micropipPkgs.includes('seaborn') ||
        installedPackages.has('matplotlib');

      let result: any = null;
      let errorOccurred = false;
      let errorLine: number | undefined = undefined;

      try {
        py.globals.set('_tooltrack_raw_stdin', String(stdin || ''));
        await py.runPythonAsync(`
_tooltrack_configure_io(_tooltrack_raw_stdin)
_tooltrack_setup_environment()
${needsMatplotlibHook ? '_tooltrack_setup_matplotlib_hook()' : ''}
`);
        result = await py.runPythonAsync(code);
      } catch (execErr: any) {
        errorOccurred = true;
        const errMsg = execErr.message || String(execErr);
        errorLine = extractPythonErrorLine(errMsg);
        const formattedErr = errMsg.endsWith('\n') ? errMsg : errMsg + '\n';
        activeRunStderr += formattedErr;
        postMessage({
          type: 'STDERR',
          cellId,
          text: formattedErr,
        });
        postMessage({
          type: 'stderr',
          cellId,
          text: formattedErr,
        });
      }

      // Finalize execution: flush stdout/stderr, collect plots and DataFrames
      let plots: string[] = [];
      let dataframes: any[] = [];
      try {
        const rawJson = await py.runPythonAsync('_tooltrack_finalize_execution()');
        if (typeof rawJson === 'string') {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed.plots)) plots = parsed.plots;
          if (Array.isArray(parsed.dataframes)) dataframes = parsed.dataframes;
        }
      } catch (finErr) {
        console.warn('[Pyodide Worker] Finalize warning:', finErr);
      }

      const workspaceFiles = listWorkspaceFiles(py);
      const executionTimeMs = Math.round(performance.now() - startTime);

      // Post unified RESULT / ERROR message for Promise-based callers
      postMessage({
        type: errorOccurred ? 'ERROR' : 'RESULT',
        id,
        cellId,
        stdout: activeRunStdout,
        stderr: activeRunStderr,
        plots,
        dataframes,
        errorLine,
        executionTimeMs,
        runtimeInitMs: runtimeInitDurationMs,
        files: workspaceFiles,
        installedPackages: Array.from(installedPackages),
        result: result !== undefined && result !== null ? String(result) : undefined,
      });

      // Also post legacy runComplete for backward compatibility
      postMessage({
        type: 'runComplete',
        state: errorOccurred ? 'failed' : 'completed',
        id,
        cellId,
        success: !errorOccurred,
        stdout: activeRunStdout,
        stderr: activeRunStderr,
        executionTimeMs,
        runtimeInitMs: runtimeInitDurationMs,
        plots,
        dataframes,
        files: workspaceFiles,
        installed: Array.from(installedPackages),
        result: result !== undefined && result !== null ? String(result) : undefined,
      });
      return;
    }
  } catch (globalErr: any) {
    const errMsg = globalErr.message || String(globalErr);
    postMessage({
      type: 'ERROR',
      state: 'failed',
      id,
      cellId: payload?.cellId,
      stdout: activeRunStdout,
      stderr: activeRunStderr ? `${activeRunStderr}\n${errMsg}` : errMsg,
      message: errMsg,
    });
  }
};
