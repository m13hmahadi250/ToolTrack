/**
 * ToolTrack Compiler — Runtime Asset Manager, Package Manager & Persistent Offline Cache
 *
 * Manages:
 * 1. CacheStorage for pinned Pyodide v0.26.4 WebAssembly binaries and Python wheels.
 * 2. IndexedDB manifest for verified package readiness, runtime version tracking,
 *    and automatic first-run setup preferences (Standard, Data Science, Complete Offline).
 * 3. Connection quality & storage quota inspection so large scientific bundles are never
 *    silently forced over metered/2G connections.
 */

export const COMPILER_CACHE_NAME = 'tooltrack-compiler-cache-v1';
export const PYODIDE_VERSION = 'v0.26.4';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

export type SetupPreferenceMode = 'standard' | 'datascience' | 'complete';

export type PackageCategory =
  | 'Numerical Computing'
  | 'Data Analysis'
  | 'Data Visualization'
  | 'Machine Learning'
  | 'Image Processing'
  | 'File & Document'
  | 'Utilities & Web';

export interface OfflinePackageInfo {
  id: string;
  importName: string;
  aliases?: string[];
  name: string;
  version: string;
  category: PackageCategory;
  description: string;
  sizeEstimateMb: number;
  isCached: boolean;
  essential?: boolean;
  dataScienceCore?: boolean;
  files: string[];
}

export const CORE_PYODIDE_FILES = [
  'pyodide.mjs',
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

/**
 * Built-in Python 3.12 standard library modules included in python_stdlib.zip.
 * Never treat these as external downloadable packages.
 */
export const STDLIB_PYTHON_MODULES = new Set<string>([
  'abc',
  'argparse',
  'array',
  'ast',
  'asyncio',
  'base64',
  'bisect',
  'builtins',
  'calendar',
  'cmath',
  'collections',
  'concurrent',
  'contextlib',
  'copy',
  'csv',
  'ctypes',
  'dataclasses',
  'datetime',
  'decimal',
  'difflib',
  'dis',
  'email',
  'enum',
  'errno',
  'fnmatch',
  'fractions',
  'functools',
  'gc',
  'getopt',
  'getpass',
  'gettext',
  'glob',
  'gzip',
  'hashlib',
  'heapq',
  'hmac',
  'html',
  'http',
  'importlib',
  'inspect',
  'io',
  'ipaddress',
  'itertools',
  'json',
  'keyword',
  'linecache',
  'locale',
  'logging',
  'lzma',
  'math',
  'mimetypes',
  'numbers',
  'operator',
  'os',
  'pathlib',
  'pickle',
  'platform',
  'PosixPath',
  'pprint',
  'profile',
  'pstats',
  'queue',
  'quopri',
  'random',
  're',
  'reprlib',
  'secrets',
  'select',
  'shlex',
  'shutil',
  'signal',
  'site',
  'smtplib',
  'socket',
  'statistics',
  'string',
  'stringprep',
  'struct',
  'subprocess',
  'sys',
  'sysconfig',
  'tarfile',
  'tempfile',
  'textwrap',
  'threading',
  'time',
  'timeit',
  'token',
  'tokenize',
  'tomllib',
  'Timer',
  'trace',
  'traceback',
  'tracemalloc',
  'types',
  'typing',
  'unicodedata',
  'unittest',
  'urllib',
  'uuid',
  'venv',
  'warnings',
  'weakref',
  'xml',
  'xmlrpc',
  'zipapp',
  'zipfile',
  'zipimport',
  'zlib',
  'zoneinfo',
]);

/**
 * Version-pinned, WebAssembly-compatible Python packages in Pyodide v0.26.4.
 */
export const PYTHON_PACKAGES: OfflinePackageInfo[] = [
  {
    id: 'numpy',
    importName: 'numpy',
    aliases: ['np'],
    name: 'NumPy',
    version: '1.26.4',
    category: 'Numerical Computing',
    description: 'N-dimensional arrays, linear algebra, Fourier transforms, and vectorized numerical computing.',
    sizeEstimateMb: 6.8,
    isCached: false,
    essential: true,
    dataScienceCore: true,
    files: ['numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'pandas',
    importName: 'pandas',
    aliases: ['pd'],
    name: 'pandas',
    version: '2.2.0',
    category: 'Data Analysis',
    description: 'DataFrame & Series analysis, CSV/Excel transformation, missing value imputation, and aggregation.',
    sizeEstimateMb: 11.2,
    isCached: false,
    essential: true,
    dataScienceCore: true,
    files: [
      'pandas-2.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'python_dateutil-2.9.0.post0-py2.py3-none-any.whl',
      'six-1.16.0-py2.py3-none-any.whl',
      'pytz-2024.1-py2.py3-none-any.whl',
    ],
  },
  {
    id: 'matplotlib',
    importName: 'matplotlib',
    aliases: ['plt', 'pyplot', 'pylab'],
    name: 'Matplotlib',
    version: '3.5.2',
    category: 'Data Visualization',
    description: '2D plotting engine for line, bar, scatter, histogram, pie, and multi-axis subplots.',
    sizeEstimateMb: 8.5,
    isCached: false,
    essential: true,
    dataScienceCore: true,
    files: [
      'matplotlib-3.5.2-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'cycler-0.12.1-py3-none-any.whl',
      'six-1.16.0-py2.py3-none-any.whl',
      'fonttools-4.51.0-py3-none-any.whl',
      'kiwisolver-1.4.5-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'packaging-23.2-py3-none-any.whl',
      'pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'pyparsing-3.1.2-py3-none-any.whl',
      'python_dateutil-2.9.0.post0-py2.py3-none-any.whl',
      'pytz-2024.1-py2.py3-none-any.whl',
      'matplotlib_pyodide-0.2.2-py3-none-any.whl',
    ],
  },
  {
    id: 'scikit-learn',
    importName: 'sklearn',
    aliases: ['scikit_learn'],
    name: 'scikit-learn',
    version: '1.4.2',
    category: 'Machine Learning',
    description: 'Machine learning toolkit: StandardScaler, train_test_split, LinearRegression, KMeans, and metrics.',
    sizeEstimateMb: 9.2,
    isCached: false,
    essential: true,
    dataScienceCore: true,
    files: [
      'scikit_learn-1.4.2-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'openblas-0.3.26.zip',
      'joblib-1.4.0-py3-none-any.whl',
      'threadpoolctl-3.4.0-py3-none-any.whl',
    ],
  },
  {
    id: 'scipy',
    importName: 'scipy',
    name: 'SciPy',
    version: '1.12.0',
    category: 'Numerical Computing',
    description: 'Scientific computing algorithms for optimization, integration, interpolation, and statistics.',
    sizeEstimateMb: 14.5,
    isCached: false,
    essential: true,
    files: [
      'scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'openblas-0.3.26.zip',
    ],
  },
  {
    id: 'sympy',
    importName: 'sympy',
    name: 'SymPy',
    version: '1.12',
    category: 'Numerical Computing',
    description: 'Symbolic mathematics and computer algebra system for exact equations, derivatives, and integrals.',
    sizeEstimateMb: 6.1,
    isCached: false,
    files: [
      'sympy-1.12-py3-none-any.whl',
      'mpmath-1.3.0-py3-none-any.whl',
    ],
  },
  {
    id: 'statsmodels',
    importName: 'statsmodels',
    name: 'Statsmodels',
    version: '0.14.2',
    category: 'Data Analysis',
    description: 'Statistical modeling, hypothesis tests, OLS regression, and time-series econometrics.',
    sizeEstimateMb: 9.8,
    isCached: false,
    files: [
      'statsmodels-0.14.2-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'patsy-0.5.6-py2.py3-none-any.whl',
      'packaging-23.2-py3-none-any.whl',
      'numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'pandas-2.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'openblas-0.3.26.zip',
      'python_dateutil-2.9.0.post0-py2.py3-none-any.whl',
      'six-1.16.0-py2.py3-none-any.whl',
      'pytz-2024.1-py2.py3-none-any.whl',
    ],
  },
  {
    id: 'pillow',
    importName: 'PIL',
    aliases: ['pillow'],
    name: 'Pillow (PIL)',
    version: '10.2.0',
    category: 'Image Processing',
    description: 'Python Imaging Library for opening, resizing, filtering, drawing, and exporting images.',
    sizeEstimateMb: 2.4,
    isCached: false,
    files: ['pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'openpyxl',
    importName: 'openpyxl',
    name: 'OpenPyXL',
    version: '3.1.2',
    category: 'File & Document',
    description: 'Read and write Excel (.xlsx) workbooks and integrate with pandas.read_excel().',
    sizeEstimateMb: 0.5,
    isCached: false,
    files: [
      'openpyxl-3.1.2-py2.py3-none-any.whl',
      'et_xmlfile-1.1.0-py3-none-any.whl',
    ],
  },
  {
    id: 'beautifulsoup4',
    importName: 'bs4',
    aliases: ['beautifulsoup4'],
    name: 'BeautifulSoup4',
    version: '4.12.3',
    category: 'Utilities & Web',
    description: 'HTML and XML parser for structured document extraction and tree traversal.',
    sizeEstimateMb: 0.4,
    isCached: false,
    files: [
      'beautifulsoup4-4.12.3-py3-none-any.whl',
      'soupsieve-2.5-py3-none-any.whl',
    ],
  },
  {
    id: 'requests',
    importName: 'requests',
    name: 'Requests',
    version: '2.31.0',
    category: 'Utilities & Web',
    description: 'HTTP client library (subject to browser CORS and WebAssembly networking rules).',
    sizeEstimateMb: 0.6,
    isCached: false,
    files: [
      'requests-2.31.0-py3-none-any.whl',
      'charset_normalizer-3.3.2-py3-none-any.whl',
      'idna-3.7-py3-none-any.whl',
      'urllib3-2.2.1-py3-none-any.whl',
      'certifi-2024.2.2-py3-none-any.whl',
    ],
  },
  {
    id: 'networkx',
    importName: 'networkx',
    aliases: ['nx'],
    name: 'NetworkX',
    version: '3.2.1',
    category: 'Numerical Computing',
    description: 'Graph theory, network structure analysis, shortest paths, and connectivity algorithms.',
    sizeEstimateMb: 2.1,
    isCached: false,
    files: ['networkx-3.2.1-py3-none-any.whl'],
  },
  {
    id: 'pyyaml',
    importName: 'yaml',
    aliases: ['pyyaml'],
    name: 'PyYAML',
    version: '6.0.1',
    category: 'File & Document',
    description: 'YAML parser and emitter for configuration files and structured data serialization.',
    sizeEstimateMb: 0.3,
    isCached: false,
    files: ['pyyaml-6.0.1-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'regex',
    importName: 'regex',
    name: 'Regex',
    version: '2023.12.25',
    category: 'Utilities & Web',
    description: 'Advanced regular expression engine with Unicode properties and fuzzy matching.',
    sizeEstimateMb: 0.5,
    isCached: false,
    files: ['regex-2023.12.25-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'sqlite3',
    importName: 'sqlite3',
    name: 'SQLite3',
    version: '1.0.0',
    category: 'File & Document',
    description: 'Embedded relational SQL database engine running in-memory or on the virtual filesystem.',
    sizeEstimateMb: 0.9,
    isCached: false,
    files: ['sqlite3-1.0.0.zip'],
  },
  {
    id: 'joblib',
    importName: 'joblib',
    name: 'Joblib',
    version: '1.4.0',
    category: 'Machine Learning',
    description: 'Lightweight pipelining and fast disk persistence for NumPy arrays and ML models.',
    sizeEstimateMb: 0.4,
    isCached: false,
    files: ['joblib-1.4.0-py3-none-any.whl'],
  },
  {
    id: 'micropip',
    importName: 'micropip',
    name: 'micropip',
    version: '0.6.0',
    category: 'Utilities & Web',
    description: 'Pure-Python wheel installer for Pyodide (installs pure-Python packages from PyPI when online).',
    sizeEstimateMb: 0.2,
    isCached: false,
    essential: true,
    files: [
      'micropip-0.6.0-py3-none-any.whl',
      'packaging-23.2-py3-none-any.whl',
    ],
  },
];

export interface CacheCheckStatus {
  hasCore: boolean;
  coreReady: boolean;
  isDataScienceReady: boolean;
  allPackagesReady: boolean;
  totalCachedFiles: number;
  totalCachedBytes: number;
  estimatedSizeMB: number;
  packages: Record<string, boolean>;
  cachedPackages: string[];
  runtimeVersion: string;
  setupMode: SetupPreferenceMode;
  isMeteredConnection: boolean;
  storageQuota?: {
    usageBytes: number;
    quotaBytes: number;
    percentUsed: number;
  };
}

const SETUP_MODE_KEY = 'tooltrack_compiler_setup_mode_v1';
const IDB_NAME = 'tooltrack_compiler_metadata_v1';
const IDB_STORE = 'manifests';

/**
 * Get or set user's automatic setup preference mode
 */
export function getSetupPreferenceMode(): SetupPreferenceMode {
  try {
    const val = localStorage.getItem(SETUP_MODE_KEY);
    if (val === 'standard' || val === 'datascience' || val === 'complete') {
      return val;
    }
  } catch {}
  return 'standard';
}

export function setSetupPreferenceMode(mode: SetupPreferenceMode): void {
  try {
    localStorage.setItem(SETUP_MODE_KEY, mode);
  } catch {}
  saveManifestToIdb('setupMode', { mode, updatedAt: Date.now() }).catch(() => {});
}

/**
 * Detect whether user is on a metered / Save-Data / 2G connection
 * so we never auto-download large bundles unprompted.
 */
export function isMeteredOrSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  return false;
}

/**
 * Save metadata record to IndexedDB (with graceful fallback)
 */
async function saveManifestToIdb(key: string, value: any): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(value, key);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Check if browser supports Cache Storage
 */
export function isCacheSupported(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Inspect which files are currently stored in the compiler cache.
 * Uses strict `.every()` verification so a package is only marked ready
 * when ALL of its wheel dependencies exist in CacheStorage.
 */
export async function inspectCompilerCache(): Promise<CacheCheckStatus> {
  const setupMode = getSetupPreferenceMode();
  const isMeteredConnection = isMeteredOrSlowConnection();

  if (!isCacheSupported()) {
    return {
      hasCore: false,
      coreReady: false,
      isDataScienceReady: false,
      allPackagesReady: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      estimatedSizeMB: 0,
      packages: {},
      cachedPackages: [],
      runtimeVersion: PYODIDE_VERSION,
      setupMode,
      isMeteredConnection,
    };
  }

  try {
    const cache = await caches.open(COMPILER_CACHE_NAME);
    const keys = await cache.keys();
    const cachedUrls = new Set(keys.map((k) => k.url));

    // Verify all core Pyodide runtime files exist
    const hasCore = CORE_PYODIDE_FILES.every((f) =>
      cachedUrls.has(`${PYODIDE_BASE_URL}${f}`)
    );

    // Verify every file for each package exists
    const packageStatus: Record<string, boolean> = {};
    const cachedPackages: string[] = [];
    let estimatedMb = hasCore ? 11.4 : 0;

    for (const pkg of PYTHON_PACKAGES) {
      const isPkgCached = pkg.files.every((f) =>
        cachedUrls.has(`${PYODIDE_BASE_URL}${f}`)
      );
      packageStatus[pkg.id] = isPkgCached;
      if (isPkgCached) {
        cachedPackages.push(pkg.id);
        estimatedMb += pkg.sizeEstimateMb;
      }
    }

    const isDataScienceReady =
      hasCore &&
      Boolean(packageStatus['numpy']) &&
      Boolean(packageStatus['pandas']) &&
      Boolean(packageStatus['matplotlib']) &&
      Boolean(packageStatus['scikit-learn']);

    // Storage estimate
    let storageQuota: CacheCheckStatus['storageQuota'] = undefined;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          storageQuota = {
            usageBytes: estimate.usage,
            quotaBytes: estimate.quota,
            percentUsed: Math.round((estimate.usage / Math.max(1, estimate.quota)) * 100),
          };
        }
      } catch {}
    }

    const status: CacheCheckStatus = {
      hasCore,
      coreReady: hasCore,
      isDataScienceReady,
      allPackagesReady: isDataScienceReady,
      totalCachedFiles: keys.length,
      totalCachedBytes: storageQuota?.usageBytes || Math.round(estimatedMb * 1024 * 1024),
      estimatedSizeMB: Number(estimatedMb.toFixed(1)),
      packages: packageStatus,
      cachedPackages,
      runtimeVersion: PYODIDE_VERSION,
      setupMode,
      isMeteredConnection,
      storageQuota,
    };

    await saveManifestToIdb('cacheStatus', {
      runtimeVersion: PYODIDE_VERSION,
      hasCore,
      cachedPackages,
      verifiedAt: Date.now(),
    });

    return status;
  } catch (err) {
    console.warn('[OfflineCompilerCache] Failed to inspect cache:', err);
    return {
      hasCore: false,
      coreReady: false,
      isDataScienceReady: false,
      allPackagesReady: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      estimatedSizeMB: 0,
      packages: {},
      cachedPackages: [],
      runtimeVersion: PYODIDE_VERSION,
      setupMode,
      isMeteredConnection,
    };
  }
}

/**
 * Alias for inspectCompilerCache for backward compatibility
 */
export const checkOfflineCacheStatus = inspectCompilerCache;

/**
 * Download a list of files into CacheStorage with progress tracking and integrity checks
 */
export async function downloadFilesToCache(
  relativeUrls: string[],
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  if (!isCacheSupported()) {
    throw new Error('Cache Storage API is not supported in this browser.');
  }

  // Request persistent storage if available
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      await navigator.storage.persist();
    } catch {}
  }

  const uniqueUrls = Array.from(new Set(relativeUrls.filter(Boolean)));
  const cache = await caches.open(COMPILER_CACHE_NAME);
  const total = uniqueUrls.length;
  let loaded = 0;

  for (const rel of uniqueUrls) {
    const fullUrl = `${PYODIDE_BASE_URL}${rel}`;
    if (onProgress) {
      onProgress({
        loaded,
        total,
        currentFile: rel,
        percent: Math.round((loaded / Math.max(1, total)) * 100),
      });
    }

    const existing = await cache.match(fullUrl);
    if (!existing) {
      let response: Response | null = null;
      let lastErr: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(fullUrl, { mode: 'cors' });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            if (buf.byteLength === 0) {
              throw new Error(`Empty response for ${rel}`);
            }
            const contentType = rel.endsWith('.wasm')
              ? 'application/wasm'
              : rel.endsWith('.js') || rel.endsWith('.mjs')
              ? 'application/javascript'
              : rel.endsWith('.json')
              ? 'application/json'
              : 'application/octet-stream';

            response = new Response(buf, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Length': String(buf.byteLength),
              },
            });
            break;
          } else {
            lastErr = new Error(`HTTP ${res.status}`);
          }
        } catch (fetchErr: any) {
          lastErr = fetchErr;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }

      if (!response) {
        throw new Error(`Failed to download ${rel}: ${lastErr?.message || 'Network error'}`);
      }
      await cache.put(fullUrl, response);
    }

    loaded++;
  }

  if (onProgress) {
    onProgress({
      loaded: total,
      total,
      currentFile: 'Complete',
      percent: 100,
    });
  }
}

/**
 * Download Pyodide Core runtime for offline execution
 */
export async function downloadCoreRuntime(
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  await downloadFilesToCache(CORE_PYODIDE_FILES, onProgress);
}

/**
 * Download a specific Python package and its dependencies for offline execution
 */
export async function downloadPythonPackage(
  packageId: string,
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  const pkg = PYTHON_PACKAGES.find(
    (p) => p.id === packageId || p.importName === packageId
  );
  if (!pkg) {
    throw new Error(`Unknown package ID: ${packageId}`);
  }
  const filesToFetch = Array.from(new Set([...CORE_PYODIDE_FILES, ...pkg.files]));
  await downloadFilesToCache(filesToFetch, onProgress);
}

/**
 * Download a selected subset of packages (e.g. Data Science Setup)
 */
export async function downloadSelectedPackages(
  packageIds: string[],
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  const files = new Set<string>(CORE_PYODIDE_FILES);
  for (const id of packageIds) {
    const pkg = PYTHON_PACKAGES.find((p) => p.id === id || p.importName === id);
    if (pkg) {
      pkg.files.forEach((f) => files.add(f));
    }
  }
  await downloadFilesToCache(Array.from(files), onProgress);
}

/**
 * Download Data Science core bundle (Python Core + NumPy, pandas, Matplotlib, scikit-learn, micropip)
 */
export async function downloadDataSciencePreset(
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  const dsIds = PYTHON_PACKAGES.filter((p) => p.dataScienceCore || p.id === 'micropip').map((p) => p.id);
  await downloadSelectedPackages(dsIds, onProgress);
}

/**
 * Download all core runtime files + all supported catalog packages for 100% offline execution
 */
export async function downloadFullDataScienceBundle(
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  const allFiles = new Set<string>();
  CORE_PYODIDE_FILES.forEach((f) => allFiles.add(f));

  PYTHON_PACKAGES.forEach((pkg) => {
    pkg.files.forEach((f) => allFiles.add(f));
  });

  await downloadFilesToCache(Array.from(allFiles), onProgress);
}

/**
 * Remove a specific package's unique wheels from CacheStorage without deleting core or shared dependencies
 */
export async function removeCachedPackage(packageId: string): Promise<void> {
  if (!isCacheSupported()) return;
  const targetPkg = PYTHON_PACKAGES.find((p) => p.id === packageId);
  if (!targetPkg) return;

  const cache = await caches.open(COMPILER_CACHE_NAME);
  // Only delete wheel files not required by other still-cached packages
  const status = await inspectCompilerCache();
  const otherCachedPkgs = PYTHON_PACKAGES.filter(
    (p) => p.id !== packageId && status.packages[p.id]
  );
  const sharedFiles = new Set<string>(CORE_PYODIDE_FILES);
  for (const other of otherCachedPkgs) {
    other.files.forEach((f) => sharedFiles.add(f));
  }

  for (const file of targetPkg.files) {
    if (!sharedFiles.has(file)) {
      await cache.delete(`${PYODIDE_BASE_URL}${file}`);
    }
  }
}

/**
 * Clear compiler offline cache (never touches user projects or Whiteboard storage)
 */
export async function clearCompilerCache(): Promise<boolean> {
  if (!isCacheSupported()) return false;
  try {
    return await caches.delete(COMPILER_CACHE_NAME);
  } catch (err) {
    console.error('[OfflineCompilerCache] Failed to delete cache:', err);
    return false;
  }
}
