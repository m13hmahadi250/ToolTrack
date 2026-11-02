/**
 * ToolTrack Python 3 Pyodide WebAssembly Worker
 * Runs real Python in an isolated Web Worker with genuine Pandas, NumPy,
 * Matplotlib, Scikit-learn, SciPy, and SymPy support.
 * Also provides virtual filesystem management for uploaded datasets (CSV, TXT, etc.)
 * and automatic Matplotlib plot figure capture into PNG base64 images.
 */

// Global Pyodide reference
let pyodideInstance: any = null;
let isInitializing = false;
let installedPackages = new Set<string>();

const PYODIDE_VERSION = 'v0.26.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// Python initialization preamble to setup plot capturing, warning filters, and stdin/stdout hooks
const PYTHON_PREAMBLE = `
import sys
import io
import base64
import warnings

# Suppress Pyarrow deprecation warnings from pandas and other noisy library notices
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*Pyarrow.*')
warnings.filterwarnings('ignore', message='.*pyarrow.*')

# Helper function to capture any generated matplotlib plots as base64 PNGs
def _tooltrack_capture_plots():
    figures = []
    if 'matplotlib.pyplot' in sys.modules:
        import matplotlib.pyplot as plt
        for fig_num in plt.get_fignums():
            fig = plt.figure(fig_num)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
            buf.seek(0)
            figures.append(base64.b64encode(buf.read()).decode('utf-8'))
            plt.close(fig)
    return figures
`;

async function initPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (isInitializing) {
    let waitCount = 0;
    while (isInitializing && waitCount < 120) {
      await new Promise((r) => setTimeout(r, 100));
      waitCount++;
    }
    if (pyodideInstance) return pyodideInstance;
  }

  isInitializing = true;
  postMessage({ type: 'status', state: 'initializing', message: 'Loading Pyodide WebAssembly runtime...' });

  try {
    // In an ES module worker (type: 'module'), importScripts() throws TypeError.
    // Instead, dynamically import the official pyodide.mjs ES module.
    let loadPyodideFn: any = null;
    try {
      const pyodideModule = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
      loadPyodideFn = pyodideModule.loadPyodide;
    } catch (importErr: any) {
      console.warn('[Pyodide Worker] ESM dynamic import failed, checking global:', importErr);
      if (typeof (self as any).loadPyodide === 'function') {
        loadPyodideFn = (self as any).loadPyodide;
      } else {
        throw new Error(`Failed to load Pyodide module: ${importErr?.message || String(importErr)}`);
      }
    }

    if (!loadPyodideFn) {
      throw new Error('Pyodide load function was not found.');
    }

    postMessage({ type: 'status', state: 'initializing', message: 'Initializing Python 3 engine...' });

    pyodideInstance = await loadPyodideFn({
      indexURL: PYODIDE_INDEX_URL,
      stdout: (text: string) => {
        postMessage({ type: 'stdout', text: text.endsWith('\n') ? text : text + '\n' });
      },
      stderr: (text: string) => {
        // Filter out noisy library deprecation warnings like pandas pyarrow notice
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

    // Run preamble to setup plot capturing
    try {
      await pyodideInstance.runPythonAsync(PYTHON_PREAMBLE);
    } catch (preambleErr) {
      console.warn('[Pyodide Worker] Preamble warning:', preambleErr);
    }

    postMessage({
      type: 'initialized',
      state: 'ready',
      version: pyodideInstance.version || PYODIDE_VERSION,
      message: 'Python 3 runtime ready.',
    });

    return pyodideInstance;
  } catch (err: any) {
    console.error('[Pyodide Worker Error]:', err);
    postMessage({
      type: 'error',
      state: 'failed',
      message: `Failed to initialize Python runtime: ${err.message || String(err)}`,
    });
    throw err;
  } finally {
    isInitializing = false;
  }
}

// Handle incoming messages from UI thread
self.onmessage = async (event: MessageEvent) => {
  const { action, payload, id } = event.data;

  try {
    if (action === 'init') {
      await initPyodide();
      return;
    }

    if (action === 'loadPackages') {
      const py = await initPyodide();
      const packages: string[] = payload.packages || [];
      const toLoad = packages.filter((p) => !installedPackages.has(p));

      if (toLoad.length > 0) {
        postMessage({ type: 'status', message: `Loading packages: ${toLoad.join(', ')}...` });
        for (const pkg of toLoad) {
          postMessage({ type: 'packageLoading', package: pkg });
          try {
            await py.loadPackage(pkg);
            installedPackages.add(pkg);
            postMessage({ type: 'packageLoaded', package: pkg });
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
        installed: Array.from(installedPackages),
      });
      return;
    }

    if (action === 'installMicropip') {
      const py = await initPyodide();
      const pkgName = payload.package;
      postMessage({ type: 'status', message: `Installing ${pkgName} via micropip...` });
      try {
        await py.loadPackage('micropip');
        const micropip = py.pyimport('micropip');
        await micropip.install(pkgName);
        installedPackages.add(pkgName);
        postMessage({ type: 'micropipSuccess', package: pkgName, id });
      } catch (e: any) {
        postMessage({ type: 'micropipError', package: pkgName, error: e.message, id });
      }
      return;
    }

    if (action === 'uploadFile') {
      const py = await initPyodide();
      const { name, data, isBinary } = payload;
      // Write file into Pyodide virtual filesystem
      if (isBinary) {
        py.FS.writeFile(name, new Uint8Array(data));
      } else {
        py.FS.writeFile(name, data);
      }
      postMessage({
        type: 'fileUploaded',
        name,
        path: `/${name}`,
        id,
      });
      return;
    }

    if (action === 'listFiles') {
      const py = await initPyodide();
      try {
        const files = py.FS.readdir('/').filter((f: string) => f !== '.' && f !== '..');
        postMessage({ type: 'fileList', files, id });
      } catch (err: any) {
        postMessage({ type: 'fileListError', error: err.message, id });
      }
      return;
    }

    if (action === 'downloadFile') {
      const py = await initPyodide();
      const { name } = payload;
      try {
        const content = py.FS.readFile(name);
        postMessage({ type: 'fileContent', name, content, id });
      } catch (err: any) {
        postMessage({ type: 'fileDownloadError', error: err.message, id });
      }
      return;
    }

    if (action === 'runCode') {
      const py = await initPyodide();
      const { code, stdin = '' } = payload;
      const startTime = performance.now();

      // Configure stdin lines queue
      let stdinIndex = 0;
      const stdinChars = stdin.length > 0 ? stdin : '';
      py.setStdin({
        stdin: () => {
          if (stdinIndex < stdinChars.length) {
            return stdinChars.charCodeAt(stdinIndex++);
          }
          return null;
        },
      });

      // 1. Pyodide built-in AST import scanner & dependency loader
      try {
        if (typeof py.loadPackagesFromImports === 'function') {
          postMessage({
            type: 'status',
            state: 'loading_packages',
            message: 'Checking and loading imported libraries...',
          });
          await py.loadPackagesFromImports(code);
        }
      } catch (autoPkgErr) {
        console.warn('[Pyodide Worker] loadPackagesFromImports notice:', autoPkgErr);
      }

      // 2. Explicit package check for common scientific libraries
      const potentialPackages: { [key: string]: string } = {
        pandas: 'pandas',
        numpy: 'numpy',
        matplotlib: 'matplotlib',
        sklearn: 'scikit-learn',
        scipy: 'scipy',
        sympy: 'sympy',
      };

      const pkgsToLoad = new Set<string>();
      for (const [key, pkg] of Object.entries(potentialPackages)) {
        const regex = new RegExp(`(?:import|from)\\s+${key}(?:\\s|\\.|,|$)`);
        if (regex.test(code) && !installedPackages.has(pkg)) {
          pkgsToLoad.add(pkg);
        }
      }

      if (pkgsToLoad.size > 0) {
        postMessage({
          type: 'status',
          state: 'loading_packages',
          message: `Loading libraries: ${Array.from(pkgsToLoad).join(', ')}...`,
        });
        for (const p of pkgsToLoad) {
          try {
            await py.loadPackage(p);
            installedPackages.add(p);
          } catch (loadErr: any) {
            console.warn(`[Pyodide Worker] loadPackage('${p}') warning:`, loadErr);
          }
        }
      }

      postMessage({
        type: 'executionStarted',
        id,
        state: 'running',
        message: 'Executing program...',
      });
      postMessage({ type: 'status', state: 'running', message: 'Executing program...' });

      let result: any = null;
      let errorOccurred = false;

      try {
        // Enforce warning suppression right before running user code
        await py.runPythonAsync(`
import warnings
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*Pyarrow.*')
warnings.filterwarnings('ignore', message='.*pyarrow.*')
`);
        result = await py.runPythonAsync(code);
      } catch (execErr: any) {
        errorOccurred = true;
        const errMsg = execErr.message || String(execErr);
        postMessage({ type: 'stderr', text: `\nTraceback (most recent call last):\n${errMsg}\n` });
      }

      // Check if any matplotlib figures were generated
      let plots: string[] = [];
      try {
        const plotResult = await py.runPythonAsync('_tooltrack_capture_plots()');
        if (plotResult && typeof plotResult.toJs === 'function') {
          plots = plotResult.toJs();
        } else if (Array.isArray(plotResult)) {
          plots = plotResult;
        }
      } catch (plotErr) {
        // Matplotlib was not imported or no plots generated
      }

      const executionTimeMs = Math.round(performance.now() - startTime);

      postMessage({
        type: 'runComplete',
        state: errorOccurred ? 'failed' : 'completed',
        id,
        success: !errorOccurred,
        executionTimeMs,
        plots,
        result: result !== undefined && result !== null ? String(result) : undefined,
      });
      return;
    }
  } catch (globalErr: any) {
    postMessage({
      type: 'error',
      id,
      message: globalErr.message || String(globalErr),
    });
  }
};
