// Minimal promise wrapper over IndexedDB. Two stores: 'kv' (profile JSON) and
// 'audio' (parent-recorded clips as Blobs).

const DB_NAME = 'readquest';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const db = {
  get<T>(store: 'kv' | 'audio', key: string): Promise<T | undefined> {
    return tx<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  set(store: 'kv' | 'audio', key: string, value: unknown): Promise<void> {
    return tx(store, 'readwrite', (s) => s.put(value, key)).then(() => undefined);
  },
  del(store: 'kv' | 'audio', key: string): Promise<void> {
    return tx(store, 'readwrite', (s) => s.delete(key)).then(() => undefined);
  },
  keys(store: 'kv' | 'audio'): Promise<string[]> {
    return tx<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys()).then((ks) => ks.map(String));
  },
  clear(store: 'kv' | 'audio'): Promise<void> {
    return tx(store, 'readwrite', (s) => s.clear()).then(() => undefined);
  },
};

/** Ask the browser to treat our storage as persistent (helps on iOS/Android). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}
