// Browser-side layout cache (IndexedDB) used while no cloud/backend storage is enabled.
// IndexedDB is used instead of localStorage so layouts containing large images / wallpapers don't hit the ~5MB quota.

const DB_NAME = "DesktopCanvasLayoutsDB";
const DB_VERSION = 1;
const STORE = "layouts";

const openDB = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("This browser does not support local layout storage."));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "_id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Could not open layout cache."));
  });

const run = async (mode, fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
    tx.onerror = () => reject(tx.error || new Error("Layout cache error."));
  });
};

export const listLocalLayouts = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        (req.result || []).sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        )
      );
    req.onerror = () => reject(req.error);
  });
};

export const saveLocalLayout = async (payload) => {
  const now = new Date().toISOString();
  const layout = {
    ...payload,
    _id: payload.layoutId || `local-${Date.now()}`,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
  delete layout.layoutId;
  await run("readwrite", (store) => store.put(layout));
  return layout;
};

export const deleteLocalLayout = (id) =>
  run("readwrite", (store) => store.delete(id));
