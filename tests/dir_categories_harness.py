# Harness snippet for Obsidian Cinema directory-category UI tests (simulated Electron). Used via browser_automation.
import json

LIB = [
    {"id": "m1", "title": "Inception", "file_name": "Inception (2010).mkv", "file_path": "D:\\Movies\\Inception (2010).mkv", "year": 2010},
    {"id": "tv1", "title": "Show A", "media_type": "tv", "file_name": "Show A S01E01.mkv", "file_path": "D:\\TV\\Show A\\Show A S01E01.mkv"},
    {"id": "tv2", "title": "Show B", "media_type": "tv", "file_name": "Show B S01E01.mkv", "file_path": "D:\\TV\\Show B\\Show B S01E01.mkv"},
    {"id": "tvs1", "title": "Show C", "media_type": "tv", "file_name": "Show C S01E01.mkv", "file_path": "D:\\TVShows\\Show C\\Show C S01E01.mkv"},
    {"id": "doc1", "title": "Cosmos", "file_name": "Cosmos.mkv", "file_path": "D:\\Docs\\Cosmos.mkv"},
    {"id": "pe", "title": "Planet Earth", "file_name": "Planet Earth S01E01.mkv",
     "file_path": "D:\\Docs\\Planet Earth\\Season 1\\Planet Earth S01E01.mkv",
     "parts": [{"file_name": f"Planet Earth S01E0{i}.mkv", "file_path": f"D:\\Docs\\Planet Earth\\Season 1\\Planet Earth S01E0{i}.mkv"} for i in (1, 2, 3)]},
]
DIRS = ["D:\\Movies", "D:\\TV", "D:\\TVShows", "D:\\Docs"]


def init_script(cats):
    return """
(() => {
  if (!sessionStorage.getItem('seeded')) {
    sessionStorage.setItem('seeded','1');
    sessionStorage.setItem('fakeLibFile', %s);
    localStorage.setItem('obsidian_cinema_local_dirs', %s);
    localStorage.setItem('obsidian_cinema_dir_categories', %s);
    localStorage.setItem('obsidian_cinema_collections', '[]');
    localStorage.setItem('obsidian_cinema_eula_accepted', '1.6.8');
  }
  const os = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k,v){ if ((k==='obsidian_cinema_local_dirs'||k==='obsidian_cinema_collections') && v==='[]') return; return os.call(this,k,v); };
  window.__opened = [];
  const impl = {
    isElectron: () => true,
    libraryReadSync: () => sessionStorage.getItem('fakeLibFile'),
    libraryWriteSync: (v) => { sessionStorage.setItem('fakeLibFile', v); return true; },
    libraryWrite: (v) => { sessionStorage.setItem('fakeLibFile', v); return Promise.resolve(true); },
    getLicense: () => Promise.resolve({subscription_tier: 'free', activated_at: '2026-01-01T00:00:00Z'}),
    getDrives: () => Promise.resolve([]),
    getMachineId: () => Promise.resolve('test-machine'),
    openPath: (p) => { window.__opened.push(p); return Promise.resolve(''); },
  };
  window.electronAPI = new Proxy(impl, { get(t,k){ if (k in t) return t[k]; if (typeof k==='symbol') return undefined; return () => Promise.resolve(null); } });
})();
""" % (json.dumps(json.dumps(LIB)), json.dumps(json.dumps(DIRS)), json.dumps(json.dumps(cats)))
