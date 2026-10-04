import { WhiteboardBoard } from '../types/whiteboard';

const DB_NAME = 'ToolTrack_Whiteboard_DB';
const DB_VERSION = 1;
const STORE_BOARDS = 'boards';
const ACTIVE_BOARD_KEY = 'tt_wb_active_board_id';

/**
 * Opens or initializes the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_BOARDS)) {
        db.createObjectStore(STORE_BOARDS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Creates a default blank board
 */
export function createDefaultBoard(title = 'Untitled Whiteboard'): WhiteboardBoard {
  const now = Date.now();
  return {
    id: `board_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: now,
    updatedAt: now,
    backgroundColor: '#0f172a', // Matches ToolTrack dark theme
    gridType: 'none', // Grid OFF by default
    gridSnap: false,
    viewport: { x: 0, y: 0, zoom: 1 },
    elements: [],
    frames: [],
  };
}

/**
 * Saves a board to IndexedDB (with localStorage backup)
 */
export async function saveBoardToStorage(board: WhiteboardBoard): Promise<void> {
  const updatedBoard: WhiteboardBoard = {
    ...board,
    updatedAt: Date.now(),
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readwrite');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.put(updatedBoard);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage:', err);
    try {
      localStorage.setItem(`tt_wb_${board.id}`, JSON.stringify(updatedBoard));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  // Set as last active board
  setActiveBoardId(board.id);
}

/**
 * Retrieves a board by ID from IndexedDB
 */
export async function getBoardFromStorage(id: string): Promise<WhiteboardBoard | null> {
  try {
    const db = await openDatabase();
    return await new Promise<WhiteboardBoard | null>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readonly');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, trying localStorage:', err);
    try {
      const raw = localStorage.getItem(`tt_wb_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Gets all saved boards metadata
 */
export async function getAllBoards(): Promise<WhiteboardBoard[]> {
  try {
    const db = await openDatabase();
    const boards = await new Promise<WhiteboardBoard[]>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readonly');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (boards.length > 0) {
      return boards.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (err) {
    console.warn('IndexedDB getAll failed, falling back:', err);
  }

  // Fallback to localStorage keys
  const fallbackBoards: WhiteboardBoard[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tt_wb_board_')) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            fallbackBoards.push(JSON.parse(val));
          } catch {}
        }
      }
    }
  } catch {}

  return fallbackBoards.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Deletes a board from IndexedDB and localStorage
 */
export async function deleteBoardFromStorage(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOARDS, 'readwrite');
      const store = tx.objectStore(STORE_BOARDS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }

  try {
    localStorage.removeItem(`tt_wb_${id}`);
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
