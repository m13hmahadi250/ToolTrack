/**
 * ToolTrack Python 3.12 Pyodide WebAssembly Worker
 * Runs real CPython 3.12 compiled to WebAssembly in an isolated Web Worker.
 * Supports NumPy, Pandas, Matplotlib (headless Agg backend), Scikit-Learn,
 * SciPy, SymPy, Pillow (PIL), BeautifulSoup4, Requests, Statsmodels, SQLite3,
 * OpenPyXL, and Seaborn, with full offline CacheStorage interception,
 * multi-line input() / sys.stdin, DataFrame table capture, and virtual FS sync.
 */

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;
const installedPackages = new Set<string>();

const COMPILER_CACHE_NAME = 'tooltrack-compiler-cache-v1';
const PYODIDE_VERSION = 'v0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

const PYTHON_PREAMBLE = `
import os
import sys
import io
import base64
import json
import builtins
import warnings

# Force non-interactive Agg backend before Matplotlib or Pyplot is imported
os.environ['MPLBACKEND'] = 'Agg'
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib'

warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*Pyarrow.*')
warnings.filterwarnings('ignore', message='.*pyarrow.*')

_tooltrack_plots = []
_tooltrack_stdin_lines = []
_tooltrack_stdin_idx = 0

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
            raise EOFError("EOF when reading a line (provide input values in the Input / STDIN panel)")
        return line.rstrip("\\r\\n")

    builtins.input = _custom_input

def _tooltrack_setup_environment():
    global _tooltrack_plots
    _tooltrack_plots = []

    # Configure Pandas formatting if already imported
    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            pd.set_option('display.max_columns', 20)
            pd.set_option('display.width', 1000)
            pd.set_option('display.max_colwidth', 60)
        except Exception:
            pass

    # Configure Matplotlib Agg capture if available
    try:
        import matplotlib
        matplotlib.use('Agg')
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
    plots = list(_tooltrack_plots) if '_tooltrack_plots' in globals() else []

    # Configure Pandas formatting if imported during user script
    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            pd.set_option('display.max_columns', 20)
            pd.set_option('display.width', 1000)
        except Exception:
            pass

    # Capture any remaining open Matplotlib figures not closed by plt.show()
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

    # Inspect user globals for Pandas DataFrames to populate the read-only Table Viewer
    dataframes = []
    if 'pandas' in sys.modules:
        try:
            import pandas as pd
            user_globals = dict(globals())
            for var_name, val in user_globals.items():
                if var_name.startswith('_'):
                    continue
                if isinstance(val, pd.DataFrame):
                    preview_df = val.head(50)
                    cols = [str(c) for c in val.columns.tolist()]
                    dtypes = {str(k): str(v) for k, v in val.dtypes.items()}
                    rows_data = []
                    for _, row in preview_df.iterrows():
                        rows_data.append([None if pd.isna(v) else str(v) for v in row.tolist()])
                    csv_str = val.head(500).to_csv(index=False)
                    dataframes.append({
                        'name': var_name,
                        'rows': int(val.shape[0]),
                        'cols': int(val.shape[1]),
                        'columns': cols,
                        'dtypes': dtypes,
                        'previewRows': rows_data,
                        'csvContent': csv_str
                    })
                    if len(dataframes) >= 5:
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
      `Offline Resource Missing: '${filename}' is not cached locally. Connect to the internet and click "Prepare Python for Offline Use" to cache the runtime and scientific packages.`
    );
  }
};

async function initPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    postMessage({
      type: 'status',
      state: 'downloading_runtime',
      message: 'Loading Python 3.12 WebAssembly runtime...',
    });

    try {
      // 1. Pre-load pyodide.asm.js through self.fetch (which reads from CacheStorage when offline)
      // so globalThis._createPyodideModule is already defined and pyodide.mjs never makes an
      // un-intercepted dynamic import() call to the CDN while offline.
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
        type: 'status',
        state: 'initializing',
        message: 'Initializing CPython 3.12 WebAssembly VM...',
      });

      const py = await loadPyodideFn({
        indexURL: PYODIDE_INDEX_URL,
        stdout: (text: string) => {
          postMessage({ type: 'stdout', text: text.endsWith('\n') ? text : text + '\n' });
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
          postMessage({ type: 'stderr', text: text.endsWith('\n') ? text : text + '\n' });
        },
      });

      await py.runPythonAsync(PYTHON_PREAMBLE);

      pyodideInstance = py;
      postMessage({
        type: 'initialized',
        state: 'ready',
        version: py.version || PYODIDE_VERSION,
        installed: Array.from(installedPackages),
        message: 'Python 3.12 runtime ready.',
      });

      return py;
    } catch (err: any) {
      initPromise = null;
      console.error('[Pyodide Worker Init Error]:', err);
      postMessage({
        type: 'error',
        state: 'failed',
        message: err.message || String(err),
      });
      throw err;
    }
  })();

  return initPromise;
}

// Package import mapping for Python AST & regex detection
const IMPORT_TO_PYODIDE_PKG: Record<string, string> = {
  numpy: 'numpy',
  pandas: 'pandas',
  matplotlib: 'matplotlib',
  sklearn: 'scikit-learn',
  scipy: 'scipy',
  sympy: 'sympy',
  PIL: 'pillow',
  pillow: 'pillow',
  bs4: 'beautifulsoup4',
  beautifulsoup4: 'beautifulsoup4',
  requests: 'requests',
  statsmodels: 'statsmodels',
  sqlite3: 'sqlite3',
  xlrd: 'xlrd',
  micropip: 'micropip',
};

const MICROPIP_PACKAGES = new Set(['seaborn', 'openpyxl']);

function detectRequiredPackages(code: string): { pyodidePkgs: string[]; micropipPkgs: string[] } {
  const pyodidePkgs = new Set<string>();
  const micropipPkgs = new Set<string>();

  // Match `import X`, `import X, Y`, `from X.Y import Z`
  const lines = code.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const fromMatch = line.match(/^from\s+([a-zA-Z0-9_]+)/);
    if (fromMatch) {
      const rootMod = fromMatch[1];
      if (IMPORT_TO_PYODIDE_PKG[rootMod]) {
        pyodidePkgs.add(IMPORT_TO_PYODIDE_PKG[rootMod]);
      } else if (MICROPIP_PACKAGES.has(rootMod)) {
        micropipPkgs.add(rootMod);
      }
      continue;
    }

    const importMatch = line.match(/^import\s+(.+)$/);
    if (importMatch) {
      const parts = importMatch[1].split(',');
      for (const part of parts) {
        const token = part.trim().split(/\s+/)[0].split('.')[0];
        if (IMPORT_TO_PYODIDE_PKG[token]) {
          pyodidePkgs.add(IMPORT_TO_PYODIDE_PKG[token]);
        } else if (MICROPIP_PACKAGES.has(token)) {
          micropipPkgs.add(token);
        }
      }
    }
  }

  // If seaborn is requested, ensure numpy, pandas, matplotlib, scipy are also loaded via Pyodide
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

self.onmessage = async (event: MessageEvent) => {
  const { action, payload, id } = event.data;

  try {
    if (action === 'init') {
      await initPyodide();
      return;
    }

    if (action === 'resetRuntime') {
      const py = await initPyodide();
      await py.runPythonAsync(`
for _k in list(globals().keys()):
    if not _k.startswith('_') and _k not in ('os', 'sys', 'io', 'base64', 'json', 'builtins', 'warnings'):
        try:
            del globals()[_k]
        except Exception:
            pass
`);
      await py.runPythonAsync(PYTHON_PREAMBLE);
      postMessage({
        type: 'runtimeReset',
        id,
        state: 'ready',
        installed: Array.from(installedPackages),
        message: 'Python namespace reset cleanly.',
      });
      return;
    }

    if (action === 'loadPackages') {
      const py = await initPyodide();
      const packages: string[] = payload.packages || [];
      const toLoad = packages.filter((p) => !installedPackages.has(p));

      if (toLoad.length > 0) {
        postMessage({
          type: 'status',
          state: 'loading_packages',
          message: `Loading packages: ${toLoad.join(', ')}...`,
        });
        for (const pkg of toLoad) {
          postMessage({ type: 'packageLoading', package: pkg });
          try {
            await py.loadPackage(pkg);
            installedPackages.add(pkg);
            postMessage({ type: 'packageLoaded', package: pkg, installed: Array.from(installedPackages) });
          } catch (pkgErr: any) {
            postMessage({
              type: 'packageError',
              package: pkg,
              error: pkgErr.message || String(pkgErr),
            });
          }
        }
      }

      postMessage({
        type: 'packagesReady',
        id,
        state: 'ready',
        installed: Array.from(installedPackages),
      });
      return;
    }

    if (action === 'installMicropip') {
      const py = await initPyodide();
      const pkgName = (payload.package || '').trim();
      if (!pkgName) return;

      postMessage({
        type: 'status',
        state: 'loading_packages',
        message: `Installing '${pkgName}' via micropip...`,
      });
      try {
        if (!installedPackages.has('micropip')) {
          await py.loadPackage('micropip');
          installedPackages.add('micropip');
        }
        const micropip = py.pyimport('micropip');
        await micropip.install(pkgName);
        installedPackages.add(pkgName);
        postMessage({
          type: 'micropipSuccess',
          package: pkgName,
          installed: Array.from(installedPackages),
          id,
        });
      } catch (e: any) {
        postMessage({
          type: 'micropipError',
          package: pkgName,
          error: e.message || String(e),
          id,
        });
      }
      return;
    }

    if (action === 'uploadFile') {
      const py = await initPyodide();
      const { name, data, isBinary } = payload;
      let bytesOrText: Uint8Array | string = data;
      if (isBinary && data instanceof ArrayBuffer) {
        bytesOrText = new Uint8Array(data);
      } else if (isBinary && ArrayBuffer.isView(data)) {
        bytesOrText = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      } else if (isBinary && typeof data === 'string') {
        // Base64 string fallback
        const binStr = atob(data.replace(/^data:[^;]+;base64,/, ''));
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

    if (action === 'listFiles') {
      const py = await initPyodide();
      const files = listWorkspaceFiles(py);
      postMessage({ type: 'fileList', files, id });
      return;
    }

    if (action === 'downloadFile') {
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

    if (action === 'deleteFile') {
      const py = await initPyodide();
      const { name } = payload;
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

    if (action === 'runCode') {
      const py = await initPyodide();
      const { code, stdin = '', files = [], cellId } = payload;
      const startTime = performance.now();

      // Sync any project files into Pyodide virtual FS before execution
      if (Array.isArray(files) && files.length > 0) {
        try {
          py.FS.mkdirTree('/home/pyodide');
        } catch {}
        for (const f of files) {
          if (!f || !f.name || f.content === undefined) continue;
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
          } catch {}
        }
      }

      // 1. Detect and load required packages (skipping already loaded ones)
      const { pyodidePkgs, micropipPkgs } = detectRequiredPackages(code);
      const missingPyodidePkgs = pyodidePkgs.filter((p) => !installedPackages.has(p));
      const missingMicropipPkgs = micropipPkgs.filter((p) => !installedPackages.has(p));

      if (missingPyodidePkgs.length > 0) {
        postMessage({
          type: 'status',
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
          type: 'status',
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

      // Also let Pyodide scan for any other standard library / lockfile packages if not yet loaded
      try {
        if (typeof py.loadPackagesFromImports === 'function') {
          await py.loadPackagesFromImports(code);
        }
      } catch {}

      postMessage({
        type: 'executionStarted',
        id,
        cellId,
        state: 'running',
        message: 'Executing Python program...',
      });

      let result: any = null;
      let errorOccurred = false;

      try {
        // Configure stdin/input() and Matplotlib Agg hooks
        py.globals.set('_tooltrack_raw_stdin', String(stdin || ''));
        await py.runPythonAsync(`
_tooltrack_configure_io(_tooltrack_raw_stdin)
_tooltrack_setup_environment()
`);
        result = await py.runPythonAsync(code);
      } catch (execErr: any) {
        errorOccurred = true;
        const errMsg = execErr.message || String(execErr);
        postMessage({
          type: 'stderr',
          cellId,
          text: errMsg.endsWith('\n') ? errMsg : errMsg + '\n',
        });
      }

      // Finalize execution: collect plots and DataFrames
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

      postMessage({
        type: 'runComplete',
        state: errorOccurred ? 'failed' : 'completed',
        id,
        cellId,
        success: !errorOccurred,
        executionTimeMs,
        plots,
        dataframes,
        files: workspaceFiles,
        installed: Array.from(installedPackages),
        result: result !== undefined && result !== null ? String(result) : undefined,
      });
      return;
    }
  } catch (globalErr: any) {
    postMessage({
      type: 'error',
      state: 'failed',
      id,
      cellId: payload?.cellId,
      message: globalErr.message || String(globalErr),
    });
  }
};
