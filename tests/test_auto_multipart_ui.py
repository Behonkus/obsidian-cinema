# Auto multi-part check scenarios (run via browser_automation: exec this file's body with `page` available)
import sys, json, asyncio
sys.path.insert(0, '/app/tests')
import importlib
import auto_match_harness as H
import multipart_extras_harness as X
importlib.reload(H); importlib.reload(X)
URL = "https://obsidian-preview.preview.emergentagent.com/#/"


def batman_lib(overview=None):
    c = X.card("bat", "Season 1\\Batman.S01E01.mkv", title="Batman", media_type="tv", tmdb_id=5, poster_path="/bat.jpg", year=1966)
    if overview:
        c["overview"] = overview
    c["parts"] = [
        {"file_path": X.TV + "Season 1\\Batman.S01E01.mkv", "file_name": "Batman.S01E01.mkv", "episode": {"season": 1, "number": 1, "name": "Old Ep1"}},
        {"file_path": X.TV + "Season 1\\Batman.S01E02.mkv", "file_name": "Batman.S01E02.mkv", "episode": {"season": 1, "number": 2, "name": "Old Ep2"}},
    ]
    other = {"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "D:\\Movies\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}
    return [c, other]


NEW = [
    {"id": "n1", "file_path": X.TV + "Season 2\\Batman.S02E01.mkv", "file_name": "Batman.S02E01.mkv", "title": "Batman"},
    {"id": "n2", "file_path": X.TV + "Extras\\Bloopers.mkv", "file_name": "Bloopers.mkv", "title": "Bloopers"},
]
UNRELATED = [{"id": "n3", "file_path": "D:\\Movies\\Alien (1979).mkv", "file_name": "Alien (1979).mkv", "title": "Alien", "year": 1979}]


def base_scan(lib):
    out = []
    for m in lib:
        for pp in (m.get("parts") or [m]):
            out.append({"id": "x" + str(len(out)), "file_path": pp["file_path"], "file_name": pp["file_name"], "title": m["title"]})
    return out


async def open_ctx(lib, scan, auto="off", delay=0.2):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = X.TmdbMock(delay=delay)
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    await ctx.add_init_script(H.init_script(lib=lib, key=True, auto=auto, scan=scan, dirs=("D:\\TV", "D:\\Movies")))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL)
    await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
    await p.wait_for_timeout(1000)
    return ctx, p, mock, errs


def summarize(L):
    return {k: (m.get("title"), m.get("tmdb_id"), m.get("media_type"), m.get("poster_path"), len(m.get("parts") or [])) for k, m in L.items()}
