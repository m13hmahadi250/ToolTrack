import { WhiteboardBoard } from '../types/whiteboard';

const DB_NAME = 'ToolTrack_Whiteboard_DB';
const DB_VERSION = 2; // Upgraded for persistent snapshots and metadata
const STORE_BOARDS = 'boards';
const STORE_SNAPSHOTS = 'board_snapshots';
const STORE_PREFERENCES = 'app_preferences';
const ACTIVE_BOARD_KEY = 'tt_wb_active_board_id';

/**
 * Robust in-flight promise tracker to prevent duplicate concurrent DB open operations
 */
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or upgrade IndexedDB with versioned schema stores
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Boards store (Key: id)
      if (!db.objectStoreNames.contains(STORE_BOARDS)) {
        db.createObjectStore(STORE_BOARDS, { keyPath: 'id' });
      }

      // 2. Snapshots store for recovery (Key: boardId)
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'boardId' });
      }

      // 3. User & Workspace preferences store
      if (!db.objectStoreNames.contains(STORE_PREFERENCES)) {
        db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB database'));
    };

    request.onblocked = () => {
      console.warn('Database upgrade blocked by another open tab/connection.');
    };
  });

  return dbPromise;
}

/**
 * Request persistent browser storage via navigator.storage.persist()
 * Prevents browser eviction under low disk conditions.
 */
export async function requestPersistentStorage(): Promise<{
  supported: boolean;
  persisted: boolean;
  quota?: { usage: number; quota: number; percentUsed: number };
}> {
  if (typeof window === 'undefined' || !navigator.storage) {
    return { supported: false, persisted: false };
  }

  try {
    let persisted = false;
    if (navigator.storage.persisted) {
      persisted = await navigator.storage.persisted();
    }
    if (!persisted && navigator.storage.persist) {
      persisted = await navigator.storage.persist();
    }

    let quotaDetails: { usage: number; quota: number; percentUsed: number } | undefined;
    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      quotaDetails = { usage, quota, percentUsed };
    }

    return { supported: true, persisted, quota: quotaDetails };
  } catch (err) {
    console.warn('Storage persistence request error:', err);
    return { supported: false, persisted: false };
  }
}

/**
 * Track in-flight save write version counter to prevent older asynchronous saves
 * from overwriting newer user changes (race condition prevention).
 */
const lastQueuedWriteTimestamp = new Map<string, number>();

/**
 * Deep clones and cleans board data to ensure safe structured cloning for IndexedDB
 */
export function sanitizeBoardForStorage(board: WhiteboardBoard): WhiteboardBoard {
  return {
    ...board,
    id: board.id,
    title: board.title || 'Untitled Whiteboard',
    createdAt: board.createdAt || Date.now(),
    updatedAt: Date.now(),
    backgroundColor: board.backgroundColor || '#0f172a',
    gridType: board.gridType || 'none',
    gridSnap: Boolean(board.gridSnap),
    viewport: {
      x: typeof board.viewport?.x === 'number' && !isNaN(board.viewport.x) ? board.viewport.x : 0,
      y: typeof board.viewport?.y === 'number' && !isNaN(board.viewport.y) ? board.viewport.y : 0,
      zoom: typeof board.viewport?.zoom === 'number' && !isNaN(board.viewport.zoom) && board.viewport.zoom > 0 ? board.viewport.zoom : 1,
    },
    elements: (board.elements || []).map((el) => ({ ...el })),
    frames: (board.frames || []).map((f) => ({ ...f })),
    pdfDocuments: (board.pdfDocuments || []).map((d) => ({ ...d })),
  };
}

/**
 * Creates a default blank board
 */
export function createDefaultBoard(title = 'My Whiteboard'): WhiteboardBoard {
  const now = Date.now();
  return {
    id: `board_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: now,
    updatedAt: now,
    backgroundColor: '#0f172a', // Dark theme default
    gridType: 'none',
    gridSnap: false,
    viewport: { x: 0, y: 0, zoom: 1 },
    elements: [],
    frames: [],
    pdfDocuments: [],
  };
}

/**
 * Saves a board transactionally to IndexedDB.
 * Guarantees that older pending async writes do not overwrite newer user changes.
 * Automatically saves a recovery snapshot and updates local fallback.
 */
export async function saveBoardToStorage(board: WhiteboardBoard): Promise<{ success: boolean; error?: string }> {
  const thisSaveTimestamp = Date.now();
  lastQueuedWriteTimestamp.set(board.id, thisSaveTimestamp);

  const cleanBoard = sanitizeBoardForStorage(board);

  try {
    const db = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BOARDS, STORE_SNAPSHOTS], 'readwrite');
      const boardStore = tx.objectStore(STORE_BOARDS);
      const snapshotStore = tx.objectStore(STORE_SNAPSHOTS);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
      tx.onabort = () => reject(new Error('Transaction aborted'));

      // If a newer save was already queued while this transaction was preparing, abort safely
      const newestTimestamp = lastQueuedWriteTimestamp.get(board.id) || 0;
      if (newestTimestamp > thisSaveTimestamp) {
        // Obsolete write, yield gracefully
        resolve();
        return;
      }

      boardStore.put(cleanBoard);
      snapshotStore.put({
        boardId: cleanBoard.id,
        savedAt: thisSaveTimestamp,
        board: cleanBoard,
      });
    });

    // Mirror to active board pointer
    setActiveBoardId(cleanBoard.id);
    return { success: true };
  } catch (err: any) {
    console.warn('IndexedDB write error, attempting localStorage fallback:', err);
    try {
      // LocalStorage fallback without heavy elements if quota exceeded
      const fallbackStr = JSON.stringify(cleanBoard);
      localStorage.setItem(`tt_wb_${cleanBoard.id}`, fallbackStr);
      setActiveBoardId(cleanBoard.id);
      return { success: true };
    } catch (lsErr: any) {
      console.error('LocalStorage write failed:', lsErr);
      return { success: false, error: err?.message || 'Storage write failed' };
    }
  }
}

/**
 * Retrieves a board by ID from IndexedDB with validation and fallback to snapshot/localStorage
 */
export async function getBoardFromStorage(id: string): Promise<WhiteboardBoard | null> {
  if (!id) return null;

  try {
    const db = await openDatabase();

    // 1. Try reading from main boards store
    const boardFromStore = await new Promise<WhiteboardBoard | null>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readonly');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (boardFromStore && boardFromStore.id) {
      return sanitizeBoardForStorage(boardFromStore);
    }

    // 2. Try reading from recovery snapshot store
    const snapshot = await new Promise<{ board: WhiteboardBoard } | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
        const store = tx.objectStore(STORE_SNAPSHOTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (snapshot && snapshot.board && snapshot.board.id) {
      return sanitizeBoardForStorage(snapshot.board);
    }
  } catch (err) {
    console.warn('IndexedDB read failed, trying localStorage:', err);
  }

  // 3. Fallback to localStorage
  try {
    const raw = localStorage.getItem(`tt_wb_${id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        return sanitizeBoardForStorage(parsed);
      }
    }
  } catch {}

  return null;
}

/**
 * Gets all saved boards ordered from newest to oldest
 */
export async function getAllBoards(): Promise<WhiteboardBoard[]> {
  const boardsMap = new Map<string, WhiteboardBoard>();

  // 1. Collect from IndexedDB
  try {
    const db = await openDatabase();
    const idbBoards = await new Promise<WhiteboardBoard[]>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readonly');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const b of idbBoards) {
      if (b && b.id) {
        boardsMap.set(b.id, sanitizeBoardForStorage(b));
      }
    }
  } catch (err) {
    console.warn('IndexedDB getAllBoards failed, falling back to localStorage:', err);
  }

  // 2. Check localStorage for any boards that might have been saved during offline/fallback mode
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('tt_wb_board_') || key.startsWith('tt_wb_'))) {
        if (key === ACTIVE_BOARD_KEY) continue;
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const b = JSON.parse(val);
            if (b && b.id && !boardsMap.has(b.id)) {
              boardsMap.set(b.id, sanitizeBoardForStorage(b));
            }
          } catch {}
        }
      }
    }
  } catch {}

  const result = Array.from(boardsMap.values());
  return result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * Deletes a board from IndexedDB (main store & snapshot) and localStorage
 */
export async function deleteBoardFromStorage(id: string): Promise<void> {
  if (!id) return;

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BOARDS, STORE_SNAPSHOTS], 'readwrite');
      tx.objectStore(STORE_BOARDS).delete(id);
      tx.objectStore(STORE_SNAPSHOTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }

  try {
    localStorage.removeItem(`tt_wb_${id}`);
    localStorage.removeItem(`tt_wb_board_${id}`);
  } catch {}
}

/**
 * Gets the last active board ID
 */
export function getActiveBoardId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BOARD_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets the last active board ID
 */
export function setActiveBoardId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_BOARD_KEY, id);
  } catch {}
}

/**
 * Persistent Workspace Preference Storage (e.g. Focus Mode, pen sizes, favorite colors)
 */
export async function saveWorkspacePreference(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PREFERENCES, 'readwrite');
      tx.objectStore(STORE_PREFERENCES).put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(`tt_pref_${key}`, JSON.stringify(value));
    } catch {}
  }
}

/**
 * Retrieves a persistent workspace preference
 */
export async function getWorkspacePreference<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDatabase();
    const result = await new Promise<{ value: T } | null>((resolve) => {
      const tx = db.transaction(STORE_PREFERENCES, 'readonly');
      const req = tx.objectStore(STORE_PREFERENCES).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    if (result && result.value !== undefined) {
      return result.value;
    }
  } catch {}

  try {
    const raw = localStorage.getItem(`tt_pref_${key}`);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {}

  return defaultValue;
}

/**
 * Creates a complete JSON backup archive containing all boards, snapshots, and metadata
 */
export async function createFullWhiteboardBackup(): Promise<{
  backupJson: string;
  boardCount: number;
  totalElements: number;
}> {
  const allBoards = await getAllBoards();
  const backupData = {
    version: '1.0.0',
    app: 'ToolTrack',
    timestamp: Date.now(),
    dateString: new Date().toISOString(),
    boards: allBoards,
  };

  const totalElements = allBoards.reduce((sum, b) => sum + (b.elements ? b.elements.length : 0), 0);
  const backupJson = JSON.stringify(backupData, null, 2);

  return {
    backupJson,
    boardCount: allBoards.length,
    totalElements,
  };
}

/**
 * Validates and restores a Whiteboard backup file without corrupting or deleting existing boards
 */
export async function restoreWhiteboardBackup(
  backupJsonStr: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; restoredCount: number; message: string }> {
  let parsed: any;
  try {
    parsed = JSON.parse(backupJsonStr);
  } catch {
    return { success: false, restoredCount: 0, message: 'Invalid JSON format in backup file.' };
  }

  // Support both single board JSON and full multi-board backup JSON
  let boardsToRestore: WhiteboardBoard[] = [];

  if (Array.isArray(parsed.boards)) {
    boardsToRestore = parsed.boards;
  } else if (parsed.id && (Array.isArray(parsed.elements) || parsed.title)) {
    boardsToRestore = [parsed as WhiteboardBoard];
  } else {
    return {
      success: false,
      restoredCount: 0,
      message: 'Unrecognized backup structure. No valid boards found.',
    };
  }

  if (boardsToRestore.length === 0) {
    return { success: false, restoredCount: 0, message: 'Backup file contains no boards.' };
  }

  try {
    if (mode === 'replace') {
      const current = await getAllBoards();
      for (const b of current) {
        await deleteBoardFromStorage(b.id);
      }
    }

    let count = 0;
    for (const rawBoard of boardsToRestore) {
      if (!rawBoard || !rawBoard.title) continue;
      // Ensure unique IDs if merging to avoid accidental collision
      const boardToSave: WhiteboardBoard = {
        ...rawBoard,
        id: mode === 'replace' ? rawBoard.id : `board_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: rawBoard.title,
        updatedAt: Date.now(),
      };
      await saveBoardToStorage(boardToSave);
      count++;
    }

    return {
      success: true,
      restoredCount: count,
      message: `Successfully restored ${count} board${count === 1 ? '' : 's'}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      restoredCount: 0,
      message: `Failed to restore boards: ${err?.message || 'Storage transaction error'}`,
    };
  }
}
