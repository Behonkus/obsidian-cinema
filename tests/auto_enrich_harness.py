# Harness for Library background auto-enrich (runtime backfill) tests. Simulated Electron + mocked TMDB via page.route.
import json
import asyncio
import re


def base_lib(n_movies=4):
    lib = []
    for i in range(n_movies):
        tid = 101 + i
        lib.append({"id": f"m{tid}", "title": f"TEST_Movie{tid}", "file_name": f"TEST_Movie{tid}.mkv",
                    "file_path": f"D:\\Movies\\TEST_Movie{tid}.mkv", "tmdb_id": tid, "media_type": "movie",
                    "poster_path": "https://image.tmdb.org/t/p/w500/x.jpg", "year": 2000})
    lib.append({"id": "tv500", "title": "TEST_Show500", "media_type": "tv", "tmdb_id": 500,
                "file_name": "TEST_Show500 S01E01.mkv", "file_path": "D:\\TV\\Show500\\TEST_Show500 S01E01.mkv",
                "poster_path": "https://image.tmdb.org/t/p/w500/y.jpg", "year": 2010})
    lib.append({"id": "nomatch", "title": "TEST_NoMatch", "file_name": "TEST_NoMatch.mkv",
                "file_path": "D:\\Docs\\TEST_NoMatch.mkv", "poster_path": "https://image.tmdb.org/t/p/w500/z.jpg"})
    return lib


DIRS = ["D:\\Movies", "D:\\TV", "D:\\Docs"]
CATS = {"D:\\Movies": "movies", "D:\\TV": "tv", "D:\\Docs": "docs"}


def init_script(lib=None, key=True, auto=None):
    lib = lib if lib is not None else base_lib()
    extra = ""
    if key:
        extra += "localStorage.setItem('obsidian_cinema_tmdb_key','fake');"
    if auto:
        extra += "localStorage.setItem('obsidian_cinema_auto_enrich','%s');" % auto
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
    %s
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
""" % (json.dumps(json.dumps(lib)), json.dumps(json.dumps(DIRS)), json.dumps(json.dumps(CATS)), extra)


class TmdbMock:
    """Records requests + max concurrency. fail_ids -> 404."""
    def __init__(self, delay=1.0, fail_ids=()):
        self.delay = delay
        self.fail_ids = set(fail_ids)
        self.inflight = 0
        self.max_inflight = 0
        self.requests = []  # (path, t)
        self.other = []

    async def handle(self, route):
        url = route.request.url
        m = re.search(r"/3/(movie|tv)/(\d+)(\?|$)", url)
        if not m:
            self.other.append(url)
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({"results": []}),
                                headers={"Access-Control-Allow-Origin": "*"})
            return
        kind, tid = m.group(1), int(m.group(2))
        self.requests.append(f"{kind}/{tid}")
        self.inflight += 1
        self.max_inflight = max(self.max_inflight, self.inflight)
        try:
            await asyncio.sleep(self.delay)
        finally:
            self.inflight -= 1
        hdr = {"Access-Control-Allow-Origin": "*"}
        if tid in self.fail_ids:
            await route.fulfill(status=404, content_type="application/json", body='{"status_code":34}', headers=hdr)
            return
        if kind == "movie":
            body = {"id": tid, "title": f"TEST_Movie{tid}", "runtime": 100 + tid % 10, "overview": "o",
                    "vote_average": 7.0, "vote_count": 10, "release_date": "2000-01-01", "genres": [],
                    "credits": {"cast": [], "crew": [{"job": "Director", "name": "Dir", "department": "Directing"}]},
                    "release_dates": {"results": []}, "external_ids": {}}
        else:
            body = {"id": tid, "name": "TEST_Show500", "episode_run_time": [45], "first_air_date": "2010-01-01",
                    "number_of_seasons": 1, "number_of_episodes": 10, "genres": [], "created_by": [],
                    "credits": {"cast": []}, "content_ratings": {"results": []}, "external_ids": {}}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)


async def read_lib(page):
    raw = await page.evaluate("() => sessionStorage.getItem('fakeLibFile')")
    data = json.loads(raw) if raw else []
    if isinstance(data, dict):
        data = data.get("movies", data.get("items", []))
    return {m["id"]: m for m in data}
