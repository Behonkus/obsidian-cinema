# Iteration 44: TV Shows quick filter removed, Recently Added newest-first, Fix missing info (TMDB -> Wikidata -> local), year-mismatch rename, background gap fill
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter44_fix_missing.py').read(), g); await g['run_sidebar_recent'](); await g['run_fix_manual'](); await g['run_fix_nokey'](); await g['run_background']()
import sys, json, re, asyncio
from urllib.parse import urlparse, parse_qs
sys.path.insert(0, '/app/tests')
import importlib
import auto_match_harness as H
importlib.reload(H)
URL = "https://obsidian-preview.preview.emergentagent.com/#/"


def chk(label, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


def mk(id_, title, fname, folder="D:\\Movies", **kw):
    d = {"id": id_, "title": title, "file_name": fname, "file_path": folder + "\\" + fname, "media_type": "movie",
         "poster_path": "https://image.tmdb.org/t/p/w500/x.jpg", "metadata_updated_at": 1, "added_at": 1000,
         "cast": [{"name": "A", "character": "B"}], "directors": [{"name": "D"}], "director": "D", "aka": []}
    d.update(kw)
    return d


def fix_lib():
    return [
        mk("heat", "Heat", "Heat (1996).mkv", tmdb_id=949, year=None, rating=0, genres=[]),
        mk("matrix", "TEST_Matrix", "TEST_Matrix (1999).mkv", tmdb_id=603, year=1999, rating=0, genres=["Action"]),
        mk("sf", "TEST_SF", "TEST_SF.mkv", tmdb_id=700, year=2001, rating=0, genres=[]),
        mk("imdb", "TEST_Imdb", "TEST_Imdb.mkv", tmdb_id=704, imdb_id="tt0000004", year=2004, rating=0, genres=["Horror"]),
        mk("rt", "TEST_RT", "TEST_RT.mkv", tmdb_id=710, year=2010, rating=0, genres=["Drama"]),
        mk("tv", "TEST_Show", "TEST_Show S01E01.mkv", folder="D:\\Movies\\TEST_Show", tmdb_id=500, media_type="tv", year=2008, rating=0, genres=["Drama"]),
        mk("second", "TEST_Second", "TEST_Second (2003).mkv", tmdb_id=720, year=2003, rating=0, genres=["Comedy"]),
        mk("parts", "TEST_Parts", "TEST_Parts (2008) CD1.mkv", tmdb_id=730, year=None, rating=0, genres=["War"],
           parts=[{"file_path": "D:\\Movies\\TEST_Parts (2008) CD1.mkv", "file_name": "TEST_Parts (2008) CD1.mkv"},
                  {"file_path": "D:\\Movies\\TEST_Parts (2008) CD2.mkv", "file_name": "TEST_Parts (2008) CD2.mkv"}]),
        mk("match", "TEST_Matchable", "TEST_Matchable (2012).mkv", tmdb_id=None, year=None, rating=None, genres=[], poster_path=None, metadata_updated_at=None),
        mk("wiki", "TEST Unmatched Wiki", "TEST Unmatched Wiki (2010).mkv", tmdb_id=None, year=None, rating=None, genres=[], poster_path=None),
        mk("far", "TEST Far Year", "TEST Far Year (2015).mkv", tmdb_id=None, year=None, rating=None, genres=[], poster_path=None),
        mk("cartoon", "TEST_Cartoon", "TEST_Cartoon.mkv", folder="D:\\Anim\\TEST_Cartoon (2005)", tmdb_id=None, year=None, rating=None, genres=[], poster_path=None),
        mk("doc", "TEST_Doc", "TEST_Doc 2011.mkv", folder="D:\\Docs", tmdb_id=None, year=None, rating=None, genres=[], poster_path=None),
        mk("full", "TEST_Full", "TEST_Full (2000).mkv", tmdb_id=900, year=2000, rating=7.1, genres=["Drama"]),
    ]


TMDB = {  # id: (vote_average, release_date, genres)
    949: (8.2, "1995-12-15", ["Crime", "Drama"]), 603: (0, "1999-03-31", ["Drama"]), 700: (6.5, "2001-05-01", []),
    704: (0, "2004-01-01", []), 710: (0, "2010-01-01", []), 720: (5.5, "2002-06-01", ["Horror"]), 730: (6.0, "2007-01-01", ["War"]),
    800: (7.7, "2012-04-01", ["Comedy"]), 900: (7.1, "2000-01-01", ["Drama"]),
}


class TmdbMock:
    def __init__(self, delay=0.2):
        self.delay = delay
        self.details = []
        self.searches = []

    async def handle(self, route):
        url = route.request.url
        hdr = {"Access-Control-Allow-Origin": "*"}
        p = urlparse(url)
        qs = parse_qs(p.query)
        await asyncio.sleep(self.delay)
        if "/search/" in p.path:
            q = qs.get("query", [""])[0]
            self.searches.append(p.path.split("/")[-1] + ":" + q)
            res = []
            if "Matchable" in q:
                res = [{"id": 800, "title": "TEST_Matchable", "name": "TEST_Matchable", "original_title": "TEST_Matchable", "release_date": "2012-04-01",
                        "media_type": "movie", "popularity": 80, "vote_count": 9000, "poster_path": "/m.jpg"}]
            return await route.fulfill(status=200, content_type="application/json", body=json.dumps({"results": res, "total_results": len(res)}), headers=hdr)
        m = re.search(r"/3/(movie|tv)/(\d+)$", p.path)
        if m:
            kind, tid = m.group(1), int(m.group(2))
            self.details.append(f"{kind}/{tid}")
            if kind == "tv":
                body = {"id": tid, "name": "TEST_Show", "vote_average": 0, "first_air_date": "2008-01-20", "genres": [{"id": 18, "name": "Drama"}],
                        "credits": {"cast": []}, "content_ratings": {"results": []}, "external_ids": {}, "seasons": []}
            else:
                va, rd, gs = TMDB.get(tid, (0, None, []))
                body = {"id": tid, "title": "T%d" % tid, "vote_average": va, "vote_count": 100, "release_date": rd, "genres": [{"id": i, "name": g} for i, g in enumerate(gs)],
                        "poster_path": "/p.jpg", "runtime": 100, "credits": {"cast": [], "crew": []}, "release_dates": {"results": []}, "external_ids": {}}
            return await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)
        await route.fulfill(status=200, content_type="application/json", body='{"results":[]}', headers=hdr)


def row(idv, pub=None, genre=None, score=None, by=None):
    r = {"id": {"type": "literal", "value": idv}}
    if pub: r["pub"] = {"value": pub}
    if genre: r["genreLabel"] = {"value": genre}
    if score: r["score"] = {"value": score}
    if by: r["byLabel"] = {"value": by}
    return r


WD = {
    "P4947": {
        "603": [row("603", "1999-03-31T00:00:00Z", "action film", "73/100", "Metacritic"), row("603", "1999-03-31T00:00:00Z", "science fiction film", "8.7/10", "IMDb"),
                row("603", "1999-06-11T00:00:00Z", "science fiction film", "83%", "Rotten Tomatoes")],
        "700": [row("700", "2001-05-01T00:00:00Z", "science fiction film"), row("700", "2001-05-01T00:00:00Z", "action thriller")],
        "710": [row("710", "2010-01-01T00:00:00Z", "drama film", "91%", "Rotten Tomatoes")],
        "704": [row("704", "2004-01-01T00:00:00Z", None, "5.0/10", "IMDb")],  # IMDb id lookup must win (tt0000004)
    },
    "P345": {"tt0000004": [row("tt0000004", "2004-01-01T00:00:00Z", "horror film", "83%", "Rotten Tomatoes"), row("tt0000004", None, None, "73/100", "Metacritic")]},
    "P4983": {"500": [row("500", "2008-01-20T00:00:00Z", "drama television series", "8.0/10", "IMDb")]},
    "item": {
        "Q11": [dict(row("http://www.wikidata.org/entity/Q11", "2010-05-01T00:00:00Z", "comedy-drama", "6.4/10", "IMDb"), label={"value": "TEST Unmatched Wiki"})],
        "Q12": [row("http://www.wikidata.org/entity/Q12", "2010-01-01T00:00:00Z", "rock music", "9/10", "IMDb")],
        "Q21": [row("http://www.wikidata.org/entity/Q21", "2001-01-01T00:00:00Z", "horror film", "7.0/10", "IMDb")],
    },
}
SEARCH = {
    "TEST Unmatched Wiki": [{"id": "Q12", "description": "album by band"}, {"id": "Q11", "description": "2010 film by Someone"}],
    "TEST Far Year": [{"id": "Q21", "description": "2001 film"}],
}


class WdMock:
    def __init__(self):
        self.sparql = []  # (prop, n_values)
        self.searches = []

    async def handle_sparql(self, route):
        hdr = {"Access-Control-Allow-Origin": "*"}
        q = parse_qs(urlparse(route.request.url).query).get("query", [""])[0]
        vm = re.search(r"VALUES \?(id|item) \{([^}]*)\}", q)
        vals = re.findall(r'"([^"]+)"|wd:(Q\d+)', vm.group(2)) if vm else []
        vals = [a or b for a, b in vals]
        pm = re.search(r"wdt:(P345|P4947|P4983) \?id", q)
        prop = pm.group(1) if pm else "item"
        self.sparql.append((prop, len(vals)))
        rows = []
        for v in vals:
            rows += WD.get(prop, {}).get(v, [])
        await route.fulfill(status=200, content_type="application/sparql-results+json", body=json.dumps({"results": {"bindings": rows}}), headers=hdr)

    async def handle_api(self, route):
        hdr = {"Access-Control-Allow-Origin": "*"}
        qs = parse_qs(urlparse(route.request.url).query)
        s = qs.get("search", qs.get("srsearch", [""]))[0]
        self.searches.append(s)
        key = next((k for k in SEARCH if s.startswith(k)), None)
        hits = [h for h in SEARCH.get(key, []) if "film" in h["description"]] if "Q11424" in s else (SEARCH.get(key, []) if "srsearch" not in qs else [])  # haswbstatement:P31=film filters non-films
        await route.fulfill(status=200, content_type="application/json", body=json.dumps({"search": hits, "query": {"search": [{"title": h["id"]} for h in hits]}}), headers=hdr)


RENAME_JS = """
(() => {
  window.__renames = [];
  window.__ipc = [];
  const base = window.electronAPI;
  const FAIL = %s;
  window.electronAPI = new Proxy({}, { get(t, k) {
    if (k === 'renameFile') return (oldPath, newName) => { window.__renames.push([oldPath, newName]);
      if (FAIL.some(f => oldPath.includes(f))) return Promise.resolve({ success: false, error: 'A file with that name already exists' });
      return Promise.resolve({ success: true, newPath: oldPath.replace(/[^\\\\/]+$/, newName) }); };
    const v = base[k];
    if (typeof v === 'function') return (...a) => { window.__ipc.push(String(k)); return v(...a); };
    return v;
  } });
  if (!sessionStorage.getItem('seeded44')) {
    sessionStorage.setItem('seeded44', '1');
    localStorage.setItem('obsidian_cinema_local_dirs', JSON.stringify(['D:\\\\Movies', 'D:\\\\Anim', 'D:\\\\Docs']));
    localStorage.setItem('obsidian_cinema_dir_categories', JSON.stringify({'D:\\\\Movies': 'movies', 'D:\\\\Anim': 'anim', 'D:\\\\Docs': 'docs'}));
    %s
  }
})();
"""


async def open_ctx(lib, key=True, auto="off", fail=(), extra="", url=URL, tmdb_delay=0.2):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    tm, wd = TmdbMock(tmdb_delay), WdMock()
    await ctx.route("**/api.themoviedb.org/**", tm.handle)
    await ctx.route("**/query.wikidata.org/**", wd.handle_sparql)
    await ctx.route("**/www.wikidata.org/w/api.php**", wd.handle_api)
    scan = [{k: m.get(k) for k in ('id', 'file_path', 'file_name', 'title', 'year')} for m in lib if m.get('file_path')]
    await ctx.add_init_script(H.init_script(lib=lib, key=key, auto=auto, scan=scan, dirs=("D:\\Movies",)))
    await ctx.add_init_script(RENAME_JS % (json.dumps(list(fail)), extra))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(url)
    await p.wait_for_timeout(2500)
    return ctx, p, tm, wd, errs


async def saved(p):
    return await p.evaluate("() => { const s = sessionStorage.getItem('fakeLibFile'); const L = JSON.parse(s); return Object.fromEntries((Array.isArray(L) ? L : (L.movies || [])).map(m => [m.id, m])); }")


async def titles(p):
    return await p.evaluate("() => Array.from(document.querySelectorAll('h3.font-medium.truncate')).map(e => e.innerText)")


async def toasts(p):
    return await p.evaluate("() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(e => e.innerText.replace(/\\n/g, ' '))")


async def btn_text(p, tid):
    loc = p.locator(f'[data-testid="{tid}"]')
    return (await loc.inner_text()).strip() if await loc.count() else None


# ---- Sidebar + Recently Added ----
async def run_sidebar_recent():
    lib = [mk(f"r{i}", f"TEST_R{i:03d}", f"TEST_R{i:03d}.mkv", tmdb_id=1000 + i, year=1990 + (i % 30), rating=5 + (i % 5), genres=["Drama"], added_at=10000 + i * 1000) for i in range(110)]
    lib.append(mk("noadd", "TEST_NoAdded", "TEST_NoAdded.mkv", tmdb_id=2000, year=2000, rating=6, genres=["Drama"], added_at=None))
    extra = "localStorage.setItem('obsidian_cinema_sort','title-asc');"
    ctx, p, tm, wd, errs = await open_ctx(lib, key=False, extra=extra)
    try:
        qfs = await p.evaluate("() => Array.from(document.querySelectorAll('[data-testid^=qf-]')).map(e => e.getAttribute('data-testid') + '=' + e.innerText.replace(/\\n/g,' '))")
        print("expanded quick filters:", qfs)
        chk("no TV Shows quick filter (expanded)", not any("tv" in q.lower() for q in qfs), qfs)  # "TV Shows" folder-type chip in toolbar is expected
        exp = ["qf-favorites", "qf-no-poster", "qf-no-rating", "qf-no-year", "qf-no-genre", "qf-recent"]
        chk("other quick filters intact", [q.split("=")[0] for q in qfs] == exp, qfs)
        await p.locator('[data-testid="toggle-sidebar-btn"]').click(); await p.wait_for_timeout(800)
        coll = await p.evaluate("() => Array.from(document.querySelectorAll('a[href*=\"qf=\"]')).map(a => a.getAttribute('title') + '|' + a.getAttribute('href'))")
        print("collapsed:", coll)
        chk("no TV Shows (collapsed)", not any("tv" in c.lower() for c in coll) and len(coll) >= 2, coll)
        await p.locator('[data-testid="toggle-sidebar-btn"]').click(); await p.wait_for_timeout(600)
        t0 = await titles(p)
        chk("grid sorted title-asc normally", t0[:3] == ["TEST_NoAdded", "TEST_R000", "TEST_R001"], t0[:3])
        await p.locator('[data-testid="qf-recent"]').click(); await p.wait_for_timeout(1500)
        t = await titles(p)
        print("recent first 5:", t[:5], "count rendered:", len(t), "url", p.url)
        chk("recent newest first", t[:4] == ["TEST_R109", "TEST_R108", "TEST_R107", "TEST_R106"], t[:4])
        chk("recent excludes oldest 10 + no added_at", not any(x in t for x in ["TEST_R009", "TEST_R000", "TEST_NoAdded"]), [x for x in t if x in ("TEST_R009", "TEST_R000", "TEST_NoAdded")])
        # scroll to collect all
        allt = set(t)
        for _ in range(20):
            await p.mouse.wheel(0, 2500); await p.wait_for_timeout(250)
            allt |= set(await titles(p))
        chk("recent = 100 titles", len(allt) == 100, len(allt))
        chk("sort setting untouched (still title-asc)", await p.evaluate("() => localStorage.getItem('obsidian_cinema_sort')") == "title-asc")
        await p.screenshot(path=".screenshots/iter44_recent.jpg", quality=40, full_page=False)
        chk("no fix button on recent", await p.locator('[data-testid="fix-missing-btn"]').count() == 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


# ---- Manual Fix with TMDB key ----
async def run_fix_manual():
    ctx, p, tm, wd, errs = await open_ctx(fix_lib(), key=True, fail=("TEST_Second",), tmdb_delay=0.4)
    try:
        chk("no fix button without quick filter", await p.locator('[data-testid="fix-missing-btn"]').count() == 0)
        for qf, n in (("no-year", None), ("no-genre", None)):
            await p.goto(URL + "?qf=" + qf); await p.wait_for_timeout(1200)
            print(qf, "btn:", await btn_text(p, "fix-missing-btn"), "grid:", len(await titles(p)))
        await p.goto(URL + "?qf=no-rating"); await p.wait_for_timeout(1500)
        b = await btn_text(p, "fix-missing-btn"); n = len(await titles(p))
        chk("no-rating fix button 'Fix missing info (13)'", b == f"Fix missing info ({n})" and n == 13, (b, n))
        await p.locator('[data-testid="fix-missing-btn"]').click(); await p.wait_for_timeout(500)
        b = await btn_text(p, "fix-missing-btn")
        chk("button shows Fixing done/total", b and re.match(r"Fixing \d+/13", b), b)
        chk("button disabled while running", await p.locator('[data-testid="fix-missing-btn"]').is_disabled())
        await p.screenshot(path=".screenshots/iter44_fixing.jpg", quality=40, full_page=False)
        for _ in range(40):
            await p.wait_for_timeout(500)
            if await p.locator('[data-testid="year-mismatch-dialog"]').count(): break
        ts = await toasts(p)
        print("toasts:", ts)
        print("tmdb details:", sorted(tm.details), "searches:", tm.searches)
        print("wd sparql:", wd.sparql, "wd searches:", wd.searches)
        await p.wait_for_timeout(1500)
        L = await saved(p)
        for k in ("heat", "matrix", "sf", "imdb", "rt", "tv", "second", "parts", "match", "wiki", "far", "cartoon", "doc", "full"):
            m = L[k]
            print(k, {x: m.get(x) for x in ("title", "rating", "rating_source", "year", "genres", "tmdb_id", "file_name", "gap_checked_at")})
        chk("toast 'Filled X ratings, Y years, Z genres'", any(re.search(r"Filled \d+ ratings?, \d+ years?, \d+ genres?", t) for t in ts), ts)
        chk("heat: TMDB rating/year/genres", L["heat"]["rating"] == 8.2 and L["heat"]["year"] == 1995 and L["heat"]["genres"] == ["Crime", "Drama"], L["heat"])
        chk("matrix: rating from Wikidata IMDb 8.7, year/genres kept", L["matrix"]["rating"] == 8.7 and L["matrix"]["year"] == 1999 and L["matrix"]["genres"] == ["Action"])
        chk("sf: TMDB rating 6.5, WD genres SciFi+Action+Thriller", L["sf"]["rating"] == 6.5 and sorted(L["sf"]["genres"]) == ["Action", "Science Fiction", "Thriller"], L["sf"].get("genres"))
        chk("imdb: IMDb-id lookup, Metacritic 7.3 over RT, genres kept", L["imdb"]["rating"] == 7.3 and L["imdb"]["genres"] == ["Horror"], L["imdb"]["rating"])
        chk("rt: Rotten Tomatoes 9.1", L["rt"]["rating"] == 9.1, L["rt"]["rating"])
        chk("tv: P4983 rating 8.0", L["tv"]["rating"] == 8.0, L["tv"]["rating"])
        chk("second: TMDB rating 5.5, year kept 2003", L["second"]["rating"] == 5.5 and L["second"]["year"] == 2003)
        chk("parts: year filled 2007", L["parts"]["year"] == 2007, L["parts"]["year"])
        chk("match: matched via TMDB search (tmdb 800, 7.7, 2012, Comedy)", L["match"].get("tmdb_id") == 800 and L["match"]["rating"] == 7.7 and L["match"]["year"] == 2012, L["match"])
        chk("wiki: wbsearch film hit -> 2010, 6.4, Comedy+Drama", L["wiki"]["year"] == 2010 and L["wiki"]["rating"] == 6.4 and sorted(L["wiki"]["genres"]) == ["Comedy", "Drama"], L["wiki"])
        chk("far: Wikidata hit year off by >1 rejected; year from filename 2015", L["far"]["year"] == 2015 and not L["far"]["rating"], L["far"])
        chk("cartoon: year 2005 from folder, Animation", L["cartoon"]["year"] == 2005 and L["cartoon"]["genres"] == ["Animation"], L["cartoon"])
        chk("doc: year 2011 from file, Documentary", L["doc"]["year"] == 2011 and L["doc"]["genres"] == ["Documentary"], L["doc"])
        chk("full untouched, not checked", L["full"]["rating"] == 7.1 and not L["full"].get("gap_checked_at"))
        chk("all checked titles stamped gap_checked_at", all(L[k].get("gap_checked_at") for k in L if k != "full"), [k for k in L if k != "full" and not L[k].get("gap_checked_at")])
        # iter45: rating_source label (null for TMDB, source label for Wikidata)
        rs = {k: L[k].get("rating_source") for k in L}
        print("rating_source:", rs)
        chk("rating_source TMDB -> null (heat/sf/second)", all(rs.get(k) is None for k in ("heat", "sf", "second")), rs)
        chk("rating_source matrix=IMDb, imdb=Metacritic, rt=Rotten Tomatoes, tv=IMDb, wiki=IMDb",
            rs.get("matrix") == "IMDb" and rs.get("imdb") == "Metacritic" and rs.get("rt") == "Rotten Tomatoes" and rs.get("tv") == "IMDb" and rs.get("wiki") == "IMDb", rs)
        chk("rating_source match (TMDB fresh match) null, full untouched", not rs.get("match") and not rs.get("full"), rs)
        chk("WD batched SPARQL by id", any(s[0] == "P4947" for s in wd.sparql) and any(s[0] == "P345" for s in wd.sparql) and any(s[0] == "P4983" for s in wd.sparql), wd.sparql)
        # Year mismatch dialog
        chk("dialog auto-opened", await p.locator('[data-testid="year-mismatch-dialog"]').count() == 1)
        notice = await btn_text(p, "year-mismatch-notice")
        chk("notice text", notice and "WILL change the file names" in notice and "does not harm" in notice and "metadata" in notice, notice)
        items = []
        i = 0
        while await p.locator(f'[data-testid="year-mismatch-{i}"]').count():
            items.append(await p.locator(f'[data-testid="year-mismatch-{i}"]').inner_text()); i += 1
        print("mismatch items:", items)
        joined = " || ".join(items)
        chk("Heat (1996).mkv -> Heat (1995).mkv", "Heat (1996).mkv" in joined and "Heat (1995).mkv" in joined)
        chk("TEST_Second 2003 -> 2002", "TEST_Second (2002).mkv" in joined)
        chk("multi-part excluded", "TEST_Parts" not in joined)
        chk("strike-through old name", await p.locator('[data-testid="year-mismatch-0"] .line-through').count() == 1)
        states = [await p.locator(f'[data-testid="year-mismatch-check-{j}"]').get_attribute("data-state") for j in range(i)]
        chk("all ticked by default", all(s == "checked" for s in states), states)
        chk("rename button label", await btn_text(p, "year-mismatch-rename") == f"Rename {i} files", await btn_text(p, "year-mismatch-rename"))
        chip = await btn_text(p, "year-mismatch-chip")
        chk("chip text", chip == f"{i} file names differ in year", chip)
        await p.screenshot(path=".screenshots/iter44_mismatch_dialog.jpg", quality=40, full_page=False)
        # untick + retick, then Not now, reopen from chip
        await p.locator('[data-testid="year-mismatch-check-0"]').click(); await p.wait_for_timeout(200)
        chk("untick updates count", await btn_text(p, "year-mismatch-rename") == f"Rename {i-1} file" + ("s" if i - 1 != 1 else ""), await btn_text(p, "year-mismatch-rename"))
        await p.locator('[data-testid="year-mismatch-check-0"]').click(); await p.wait_for_timeout(200)
        await p.locator('[data-testid="year-mismatch-later"]').click(); await p.wait_for_timeout(500)
        chk("Not now closes, chip stays", await p.locator('[data-testid="year-mismatch-dialog"]').count() == 0 and await p.locator('[data-testid="year-mismatch-chip"]').count() == 1)
        await p.locator('[data-testid="year-mismatch-chip"]').click(); await p.wait_for_timeout(500)
        chk("chip reopens dialog", await p.locator('[data-testid="year-mismatch-dialog"]').count() == 1)
        await p.locator('[data-testid="year-mismatch-rename"]').click(); await p.wait_for_timeout(1500)
        ren = await p.evaluate("() => window.__renames")
        ipc = await p.evaluate("() => window.__ipc")
        print("renames:", ren, "ipc used:", sorted(set(ipc)))
        chk("renameFile called with (oldPath, newName)", ["D:\\Movies\\Heat (1996).mkv", "Heat (1995).mkv"] in ren, ren)
        chk("no delete IPC", not any(re.search(r"delete|remove|unlink|trash", x, re.I) for x in ipc), sorted(set(ipc)))
        ts = await toasts(p)
        print("toasts after rename:", ts)
        chk("success + error toasts", any("Renamed 1 file" in t for t in ts) and any("Could not rename" in t and "TEST_Second" in t for t in ts), ts)
        await p.wait_for_timeout(1200)
        L2 = await saved(p)
        h = L2["heat"]
        chk("heat renamed in place, metadata kept", h["file_name"] == "Heat (1995).mkv" and h["file_path"] == "D:\\Movies\\Heat (1995).mkv" and h["year"] == 1995 and h["rating"] == 8.2 and h["tmdb_id"] == 949 and h["poster_path"], h)
        chk("failed rename keeps old name", L2["second"]["file_name"] == "TEST_Second (2003).mkv" and L2["second"]["year"] == 2003)
        chk("no titles lost", len(L2) == len(L))
        print("chip after rename:", await btn_text(p, "year-mismatch-chip"))
        chk("OBS: failed rename still offered in chip", await p.locator('[data-testid="year-mismatch-chip"]').count() == 1, "chip removed even for failed renames")
        b = await btn_text(p, "fix-missing-btn")
        print("after run no-rating btn:", b, "grid:", await titles(p))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


# ---- No key: Wikidata + local only, batching 50 ----
async def run_fix_nokey():
    lib = fix_lib()
    lib += [mk(f"b{i}", f"TEST_B{i}", f"TEST_B{i}.mkv", tmdb_id=3000 + i, year=2000, rating=0, genres=["Drama"]) for i in range(110)]
    ctx, p, tm, wd, errs = await open_ctx(lib, key=False)
    try:
        await p.goto(URL + "?qf=no-rating"); await p.wait_for_timeout(1500)
        b = await btn_text(p, "fix-missing-btn")
        chk("no-key button count 123", b == "Fix missing info (123)", b)
        await p.locator('[data-testid="fix-missing-btn"]').click()
        for _ in range(30):
            await p.wait_for_timeout(500)
            if not (await btn_text(p, "fix-missing-btn") or "").startswith("Fixing"): break
        await p.wait_for_timeout(1500)
        print("tmdb calls:", len(tm.details), tm.searches[:3], "sparql:", wd.sparql, "searches:", wd.searches)
        chk("no TMDB calls without key", len(tm.details) == 0 and len(tm.searches) == 0)
        p4947 = [n for pr, n in wd.sparql if pr == "P4947"]
        chk("P4947 batches of <=50", p4947 and max(p4947) <= 50 and sum(p4947) == 117, p4947)  # 110 + 603,700,704,710,720,730,? 
        L = await saved(p)
        chk("matrix 8.7 via WD (no key)", L["matrix"]["rating"] == 8.7)
        chk("heat: no TMDB -> year 1996 from filename, no mismatch", L["heat"]["year"] == 1996, L["heat"]["year"])
        chk("wiki via search no key", L["wiki"]["rating"] == 6.4 and L["wiki"]["year"] == 2010, L["wiki"])
        chk("cartoon local", L["cartoon"]["year"] == 2005 and L["cartoon"]["genres"] == ["Animation"])
        ts = await toasts(p)
        print("toasts:", ts, "dialog:", await p.locator('[data-testid="year-mismatch-dialog"]').count())
        chk("toast of 123", any("of 123 titles" in t for t in ts), ts)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


# ---- Background pass ----
async def run_background():
    ctx, p, tm, wd, errs = await open_ctx(fix_lib(), key=True, auto="on", tmdb_delay=1.0)
    try:
        chk("auto-fill chip present", await p.get_by_text("Auto-fill").count() >= 1)
        await p.wait_for_timeout(18000)
        chk("nothing ran before ~25s", len(wd.sparql) == 0, wd.sparql)
        seen_bg = None
        for _ in range(40):
            await p.wait_for_timeout(500)
            t = await btn_text(p, "fix-missing-bg")
            if t: seen_bg = t; break
        print("bg indicator:", seen_bg)
        chk("fix-missing-bg indicator shown", seen_bg and "Filling gaps" in seen_bg, seen_bg)
        await p.screenshot(path=".screenshots/iter44_bg.jpg", quality=40, full_page=False)
        for _ in range(40):
            await p.wait_for_timeout(500)
            if not await p.locator('[data-testid="fix-missing-bg"]').count(): break
        await p.wait_for_timeout(1500)
        L = await saved(p)
        chk("bg applied heat", L["heat"]["rating"] == 8.2 and L["heat"]["year"] == 1995)
        chk("bg applied wikidata matrix", L["matrix"]["rating"] == 8.7)
        chip = await btn_text(p, "year-mismatch-chip")
        chk("bg mismatches in chip, dialog not opened", chip and "2 file names" in chip and await p.locator('[data-testid="year-mismatch-dialog"]').count() == 0, chip)
        ts = await toasts(p)
        chk("bg quiet (no fill toast)", not any("Filled missing info" in t for t in ts), ts)
        n_sparql, n_det = len(wd.sparql), len([d for d in tm.details])
        print("after first bg: sparql", n_sparql, "tmdb details", n_det)
        await p.wait_for_timeout(32000)
        print("after +32s: sparql", len(wd.sparql), "tmdb details", len(tm.details), "searches", len(wd.searches))
        chk("bg does not loop on same titles", len(wd.sparql) == n_sparql, (n_sparql, len(wd.sparql)))
        # reload: gap_checked_at prevents re-run
        await p.reload(); await p.wait_for_timeout(30000)
        print("after reload+30s: sparql", len(wd.sparql))
        chk("after reload, checked titles skipped (30 days)", len(wd.sparql) == n_sparql, (n_sparql, len(wd.sparql)))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
