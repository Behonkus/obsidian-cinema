// Desktop only: redirect the movie library key from localStorage (size-limited) to a file on disk.
// All existing localStorage.getItem/setItem calls for this key keep working unchanged.
import { toast } from "sonner";
const LIBRARY_KEY = 'obsidian_cinema_local_movies';

function installLibraryStore() {
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (!api || typeof api.libraryReadSync !== 'function') return;

  const proto = Storage.prototype;
  const origGet = proto.getItem;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;

  let cache = api.libraryReadSync();
  const legacy = origGet.call(window.localStorage, LIBRARY_KEY);

  if (cache == null && legacy != null) {
    // One-time migration; keep the old copy if the file write fails
    if (!api.libraryWriteSync(legacy)) return;
    cache = legacy;
  }
  if (legacy != null) origRemove.call(window.localStorage, LIBRARY_KEY);

  proto.getItem = function (key) {
    if (this === window.localStorage && key === LIBRARY_KEY) return cache;
    return origGet.call(this, key);
  };
  proto.setItem = function (key, value) {
    if (this === window.localStorage && key === LIBRARY_KEY) {
      cache = String(value);
      api.libraryWrite(cache).then(function (ok) {
        if (!ok) toast.error('Could not save your library to disk — please check free disk space');
      });
      return;
    }
    return origSet.call(this, key, value);
  };
  proto.removeItem = function (key) {
    if (this === window.localStorage && key === LIBRARY_KEY) {
      cache = null;
      api.libraryWrite('[]');
      return;
    }
    return origRemove.call(this, key);
  };

  // Synchronous save used when the window is closing
  window.__ocSaveLibrarySync = function (value) {
    cache = String(value);
    api.libraryWriteSync(cache);
  };
}

installLibraryStore();

// Parsed library shared across pages: parse only when the stored text actually changed
let parsedRaw = null;
let parsedList = [];
export function readLibrary() {
  const raw = window.localStorage.getItem(LIBRARY_KEY);
  if (raw === parsedRaw) return parsedList;
  try { parsedList = raw ? JSON.parse(raw) : []; } catch { parsedList = []; }
  parsedRaw = raw;
  return parsedList;
}
// The library page hands over the array it just saved, so nobody has to re-parse it
export function publishLibrary(list, raw) {
  parsedList = list;
  parsedRaw = raw;
}
