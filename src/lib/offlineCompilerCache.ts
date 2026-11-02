/**
 * ToolTrack Offline Compiler Cache Manager
 * Manages CacheStorage for Pyodide runtime and scientific Python packages
 * (NumPy, Pandas, Matplotlib, Scikit-learn, SciPy, SymPy) so that code
 * executes completely offline without calling external CDNs or remote APIs.
 */

export const COMPILER_CACHE_NAME = 'tooltrack-compiler-cache-v1';
export const PYODIDE_VERSION = 'v0.26.4';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

export interface OfflinePackageInfo {
  id: string;
  name: string;
  description: string;
  sizeEstimateMb: number;
  isCached: boolean;
  files: string[];
}

export const CORE_PYODIDE_FILES = [
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

export const PYTHON_PACKAGES: OfflinePackageInfo[] = [
  {
    id: 'numpy',
    name: 'NumPy',
    description: 'Fundamental package for scientific computing with multi-dimensional arrays & math routines.',
    sizeEstimateMb: 6.8,
    isCached: false,
    files: ['numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'pandas',
    name: 'Pandas',
    description: 'Fast, flexible data analysis & DataFrame manipulation structures for structured datasets.',
    sizeEstimateMb: 11.2,
    isCached: false,
    files: [
      'pandas-2.2.2-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'python_dateutil-2.9.0.post0-py2.py3-none-any.whl',
      'pytz-2024.1-py2.py3-none-any.whl',
      'six-1.16.0-py2.py3-none-any.whl',
    ],
  },
  {
    id: 'matplotlib',
    name: 'Matplotlib',
    description: 'Comprehensive 2D plotting & visualization library for static and animated charts.',
    sizeEstimateMb: 8.5,
    isCached: false,
    files: [
      'matplotlib-3.8.4-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'matplotlib_pyodide-0.2.2-py3-none-any.whl',
      'kiwisolver-1.4.5-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'fonttools-4.51.0-py3-none-any.whl',
      'cycler-0.12.1-py3-none-any.whl',
      'contourpy-1.2.1-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'pyparsing-3.1.2-py3-none-any.whl',
    ],
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-Learn',
    description: 'Machine learning tools for predictive data analysis, classification, regression, and clustering.',
    sizeEstimateMb: 9.2,
    isCached: false,
    files: [
      'scikit_learn-1.4.2-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl',
      'joblib-1.4.0-py3-none-any.whl',
      'threadpoolctl-3.4.0-py3-none-any.whl',
    ],
  },
  {
    id: 'scipy',
    name: 'SciPy',
    description: 'Advanced mathematics, science, and engineering algorithms built on NumPy.',
    sizeEstimateMb: 14.5,
    isCached: false,
    files: ['scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl'],
  },
  {
    id: 'sympy',
    name: 'SymPy',
    description: 'Full-featured computer algebra system for symbolic mathematics and calculus.',
    sizeEstimateMb: 6.1,
    isCached: false,
    files: ['sympy-1.12-py3-none-any.whl', 'mpmath-1.3.0-py3-none-any.whl'],
  },
];

export interface CacheCheckStatus {
  hasCore: boolean;
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
 * Inspect which files are currently stored in the compiler cache
 */
export async function inspectCompilerCache(): Promise<CacheCheckStatus> {
  if (!isCacheSupported()) {
    return {
      hasCore: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      packages: {},
    };
  }

  try {
    const cache = await caches.open(COMPILER_CACHE_NAME);
    const keys = await cache.keys();
    const cachedUrls = new Set(keys.map((k) => k.url));

    // Check core files
    const hasCore = CORE_PYODIDE_FILES.every((f) =>
      cachedUrls.has(`${PYODIDE_BASE_URL}${f}`)
    );

    // Check individual packages
    const packageStatus: Record<string, boolean> = {};
    for (const pkg of PYTHON_PACKAGES) {
      const isPkgCached = pkg.files.some((f) =>
        cachedUrls.has(`${PYODIDE_BASE_URL}${f}`)
      );
      packageStatus[pkg.id] = isPkgCached;
    }

    // Storage estimate
    let storageQuota: any = undefined;
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        storageQuota = {
          usageBytes: estimate.usage,
          quotaBytes: estimate.quota,
          percentUsed: Math.round((estimate.usage / estimate.quota) * 100),
        };
      }
    }

    return {
      hasCore,
      totalCachedFiles: keys.length,
      totalCachedBytes: (storageQuota?.usageBytes || 0),
      packages: packageStatus,
      storageQuota,
    };
  } catch (err) {
    console.warn('[OfflineCompilerCache] Failed to inspect cache:', err);
    return {
      hasCore: false,
      totalCachedFiles: 0,
      totalCachedBytes: 0,
      packages: {},
    };
  }
}

/**
 * Download a list of files into CacheStorage with progress tracking
 */
export async function downloadFilesToCache(
  relativeUrls: string[],
  onProgress?: (progress: { loaded: number; total: number; currentFile: string; percent: number }) => void
): Promise<void> {
  if (!isCacheSupported()) {
    throw new Error('Cache Storage API is not supported in this browser.');
  }

  const cache = await caches.open(COMPILER_CACHE_NAME);
  const total = relativeUrls.length;
  let loaded = 0;

  for (const rel of relativeUrls) {
    const fullUrl = `${PYODIDE_BASE_URL}${rel}`;
    if (onProgress) {
      onProgress({
        loaded,
        total,
        currentFile: rel,
        percent: Math.round((loaded / total) * 100),
      });
    }

    // Check if already in cache
    const existing = await cache.match(fullUrl);
    if (!existing) {
      const response = await fetch(fullUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to download ${rel}: status ${response.status}`);
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
  await downloadFilesToCache(pkg.files, onProgress);
}

/**
 * Download all recommended data science libraries + core for 100% offline bundle
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
