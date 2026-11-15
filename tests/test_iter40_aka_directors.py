# Iteration 40: AKA titles (card/detail/search), background aka re-fetch, film-only Cast Insights, Director Insights
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter40_aka_directors.py').read(), g); await g['run_aka_bg']() / run_insights() / run_no_directors()
import sys, json, re, asyncio
sys.path.insert(0, '/app/tests')
import importlib
import auto_enrich_harness as AE
import auto_match_harness as H
importlib.reload(AE); importlib.reload(H)
URL = "https://obsidian-preview.preview.emergentagent.com/#/"


def card(i, **kw):
    d = {"id": f"m{i}", "title": f"TEST_Movie{i}", "file_name": f"TEST_Movie{i}.mkv",
         "file_path": f"D:\\Movies\\TEST_Movie{i}.mkv", "tmdb_id": i, "media_type": "movie",
         "poster_path": "https://image.tmdb.org/t/p/w500/x.jpg", "year": 2000, "metadata_updated_at": 1}
    d.update(kw)
    return d


ALT = {
    101: ("Le Film", [("US", "The Film"), ("GB", "the film"), ("FR", "Le Film FR"), ("CA", "TEST_Movie101"),
                      ("AU", "A1"), ("IE", "A2"), ("NZ", "A3"), ("US", "A4"), ("US", "A5")]),
    102: ("TEST_Movie102", []),
    103: ("Original 103", [("DE", "German Only")]),
}
EXPECT_AKA = {"m101": ["Le Film", "The Film", "A1", "A2", "A3", "A4"], "m102": [], "m103": ["Original 103"]}


class AkaMock:
    def __init__(self):
        self.requests = []
        self.queries = []

    async def handle(self, route):
        url = route.request.url
        hdr = {"Access-Control-Allow-Origin": "*"}
        m = re.search(r"/3/(movie|tv)/(\d+)(\?|$)", url)
        if not m:
            await route.fulfill(status=200, content_type="application/json", body='{"results":[]}', headers=hdr)
            return
        kind, tid = m.group(1), int(m.group(2))
        self.requests.append(f"{kind}/{tid}")
        self.queries.append(url)
        self.inflight = getattr(self, 'inflight', 0) + 1
        self.max_inflight = max(getattr(self, 'max_inflight', 0), self.inflight)
        try:
            await asyncio.sleep(getattr(self, 'delay', 0.3))
        finally:
            self.inflight -= 1
        orig, alts = ALT.get(tid, (f"TEST_Movie{tid}", []))
        body = {"id": tid, "title": f"TEST_Movie{tid}", "original_title": orig, "runtime": 100, "vote_average": 7, "genres": [{"id": 18, "name": "Drama"}],
                "release_date": "2000-01-01", "alternative_titles": {"titles": [{"iso_3166_1": c, "title": t} for c, t in alts]},
                "credits": {"cast": [{"name": "Actor X", "character": "Hero", "known_for_department": "Acting", "profile_path": "/x.jpg"},
                                     {"name": "Singer S", "character": "Bar Singer", "known_for_department": "Sound"}],
                            "crew": [{"job": "Director", "name": "Dir A", "department": "Directing", "profile_path": "/d.jpg"}]},
                "release_dates": {"results": []}, "external_ids": {}}
        if kind == "tv":
            body = {"id": tid, "name": "TEST_Show500", "genres": [], "credits": {"cast": []}, "content_ratings": {"results": []}, "external_ids": {}}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)


async def open_ctx(lib, key=True, auto=None, url=URL, mock=None, grid=None):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = mock or AkaMock()
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    scan = [{k: m.get(k) for k in ('id', 'file_path', 'file_name', 'title', 'year')} for m in lib if m.get('file_path')]
    await ctx.add_init_script(H.init_script(lib=lib, key=key, auto=auto, scan=scan, dirs=("D:\\Movies", "D:\\TV")))
    if grid:
        await ctx.add_init_script("localStorage.setItem('obsidian_cinema_grid_size','%s');" % grid)
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(url)
    await p.wait_for_timeout(2500)
    return ctx, p, mock, errs


def chk(label, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


async def run_aka_bg():
    lib = [card(101), card(102), card(103), card(104, aka=[]),
           card(105, metadata_updated_at=None),
           {"id": "tv500", "title": "TEST_Show500", "media_type": "tv", "tmdb_id": 500, "metadata_updated_at": 1,
            "file_name": "TEST_Show500 S01E01.mkv", "file_path": "D:\\TV\\Show500\\TEST_Show500 S01E01.mkv"},
           {"id": "nomatch", "title": "TEST_NoMatch", "file_name": "TEST_NoMatch.mkv", "file_path": "D:\\Movies\\TEST_NoMatch.mkv"}]
    ctx, p, mock, errs = await open_ctx(lib, auto=None)
    try:
        chk("no aka line before fetch", await p.locator('[data-testid="movie-card-aka"]').count() == 0)
        await p.wait_for_timeout(13000)
        reqs = sorted(mock.requests)
        chk("bg fetched exactly 101,102,103,105 (not 104 aka[], not tv500)", reqs == ["movie/101", "movie/102", "movie/103", "movie/105"], reqs)
        chk("append_to_response has alternative_titles", all("alternative_titles" in q for q in mock.queries), mock.queries[:1])
        L = await AE.read_lib(p)
        for mid, exp in EXPECT_AKA.items():
            chk(f"{mid} aka", L[mid].get("aka") == exp, L[mid].get("aka"))
        chk("m101 directors", L["m101"].get("directors") == [{"name": "Dir A", "profile_path": "https://image.tmdb.org/t/p/w185/d.jpg"}], L["m101"].get("directors"))
        chk("m101 cast dept", [c.get("dept") for c in L["m101"].get("cast", [])] == ["Acting", "Sound"], L["m101"].get("cast"))
        chk("tv500 aka untouched", "aka" not in L["tv500"])
        # card UI
        await p.wait_for_timeout(1000)
        akas = await p.locator('[data-testid="movie-card-aka"]').all()
        info = [(await a.inner_text(), await a.get_attribute("title")) for a in akas]
        print("card aka lines:", info)
        chk("2 aka lines (101,103)", len(info) == 2)
        chk("101 card text/tooltip", ("aka Le Film", "Also known as: Le Film · The Film · A1 · A2 · A3 · A4") in info)
        await p.screenshot(path=".screenshots/iter40_cards.jpg", quality=40, full_page=False)
        # search by aka
        await p.fill('[data-testid="movie-search-input"]', "a3")
        await p.wait_for_timeout(800)
        vis = await p.locator('h3.font-medium.truncate').all_inner_texts()
        chk("search 'a3' -> TEST_Movie101 only", vis == ["TEST_Movie101"], vis)
        await p.fill('[data-testid="movie-search-input"]', "original 103")
        await p.wait_for_timeout(800)
        vis = await p.locator('h3.font-medium.truncate').all_inner_texts()
        chk("search 'original 103' -> 103", vis == ["TEST_Movie103"], vis)
        await p.fill('[data-testid="movie-search-input"]', "")
        await p.wait_for_timeout(500)
        # detail
        await p.locator('div.cursor-pointer.overflow-hidden', has_text="TEST_Movie101").first.click()
        await p.wait_for_timeout(1000)
        t = await p.locator('[data-testid="movie-aka"]').inner_text() if await p.locator('[data-testid="movie-aka"]').count() else None
        chk("detail movie-aka", t == "Also known as: Le Film · The Film · A1 · A2 · A3 · A4", t)
        await p.screenshot(path=".screenshots/iter40_detail.jpg", quality=40, full_page=False)
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(500)
        await p.locator('div.cursor-pointer.overflow-hidden', has_text="TEST_Movie102").first.click()
        await p.wait_for_timeout(800)
        chk("detail 102 no movie-aka", await p.locator('[data-testid="movie-aka"]').count() == 0)
        await p.keyboard.press("Escape")
        # reload -> no re-fetch
        n = len(mock.requests)
        await p.reload()
        await p.wait_for_timeout(14000)
        chk("no re-fetch after reload", len(mock.requests) == n, mock.requests[n:])
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
    # small grid hides aka
    ctx, p, mock, errs = await open_ctx([card(101, aka=["Le Film"]), card(102)], auto="off", grid="small")
    try:
        chk("small grid: no aka line", await p.locator('[data-testid="movie-card-aka"]').count() == 0)
    finally:
        await ctx.close()
    ctx, p, mock, errs = await open_ctx([card(101, aka=["Le Film"]), card(102)], auto="off", grid="large")
    try:
        chk("large grid: aka line shown", await p.locator('[data-testid="movie-card-aka"]').count() == 1)
    finally:
        await ctx.close()


def A(name, char="Role", dept="Acting", photo=None):
    d = {"name": name, "character": char, "profile_path": photo}
    if dept is not None:
        d["dept"] = dept
    return d


GEN = ["Drama", "Action", "Comedy", "Thriller"]


def insights_lib():
    lib = []
    for i in range(1, 13):
        m = card(200 + i, title=f"TEST_Film{i}", rating=6 + i * 0.2, genres=[GEN[i % 4]],
                 cast=[A("Actor X", photo="https://image.tmdb.org/t/p/w185/x.jpg"), A("Cameo Guy", "Himself"), A("Actor Y", dept=None),
                       A("Singer S", "Bar Singer", "Sound"), A("Actor Z"), A("Actor W"), A("Actor V"), A("Deep Actor")])
        if i <= 6:
            m["directors"] = [{"name": "Dir A", "profile_path": "https://image.tmdb.org/t/p/w185/a.jpg"}]
        elif i <= 8:
            m["director"] = "Dir B, Dir C"
        else:
            m["directors"] = [{"name": "Dir D", "profile_path": None}]
        lib.append(m)
    for i in range(13):
        lib.append({"id": f"tv{i}", "title": f"TEST_TV{i}", "media_type": "tv", "tmdb_id": 900 + i, "rating": 9, "genres": ["Drama", "Crime"],
                    "file_name": f"tv{i} S01E01.mkv", "file_path": f"D:\\TV\\S{i}\\tv{i} S01E01.mkv",
                    "cast": [A("TV Star")], "director": "TV Dir"})
    for i in range(13):
        lib.append({"id": f"ser{i}", "title": f"TEST_Ser{i}", "tmdb_id": 950 + i, "rating": 9, "genres": ["Drama"],
                    "file_name": f"ser{i} S01E01.mkv", "file_path": f"D:\\Movies\\Ser{i}\\ser{i} S01E01.mkv",
                    "parts": [{"file_name": f"ser{i} S01E0{k}.mkv", "file_path": f"D:\\Movies\\Ser{i}\\ser{i} S01E0{k}.mkv", "episode": {"season": 1, "number": k}} for k in (1, 2)],
                    "cast": [A("Series Star")], "directors": [{"name": "Series Dir", "profile_path": None}]})
    for i in range(3):
        lib.append(card(300 + i, title=f"TEST_Concert{i}", genres=[{"id": 10402, "name": "Music"}] if i == 0 else ["Music"], rating=8,
                        cast=[A("Musician M", "Lead Singer")], directors=[{"name": "Concert Dir", "profile_path": None}]))
        lib.append(card(400 + i, title=f"TEST_Doc{i}", genres=["Documentary"], rating=8,
                        cast=[A("Doc Person", "Narrator")], directors=[{"name": "Doc Dir", "profile_path": None}]))
    return lib


async def lst(p, prefix):
    return await p.evaluate("(pf) => Array.from(document.querySelectorAll('[data-testid^=\"'+pf+'\"]')).map(e => e.innerText.split('\\n').map(x => x.trim()).filter(Boolean).join(' | '))", prefix)


async def run_insights():
    ctx, p, mock, errs = await open_ctx(insights_lib(), key=False, auto="off", url=URL + "stats")
    try:
        await p.wait_for_timeout(1500)
        hdr = await p.get_by_text("actors across").first.inner_text()
        print("cast header:", hdr)
        chk("cast header 6 actors / 12 movies", "(6 actors across 12 movies)" in hdr, hdr)
        top = await lst(p, "top-actor-"); rated = await lst(p, "rated-actor-"); cham = await lst(p, "chameleon-actor-")
        print("top:", top); print("rated:", rated); print("cham:", cham)
        bad = ["Series Star", "TV Star", "Musician M", "Doc Person", "Cameo Guy", "Singer S"]
        allc = " ".join(top + rated + cham)
        chk("no excluded names in cast lists", not any(b in allc for b in bad), [b for b in bad if b in allc])
        chk("Actor Y (no dept, legacy) counted", "Actor Y" in allc)
        chk("6 actors in Most Appearing", len(top) == 6, len(top))
        dh = await p.locator('[data-testid="director-insights"]').inner_text()
        print("director header:", dh)
        chk("director header 4 directors / 12 films", "(4 directors across 12 films)" in dh, dh)
        most = await lst(p, "director-most-"); drated = await lst(p, "director-rated-"); rng = await lst(p, "director-range-"); pairs = await lst(p, "director-pairs-")
        print("most:", most); print("rated:", drated); print("range:", rng); print("pairs:", pairs)
        chk("most: Dir A 6 first, Dir D 4 second", most[:2] == ["#1 | Dir A | 6", "#2 | Dir D | 4"], most)
        chk("most includes split Dir B/Dir C 2", any("Dir B | 2" in r for r in most) and any("Dir C | 2" in r for r in most))
        chk("no TV/Concert/Doc directors", not any(x in " ".join(most + drated + rng + pairs) for x in ["Series Dir", "TV Dir", "Concert Dir", "Doc Dir"]))
        chk("top-rated only Dir A (>=5)", len(drated) == 1 and "Dir A" in drated[0] and "6 films" in drated[0], drated)
        chk("Dir A avg 6.7", drated and "★ 6.7" in drated[0], drated)
        chk("range 4 directors", len(rng) == 4, rng)
        chk("pairs 10 rows, first is 'with Dir A' count 6", len(pairs) == 10 and "with Dir A" in pairs[0] and pairs[0].endswith("| 6"), pairs[:2])
        chk("no Deep Actor/Cameo/Singer in pairs", not any(x in " ".join(pairs) for x in ["Deep Actor", "Cameo Guy", "Singer S"]))
        img = await p.locator('[data-testid="director-most-0"] img').count()
        chk("Dir A photo shown", img == 1)
        await p.locator('[data-testid="director-insights"]').scroll_into_view_if_needed()
        await p.screenshot(path=".screenshots/iter40_directors.jpg", quality=40, full_page=False)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_no_directors():
    lib = [card(501, cast=[A("Actor X")], genres=["Drama"]), card(502, cast=[A("Actor X")], genres=["Drama"]),
           {"id": "tvx", "title": "TEST_TVX", "media_type": "tv", "director": "TV Dir", "file_name": "x.mkv", "file_path": "D:\\TV\\x.mkv"}]
    ctx, p, mock, errs = await open_ctx(lib, key=False, auto="off", url=URL + "stats")
    try:
        await p.wait_for_timeout(1000)
        chk("stats-page renders", await p.locator('[data-testid="stats-page"]').count() >= 1)
        chk("director-insights hidden", await p.locator('[data-testid="director-insights"]').count() == 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_batch():
    """205 old films without aka: first batch 200, concurrency <= 2, remaining 5 in a later batch."""
    lib = [card(1000 + i) for i in range(205)]
    mock = AkaMock(); mock.delay = 0.05
    ctx, p, mock, errs = await open_ctx(lib, auto=None, mock=mock)
    try:
        for _ in range(40):
            await p.wait_for_timeout(1000)
            if len(mock.requests) >= 200: break
        await p.wait_for_timeout(1500)
        n1 = len(mock.requests)
        chk("first batch = 200", n1 == 200, n1)
        chk("max concurrency <= 2", mock.max_inflight <= 2, mock.max_inflight)
        await p.wait_for_timeout(14000)
        chk("second batch fetched remaining 5", len(mock.requests) == 205 and len(set(mock.requests)) == 205, len(mock.requests))
        L = await AE.read_lib(p)
        chk("all 205 have aka list", all(isinstance(m.get("aka"), list) for m in L.values()))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
