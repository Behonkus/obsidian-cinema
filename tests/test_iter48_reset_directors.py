# Iteration 48: Reset metadata / re-match must clear stale directors (director text is source of truth)
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter48_reset_directors.py').read(), g); await g['run_reset']() / run_rematch() / run_corrupted()
import json, re, asyncio
g43 = {'page': page}
exec(open('/app/tests/test_iter43_detail_filmography.py').read(), g43)
card, A, open_ctx, chk, lst, URL, close = (g43[k] for k in ('card', 'A', 'open_ctx', 'chk', 'lst', 'URL', 'close'))
_g41 = g43['g42']['g41']
find_row, pick, dlg = _g41['find_row'], _g41['pick'], _g41['dlg']
open_detail, detail_title = g43['open_detail'], g43['detail_title']
PH = "https://image.tmdb.org/t/p/w185/da.jpg"


def DA():
    return {"director": "Dir A", "directors": [{"name": "Dir A", "profile_path": PH}]}


def lib48():
    c = lambda i, t, y, **kw: card(i, title=t, year=y, genres=["Drama"], rating=7.0, cast=[A("Actor X", f"H{i}")], **kw)
    return [
        c(801, "TEST_ResetMe", 2001, aka=["Alt Reset"], rating_source="IMDb", **DA()),
        c(802, "TEST_KeepA1", 2002, **DA()),
        c(803, "TEST_KeepA2", 2003, **DA()),
        c(804, "TEST_Rematch", 2004, **DA()),
        c(805, "TEST_ToTV", 2005, aka=["Alt TV"], **DA()),
        # corrupted cards from before the fix
        c(806, "TEST_CorruptNull", 2006, director=None, directors=[{"name": "Dir A", "profile_path": PH}]),
        c(807, "TEST_CorruptB", 2007, director="Dir B", directors=[{"name": "Dir A", "profile_path": PH}]),
    ]


class MatchMock:
    def __init__(self):
        self.calls = []

    async def handle(self, route):
        url = route.request.url
        self.calls.append(url)
        hdr = {"Access-Control-Allow-Origin": "*"}
        body = {"results": []}
        if "/search/movie" in url:
            body = {"results": [{"id": 9001, "title": "Film A", "release_date": "2001-01-01", "poster_path": "/a.jpg", "vote_average": 7},
                                {"id": 9002, "title": "Film B", "release_date": "2010-01-01", "poster_path": "/b.jpg", "vote_average": 8}]}
        elif "/search/tv" in url:
            body = {"results": [{"id": 9101, "name": "Show X", "first_air_date": "2015-01-01", "poster_path": "/x.jpg", "vote_average": 8.5}]}
        else:
            m = re.search(r"/3/(movie|tv)/(\d+)(\?|$)", url)
            if m:
                kind, tid = m.group(1), int(m.group(2))
                if kind == "movie":
                    dn = "Dir A" if tid == 9001 else "Dir B"
                    body = {"id": tid, "title": "Film A" if tid == 9001 else "Film B", "original_title": "Film B Orig" if tid == 9002 else "Film A",
                            "release_date": "2010-01-01", "vote_average": 8, "runtime": 110, "genres": [{"id": 18, "name": "Drama"}],
                            "alternative_titles": {"titles": []},
                            "credits": {"cast": [{"name": "Actor B", "character": "Lead", "known_for_department": "Acting"}],
                                        "crew": [{"job": "Director", "name": dn, "department": "Directing", "profile_path": "/db.jpg"}]},
                            "release_dates": {"results": []}, "external_ids": {}}
                else:
                    body = {"id": tid, "name": "Show X", "original_name": "Show X", "first_air_date": "2015-01-01", "vote_average": 8.5,
                            "genres": [{"id": 18, "name": "Drama"}], "created_by": [{"name": "Creator C"}], "number_of_seasons": 2, "number_of_episodes": 20,
                            "credits": {"cast": [{"name": "TV Star", "character": "Lead"}]}, "content_ratings": {"results": []}, "external_ids": {}}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)


async def director_text(p):
    loc = p.locator('[data-testid="movie-director"]')
    return (await loc.inner_text()) if await loc.count() else None


async def stats_check(p, expect):
    """expect: {name: (count, [titles])} ; name absent -> must not be listed."""
    await p.goto(URL + "stats"); await p.wait_for_timeout(2000)
    most = await lst(p, "director-most-")
    print("director-most:", most)
    for name, exp in expect.items():
        tid, row = await find_row(p, "director-most-", name + " |")
        if exp is None:
            chk(f"stats: {name} not listed", tid is None, most)
            continue
        n, tl = exp
        chk(f"stats: {name} count {n}", tid is not None and row.endswith(f"| {n}"), row)
        if tid:
            d = await pick(p, tid)
            got = [x.split(" | ")[0] for x in d["items"]] if d else None
            chk(f"stats popup {name} films", got == tl, got)
            await close(p)
    return most


async def save_lib(p):
    return await p.evaluate("() => JSON.parse(sessionStorage.getItem('fakeLibFile') || '[]')")


async def run_reset():
    ctx, p, mock, errs = await open_ctx(lib48(), key=True, auto="off", mock=MatchMock())
    try:
        await p.wait_for_timeout(1000)
        akas = await p.locator('[data-testid="movie-card-aka"]').all_inner_texts()
        chk("pre: card aka lines present", "aka Alt Reset" in akas, akas)
        t = await open_detail(p, "TEST_ResetMe")
        chk("pre: Directed by Dir A", (await director_text(p) or "").startswith("Directed by Dir A"), await director_text(p))
        chk("pre: rating source tag full", await p.locator('[data-testid="rating-source-tag-full"]').count() == 1)
        await p.locator('[data-testid="reset-metadata-btn"]').scroll_into_view_if_needed()
        await p.locator('[data-testid="reset-metadata-btn"]').click(); await p.wait_for_timeout(800)
        chk("after reset: no movie-director", await p.locator('[data-testid="movie-director"]').count() == 0, await director_text(p))
        chk("after reset: no movie-aka", await p.locator('[data-testid="movie-aka"]').count() == 0)
        chk("after reset: no rating source tag", await p.locator('[data-testid="rating-source-tag-full"]').count() == 0)
        await p.screenshot(path=".screenshots/iter48_after_reset.jpg", quality=40, full_page=False)
        # Detail director link on another Dir A film -> filmography excludes reset card
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        akas = await p.locator('[data-testid="movie-card-aka"]').all_inner_texts()
        chk("after reset: card aka gone", "aka Alt Reset" not in akas, akas)
        await open_detail(p, "TEST_KeepA1")
        await p.locator('[data-testid="movie-director-link-0"]').click(); await p.wait_for_timeout(600)
        d = await dlg(p)
        tl = [x.split(" | ")[0] for x in d["items"]]
        print("detail Dir A popup:", d["count"], tl)
        chk("detail popup Dir A excludes TEST_ResetMe & corrupted", tl == ["TEST_ToTV", "TEST_Rematch", "TEST_KeepA2", "TEST_KeepA1"], tl)
        await close(p); await p.keyboard.press("Escape"); await p.wait_for_timeout(1500)
        L = {m["id"]: m for m in await save_lib(p)}
        r = L["m801"]
        chk("persisted reset fields null", all(r.get(k) is None for k in ("director", "directors", "aka", "rating_source", "media_type", "tmdb_id")), {k: r.get(k) for k in ("director", "directors", "aka", "rating_source", "media_type")})
        chk("title/file kept", r.get("title") == "TEST_ResetMe" and r.get("file_path"), r.get("title"))
        await stats_check(p, {"Dir A": (4, ["TEST_ToTV", "TEST_Rematch", "TEST_KeepA2", "TEST_KeepA1"]), "Dir B": (1, ["TEST_CorruptB"])})
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def rematch(p, title, testid):
    await open_detail(p, title)
    await p.locator('[data-testid="poster-change-trigger"]').click(force=True)
    await p.wait_for_timeout(1500)
    if await p.locator('[data-testid="poster-search-input"]').count() == 0:
        chk(f"{title}: poster search opened", False); return False
    await p.fill('[data-testid="poster-search-input"]', "film"); await p.keyboard.press("Enter"); await p.wait_for_timeout(1500)
    res = p.locator(f'[data-testid="{testid}"]')
    chk(f"{title}: result {testid} shown", await res.count() == 1, await lst(p, "poster-result-"))
    await res.click(); await p.wait_for_timeout(1500)
    return True


async def run_rematch():
    mock = MatchMock()
    ctx, p, _, errs = await open_ctx(lib48(), key=True, auto="off", mock=mock)
    try:
        await p.wait_for_timeout(1000)
        ok = await rematch(p, "TEST_Rematch", "poster-result-movie-9002")
        if ok:
            dt = await director_text(p)
            print("after rematch B:", dt)
            chk("rematch B: Directed by Dir B only", dt == "Directed by Dir B", dt)
            await p.locator('[data-testid="movie-director-link-0"]').click(); await p.wait_for_timeout(600)
            d = await dlg(p); tl = [x.split(" | ")[0] for x in d["items"]]
            print("Dir B popup from detail:", d["count"], tl)
            chk("Dir B popup includes rematched & corrupted B", set(tl) == {"TEST_Rematch", "TEST_CorruptB"}, tl)
            await close(p)
            await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        ok = await rematch(p, "TEST_ToTV", "poster-result-tv-9101")
        if ok:
            dt = await director_text(p)
            print("after rematch TV:", dt)
            chk("rematch TV: Created by Creator C", dt == "Created by Creator C", dt)
            chk("rematch TV: series badge", await p.locator('[data-testid="movie-series-badge"]').count() == 1)
            chk("rematch TV: no aka", await p.locator('[data-testid="movie-aka"]').count() == 0)
            await p.screenshot(path=".screenshots/iter48_rematch_tv.jpg", quality=40, full_page=False)
            await p.keyboard.press("Escape"); await p.wait_for_timeout(1500)
        L = {m["id"]: m for m in await save_lib(p)}
        print("m804:", {k: L["m804"].get(k) for k in ("director", "directors", "tmdb_id", "media_type")})
        print("m805:", {k: L["m805"].get(k) for k in ("director", "directors", "aka", "tmdb_id", "media_type")})
        chk("persist m804 directors only Dir B", [d["name"] for d in (L["m804"].get("directors") or [])] == ["Dir B"] and L["m804"].get("director") == "Dir B")
        chk("persist m805 tv, directors [] aka []", L["m805"].get("media_type") == "tv" and L["m805"].get("directors") == [] and L["m805"].get("aka") == [])
        await stats_check(p, {"Dir A": (3, ["TEST_KeepA2", "TEST_KeepA1", "TEST_ResetMe"]), "Dir B": (2, ["TEST_Rematch", "TEST_CorruptB"]),
                              "Creator C": None})
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_corrupted():
    ctx, p, mock, errs = await open_ctx(lib48(), key=False, auto="off")
    try:
        await p.wait_for_timeout(1000)
        await open_detail(p, "TEST_CorruptNull")
        chk("corrupt null: no Directed by", await p.locator('[data-testid="movie-director"]').count() == 0, await director_text(p))
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        await open_detail(p, "TEST_CorruptB")
        dt = await director_text(p)
        chk("corrupt B: Directed by Dir B only", dt == "Directed by Dir B", dt)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        await stats_check(p, {"Dir A": (5, ["TEST_ToTV", "TEST_Rematch", "TEST_KeepA2", "TEST_KeepA1", "TEST_ResetMe"]), "Dir B": (1, ["TEST_CorruptB"])})
        dh = await p.locator('[data-testid="director-insights"]').inner_text()
        print("header:", dh[:120])
        chk("director header 2 directors / 6 films", "(2 directors across 6 films)" in dh, dh[:120])
        chk("Dir A photo kept (matching entry)", await p.locator('[data-testid="director-most-0"] img').count() == 1)
        # Person filter Show all in Library for Dir A
        tid, _ = await find_row(p, "director-most-", "Dir A |")
        await pick(p, tid)
        await p.locator('[data-testid="filmography-show-library"]').click(); await p.wait_for_timeout(1500)
        tt = await p.evaluate("() => Array.from(document.querySelectorAll('h3.font-medium.truncate')).map(e => e.innerText)")
        chk("Dir A library filter excludes corrupted cards", sorted(tt) == sorted(["TEST_ToTV", "TEST_Rematch", "TEST_KeepA2", "TEST_KeepA1", "TEST_ResetMe"]), tt)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
