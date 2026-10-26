// IndexedDB + localStorage persistence for auto-saving the latest design
// Prevents losing changes on accidental tab close or reload, and supports up to 20MB live wallpapers & high-res images

const DB_NAME = "DesktopCanvasAutoSaveDB";
const DB_VERSION = 1;
const STORE_NAME = "designState";
const STATE_KEY = "latestDesign";

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return resolve(null);
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

export const saveDesignState = async (state) => {
  try {
    const payload = {
      ...state,
      updatedAt: Date.now(),
    };

    // Save lightweight metadata in localStorage for instant synchronous fallback on beforeunload
    try {
      const lightSections = (state.sections || []).map((s) => ({
        ...s,
        // Keep imageUrl in localStorage only if it's small enough (< 250KB)
        imageUrl:
          s.imageUrl && s.imageUrl.length > 250000 ? "__IDB_IMAGE__" : s.imageUrl,
      }));
      localStorage.setItem(
        "desktop_canvas_autosave_meta",
        JSON.stringify({
          stageSize: state.stageSize,
          gridConfig: state.gridConfig,
          sections: lightSections,
          wallpaperMeta: state.wallpaper
            ? {
                type: state.wallpaper.type,
                title: state.wallpaper.title,
                templateId: state.wallpaper.templateId,
                url:
                  state.wallpaper.url && state.wallpaper.url.length < 300000
                    ? state.wallpaper.url
                    : null,
              }
            : null,
          updatedAt: payload.updatedAt,
        })
      );
    } catch (e) {
      // Ignore localStorage quota errors; IndexedDB handles full payload
    }

    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(payload, STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
};

export const loadDesignState = async () => {
  try {
    const db = await openDB();
    if (db) {
      const idbResult = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(STATE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (idbResult) {
        return idbResult;
      }
    }

    const metaRaw = localStorage.getItem("desktop_canvas_autosave_meta");
    if (metaRaw) {
      const parsed = JSON.parse(metaRaw);
      return {
        stageSize: parsed.stageSize,
        gridConfig: parsed.gridConfig,
        sections: (parsed.sections || []).map((s) => ({
          ...s,
          imageUrl: s.imageUrl === "__IDB_IMAGE__" ? null : s.imageUrl,
        })),
        wallpaper: parsed.wallpaperMeta,
        updatedAt: parsed.updatedAt,
      };
    }

    return null;
  } catch (err) {
    return null;
  }
};
