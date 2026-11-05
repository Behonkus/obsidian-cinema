# Harness for Stats page TypeStats tests (simulated Electron). Used via browser_automation with sys.path.insert(0,'/app/tests').
import json

def ep(n, rt, last=None):
    return {"season": 1, "number": n, "last_number": last, "runtime": rt}

LIB = [
    {"id": "m1", "title": "Movie120", "file_name": "a.mkv", "file_path": "D:\\Movies\\a.mkv", "runtime": 120},
    {"id": "m2", "title": "MovieNoRt", "file_name": "b.mkv", "file_path": "D:\\Movies\\b.mkv"},
    {"id": "out1", "title": "Outside", "file_name": "x.mkv", "file_path": "E:\\Other\\x.mkv", "runtime": 100},
    {"id": "tvs1", "title": "TVShowsLeak", "media_type": "tv", "file_name": "c S01E01.mkv", "file_path": "D:\\TVShows\\C\\c S01E01.mkv"},
    {"id": "tv1", "title": "ShowEps", "media_type": "tv", "file_name": "s S01E01.mkv", "file_path": "D:\\TV\\S\\s S01E01.mkv",
     "parts": [
         {"file_name": "s S01E01.mkv", "file_path": "D:\\TV\\S\\s S01E01.mkv", "episode": ep(1, 50)},
         {"file_name": "s S01E02.mkv", "file_path": "D:\\TV\\S\\s S01E02.mkv", "episode": ep(2, 50)},
         {"file_name": "s S01E03-E04.mkv", "file_path": "D:\\TV\\S\\s S01E03-E04.mkv", "episode": ep(3, 90, 4)},
     ]},
    {"id": "tv2", "title": "ShowRt30", "media_type": "tv", "runtime": 30, "file_name": "t S01E01.mkv", "file_path": "D:\\TV\\T\\t S01E01.mkv",
     "parts": [{"file_name": f"t S01E0{i}.mkv", "file_path": f"D:\\TV\\T\\t S01E0{i}.mkv"} for i in (1, 2, 3, 4)]},
    {"id": "tv3", "title": "ShowSingle", "media_type": "tv", "file_name": "u S01E01.mkv", "file_path": "D:\\TV\\U\\u S01E01.mkv"},
    {"id": "d1", "title": "LongDoc", "file_name": "d.mkv", "file_path": "D:\\Docs\\d.mkv", "runtime": 1500},
    {"id": "a1", "title": "BigAnim", "file_name": "e.mkv", "file_path": "D:\\Anime\\e.mkv", "runtime": 6000},
    {"id": "a2", "title": "AnimParts", "file_name": "f CD1.mkv", "file_path": "D:\\Anime\\F\\f CD1.mkv",
     "parts": [{"file_name": "f CD1.mkv", "file_path": "D:\\Anime\\F\\f CD1.mkv"}, {"file_name": "f CD2.mkv", "file_path": "D:\\Anime\\F\\f CD2.mkv"}]},
]
DIRS = ["D:\\Movies", "D:\\TV", "D:\\TVShows", "D:\\Docs", "D:\\Anime"]
CATS = {"D:\\Movies": "movies", "D:\\TV": "tv", "D:\\TVShows": "movies", "D:\\Docs": "docs", "D:\\Anime": "anim"}

# Hand-computed expectations
# movies: m1 120k, m2 88e, out1 100k, tvs1 45e -> 353 min, known 220 (62%), 4 files, 1 episode -> ≈5.9 h
# tv: tv1 190k (4 eps), tv2 120k (0 eps - no episode objects), tv3 45e (1 ep) -> 355 min, known 310 (87%), 8 files, 5 eps -> ≈5.9 h
# docs: 1500k -> 25.0 h, 1.0 days, 100%
# anim: 6000k + 2x88e = 6176, known 6000 (97%) -> ≈103 h, 4.3 days, 3 files
EXPECTED = {
    "movies": {"titles": "4", "hours": "≈5.9", "sub": "4 files · 1 episodes · 62% real runtimes"},
    "tv": {"titles": "3", "hours": "≈5.9", "sub": "8 files · 5 episodes · 87% real runtimes"},
    "docs": {"titles": "1", "hours": "25.0", "sub": "1 file · 100% real runtimes"},
    "anim": {"titles": "2", "hours": "≈103", "sub": "3 files · 97% real runtimes"},
}


def init_script():
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
  const impl = {
    isElectron: () => true,
    libraryReadSync: () => sessionStorage.getItem('fakeLibFile'),
    libraryWriteSync: (v) => { sessionStorage.setItem('fakeLibFile', v); return true; },
    libraryWrite: (v) => { sessionStorage.setItem('fakeLibFile', v); return Promise.resolve(true); },
    getLicense: () => Promise.resolve({subscription_tier: 'free', activated_at: '2026-01-01T00:00:00Z'}),
    getDrives: () => Promise.resolve([]),
    getMachineId: () => Promise.resolve('test-machine'),
    openPath: () => Promise.resolve(''),
  };
  window.electronAPI = new Proxy(impl, { get(t,k){ if (k in t) return t[k]; if (typeof k==='symbol') return undefined; return () => Promise.resolve(null); } });
})();
""" % (json.dumps(json.dumps(LIB)), json.dumps(json.dumps(DIRS)), json.dumps(json.dumps(CATS)))
