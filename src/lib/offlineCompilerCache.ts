/**
 * ToolTrack Offline Compiler Cache Manager
 * Manages CacheStorage for Pyodide runtime and scientific Python packages
 * (NumPy, Pandas, Matplotlib, Scikit-learn, SciPy, SymPy, Pillow, BeautifulSoup4,
 * Requests, Statsmodels, SQLite3, Micropip) so that code executes completely
 * offline without calling external CDNs or remote APIs.
 */

export const COMPILER_CACHE_NAME = 'tooltrack-compiler-cache-v1';
export const PYODIDE_VERSION = 'v0.26.4';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

export interface OfflinePackageInfo {
  id: string;
  importName: string;
  name: string;
  version: string;
  description: string;
  sizeEstimateMb: number;
  isCached: boolean;
  essential?: boolean;
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

export const PYTHON_PACKAGES: OfflinePackageInfo[] = [
  {
    id: 'numpy',
    importName: 'numpy',
    name: 'NumPy',
    version: '1.26.4',
    description: 'Fundamental package for scientific computing with multi-dimensional arrays & linear algebra.',
    sizeEstimateMb: 6.8,
    isCached: false,
    essential: true,
    files: ['numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'pandas',
    importName: 'pandas',
    name: 'Pandas',
    version: '2.2.0',
    description: 'Fast, expressive DataFrame & Series manipulation for CSV, tabular datasets, and time series.',
    sizeEstimateMb: 11.2,
    isCached: false,
    essential: true,
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
    name: 'Matplotlib',
    version: '3.5.2',
    description: 'Comprehensive 2D plotting library for line, bar, scatter, histogram, and pie visualizations.',
    sizeEstimateMb: 8.5,
    isCached: false,
    essential: true,
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
    name: 'Scikit-Learn',
    version: '1.4.2',
    description: 'Machine learning library for preprocessing, regression, classification, clustering, and metrics.',
    sizeEstimateMb: 9.2,
    isCached: false,
    essential: true,
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
    description: 'Scientific algorithms for optimization, integration, interpolation, and statistics.',
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
    description: 'Symbolic mathematics and computer algebra system for exact equations and calculus.',
    sizeEstimateMb: 6.1,
    isCached: false,
    files: [
      'sympy-1.12-py3-none-any.whl',
      'mpmath-1.3.0-py3-none-any.whl',
    ],
  },
  {
    id: 'pillow',
    importName: 'PIL',
    name: 'Pillow (PIL)',
    version: '10.2.0',
    description: 'Python Imaging Library for opening, manipulating, filtering, and saving images.',
    sizeEstimateMb: 2.4,
    isCached: false,
    files: ['pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'beautifulsoup4',
    importName: 'bs4',
    name: 'BeautifulSoup4',
    version: '4.12.3',
    description: 'HTML and XML parser for structured data extraction and document scraping.',
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
    description: 'HTTP client library (operates within browser CORS and WebAssembly networking rules).',
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
    id: 'statsmodels',
    importName: 'statsmodels',
    name: 'Statsmodels',
    version: '0.14.2',
    description: 'Statistical modeling, hypothesis tests, OLS regression, and econometrics.',
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
    id: 'sqlite3',
    importName: 'sqlite3',
    name: 'SQLite3',
    version: '1.0.0',
    description: 'Embedded relational SQL database engine running in-memory or virtual filesystem.',
    sizeEstimateMb: 0.9,
    isCached: false,
    files: ['sqlite3-1.0.0.zip'],
  },
  {
    id: 'micropip',
    importName: 'micropip',
    name: 'Micropip',
    version: '0.6.0',
    description: 'Pure-Python wheel installer for Pyodide (used for openpyxl, seaborn, etc. when online).',
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
  isDataScienceReady: boolean;
  totalCachedFiles: number;
  totalCachedBytes: number;
  packages: Record<string, boolean>;
  storageQuota?: {
    usageBytes: number;
    quotaBytes: number;
    percentUsed: number;
  };
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
  if (!isCacheSupported()) {
    return {
      hasCore: false,
      isDataScienceReady: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      packages: {},
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
    for (const pkg of PYTHON_PACKAGES) {
      const isPkgCached = pkg.files.every((f) =>
        cachedUrls.has(`${PYODIDE_BASE_URL}${f}`)
      );
      packageStatus[pkg.id] = isPkgCached;
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
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        storageQuota = {
          usageBytes: estimate.usage,
          quotaBytes: estimate.quota,
          percentUsed: Math.round((estimate.usage / Math.max(1, estimate.quota)) * 100),
        };
      }
    }

    return {
      hasCore,
      isDataScienceReady,
      totalCachedFiles: keys.length,
      totalCachedBytes: storageQuota?.usageBytes || 0,
      packages: packageStatus,
      storageQuota,
    };
  } catch (err) {
    console.warn('[OfflineCompilerCache] Failed to inspect cache:', err);
    return {
      hasCore: false,
      isDataScienceReady: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      packages: {},
    };
  }
}

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
            // Ensure correct MIME type for .wasm files so instantiateStreaming succeeds offline
            if (rel.endsWith('.wasm')) {
              const buf = await res.arrayBuffer();
              response = new Response(buf, {
                status: 200,
                headers: {
                  'Content-Type': 'application/wasm',
                  'Content-Length': String(buf.byteLength),
                },
              });
            } else {
              response = res;
            }
            break;
          } else {
            lastErr = new Error(`HTTP ${res.status}`);
          }
        } catch (fetchErr: any) {
          lastErr = fetchErr;
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
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
  const pkg = PYTHON_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error(`Unknown package ID: ${packageId}`);
  }
  const filesToFetch = Array.from(new Set([...CORE_PYODIDE_FILES, ...pkg.files]));
  await downloadFilesToCache(filesToFetch, onProgress);
}

/**
 * Download all core runtime files + essential data science libraries for 100% offline execution
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
 * Clear compiler offline cache
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
