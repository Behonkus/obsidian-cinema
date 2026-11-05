# Harness for "Auto-Match New Files" tests: simulated Electron (scanForVideos/openFileDialog) + TMDB search/details mock.
import json
import asyncio
import re
import zlib
from urllib.parse import urlparse, parse_qs


def old_cards():
    return [
        {"id": "old1", "title": "TEST_OldOne", "file_name": "TEST_OldOne (2001).mkv",
         "file_path": "D:\\Movies\\TEST_OldOne (2001).mkv", "year": 2001, "added_at": 1},
        {"id": "old2", "title": "TEST_OldTwo", "file_name": "TEST_OldTwo (2002).mkv",
         "file_path": "D:\\Movies\\TEST_OldTwo (2002).mkv", "year": 2002, "added_at": 1},
    ]


NEW_FILES = [
    {"id": "new_heat", "file_path": "D:\\Movies\\Heat (1995).mkv", "file_name": "Heat (1995).mkv", "title": "Heat", "year": 1995},
    {"id": "new_alien", "file_path": "D:\\Movies\\Alien.1979.1080p.mkv", "file_name": "Alien.1979.1080p.mkv", "title": "Alien 1080p", "year": 1979},
]


def init_script(lib=None, key=True, auto=None, scan=None, dialog_paths=None, dirs=("D:\\Movies",)):
    lib = lib if lib is not None else old_cards()
    if scan is None:
        scan = [{"id": m["id"], "file_path": m["file_path"], "file_name": m["file_name"], "title": m["title"], "year": m.get("year")} for m in lib] + NEW_FILES
    dialog_paths = dialog_paths or []
    extra = ""
    if key:
        extra += "localStorage.setItem('obsidian_cinema_tmdb_key','fake');"
    if auto:
        extra += "localStorage.setItem('obsidian_cinema_auto_enrich','%s');" % auto
    cats = {d: "movies" for d in dirs}
    return """
(() => {
  if (!sessionStorage.getItem('seeded')) {
    sessionStorage.setItem('seeded','1');
    sessionStorage.setItem('fakeLibFile', %s);
    localStorage.setItem('obsidian_cinema_local_dirs', %s);
    localStorage.setItem('obsidian_cinema_dir_categories', %s);
    localStorage.setItem('obsidian_cinema_collections', '[]');
    localStorage.setItem('obsidian_cinema_eula_accepted', '1.6.8');
    localStorage.setItem('obsidian_cinema_skip_poster_tip', 'true');
    localStorage.setItem('obsidian_cinema_skip_naming_tip', 'true');
    %s
  }
  const SCAN = %s;
  const DIALOG = %s;
  const os = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k,v){ if ((k==='obsidian_cinema_local_dirs'||k==='obsidian_cinema_collections') && v==='[]') return; return os.call(this,k,v); };
  window.__scanCalls = 0;
  const impl = {
    isElectron: () => true,
    libraryReadSync: () => sessionStorage.getItem('fakeLibFile'),
    libraryWriteSync: (v) => { sessionStorage.setItem('fakeLibFile', v); return true; },
    libraryWrite: (v) => { sessionStorage.setItem('fakeLibFile', v); return Promise.resolve(true); },
    getLicense: () => Promise.resolve({subscription_tier: 'free', activated_at: '2026-01-01T00:00:00Z'}),
    getDrives: () => Promise.resolve([]),
    getMachineId: () => Promise.resolve('test-machine'),
    openPath: () => Promise.resolve(''),
    scanForVideos: (dir) => { window.__scanCalls++; return Promise.resolve(SCAN.filter(f => f.file_path.startsWith(dir))); },
    openFileDialog: () => Promise.resolve({canceled: false, filePaths: DIALOG}),
  };
  window.electronAPI = new Proxy(impl, { get(t,k){ if (k in t) return t[k]; if (typeof k==='symbol') return undefined; return () => Promise.resolve(null); } });
})();
""" % (json.dumps(json.dumps(lib)), json.dumps(json.dumps(list(dirs))), json.dumps(json.dumps(cats)), extra,
       json.dumps(scan), json.dumps(dialog_paths))


class TmdbSearchMock:
    """Every search returns one exact-title candidate; details echo it. Records searches + detail calls."""
    def __init__(self, delay=0.3):
        self.delay = delay
        self.searches = []  # query strings
        self.details = []   # "movie/ID"
        self.other = []
        self.titles = {}

    async def handle(self, route):
        url = route.request.url
        hdr = {"Access-Control-Allow-Origin": "*"}
        p = urlparse(url)
        qs = parse_qs(p.query)
        await asyncio.sleep(self.delay)
        if "/search/movie" in p.path:
            q = qs.get("query", [""])[0]
            self.searches.append(q)
            year = qs.get("primary_release_year", [None])[0]
            tid = zlib.crc32(q.encode()) % 900000 + 1000
            self.titles[tid] = (q, year)
            res = [{"id": tid, "title": q, "original_title": q, "release_date": f"{year or 2000}-01-01",
                    "popularity": 50, "vote_count": 5000, "poster_path": f"/p{tid}.jpg"}]
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({"results": res}), headers=hdr)
            return
        m = re.search(r"/3/(movie|tv)/(\d+)$", p.path)
        if m:
            tid = int(m.group(2))
            self.details.append(f"{m.group(1)}/{tid}")
            t, y = self.titles.get(tid, (f"TEST_{tid}", None))
            body = {"id": tid, "title": t, "poster_path": f"/p{tid}.jpg", "runtime": 110, "overview": "o",
                    "vote_average": 7.5, "vote_count": 5000, "release_date": f"{y or 2000}-01-01", "genres": [],
                    "credits": {"cast": [], "crew": []}, "release_dates": {"results": []}, "external_ids": {}}
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)
            return
        self.other.append(url)
        await route.fulfill(status=200, content_type="application/json", body=json.dumps({"results": []}), headers=hdr)


async def read_lib(page):
    raw = await page.evaluate("() => sessionStorage.getItem('fakeLibFile')")
    data = json.loads(raw) if raw else []
    if isinstance(data, dict):
        data = data.get("movies", data.get("items", []))
    return {m["id"]: m for m in data}


async def toasts(page):
    return await page.evaluate("() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(e => e.textContent)")
