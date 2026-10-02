/**
 * Persistent IndexedDB Cache Helper for Model Weights & Assets
 * Stores heavy neural model weights locally in IndexedDB to eliminate cold starts.
 */

const DB_NAME = 'ToolTrackModelCache';
const STORE_NAME = 'weights';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve cached weight blob by key from IndexedDB
 */
export async function getWeight(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Save weight blob to IndexedDB
 */
export async function setWeight(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Quota reached or storage disabled - non-blocking for processing
  }
}

/**
 * Checks whether model weights are already stored in IndexedDB.
 * Returns true if at least one model asset is cached.
 */
export async function hasCachedWeights(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result > 0);
      countReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Returns the count and key list of cached model assets in IndexedDB
 */
export async function getCacheStats(): Promise<{ count: number; keys: string[] }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = (req.result as string[]) || [];
        resolve({ count: keys.length, keys });
      };
      req.onerror = () => resolve({ count: 0, keys: [] });
    });
  } catch {
    return { count: 0, keys: [] };
  }
}

/**
 * Clears all cached model weights
 */
export async function clearCachedWeights(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Non-blocking if storage is unavailable or disabled
  }
}
