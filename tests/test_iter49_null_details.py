# Iteration 49: applyManualMatch null-details guard (TMDB 500 -> card unchanged + error toast); TV->film re-match clears season/episode counts
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter49_null_details.py').read(), g); await g['run_fail500']() / run_tv_to_film()
import json
g48 = {'page': page}
exec(open('/app/tests/test_iter48_reset_directors.py').read(), g48)
card, A, open_ctx, chk, lst, close = (g48[k] for k in ('card', 'A', 'open_ctx', 'chk', 'lst', 'close'))
MatchMock, lib48, rematch, director_text, save_lib, stats_check, open_detail, DA, PH = (g48[k] for k in (
    'MatchMock', 'lib48', 'rematch', 'director_text', 'save_lib', 'stats_check', 'open_detail', 'DA', 'PH'))
KEYS = ("tmdb_id", "director", "directors", "cast", "aka", "genres", "media_type", "title", "year", "rating", "poster_path", "match_method")


class FailMock(MatchMock):
    """movie/9002 details -> HTTP 500"""
    async def handle(self, route):
        url = route.request.url
        if "/3/movie/9002?" in url or url.endswith("/3/movie/9002"):
            self.calls.append(url)
            await route.fulfill(status=500, content_type="application/json", body='{"status_message":"err"}', headers={"Access-Control-Allow-Origin": "*"})
            return
        await super().handle(route)


async def toasts(p):
    return await p.evaluate("() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(e => e.innerText.replace(/\\n/g, ' '))")


async def run_fail500():
    mock = FailMock()
    ctx, p, _, errs = await open_ctx(lib48(), key=True, auto="off", mock=mock)
    try:
        await p.wait_for_timeout(1000)
        before = {m["id"]: m for m in await save_lib(p)}["m804"]
        ok = await rematch(p, "TEST_Rematch", "poster-result-movie-9002")
        chk("details 9002 requested (500)", any("/movie/9002" in u for u in mock.calls), [u for u in mock.calls if "9002" in u])
        ts = await toasts(p)
        print("toasts:", ts)
        chk("error toast shown", any("Could not load details from TMDB" in t and "please try again" in t for t in ts), ts)
        chk("no success 'Matched to' toast", not any("Matched to" in t for t in ts), ts)
        dt = await director_text(p)
        chk("detail still Directed by Dir A", dt == "Directed by Dir A", dt)
        chk("poster search still open (user can retry)", await p.locator('[data-testid="poster-search-input"]').count() == 1)
        await p.screenshot(path=".screenshots/iter49_fail500.jpg", quality=40, full_page=False)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(1500)
        after = {m["id"]: m for m in await save_lib(p)}["m804"]
        diff = {k: (before.get(k), after.get(k)) for k in KEYS if before.get(k) != after.get(k)}
        print("diff:", diff)
        chk("persisted card unchanged (tmdb_id, director, directors, cast, aka, genres...)", not diff, diff)
        await stats_check(p, {"Dir A": (5, ["TEST_ToTV", "TEST_Rematch", "TEST_KeepA2", "TEST_KeepA1", "TEST_ResetMe"]), "Dir B": (1, ["TEST_CorruptB"])})
        # retry succeeds once 9002 is healthy: swap mock behaviour
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_tv_to_film():
    lib = lib48()
    lib.append(card(808, title="TEST_WasTV", year=2015, genres=["Drama"], rating=8.5, cast=[A("TV Star", "Lead")],
                    media_type="tv", season_count=2, episode_count=20, tmdb_id=9101, director="Creator C", directors=[], aka=[]))
    ctx, p, _, errs = await open_ctx(lib, key=True, auto="off", mock=MatchMock())
    try:
        await p.wait_for_timeout(1000)
        await open_detail(p, "TEST_WasTV")
        badge = p.locator('[data-testid="movie-series-badge"]')
        bt = (await badge.inner_text()) if await badge.count() else None
        print("pre badge:", bt)
        chk("pre: series badge with 20 episodes", bt is not None and "20 episodes" in bt, bt)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        ok = await rematch(p, "TEST_WasTV", "poster-result-movie-9002")
        if ok:
            ts = await toasts(p); print("toasts:", ts)
            chk("success toast Matched to Film B", any('Matched to "Film B' in t for t in ts), ts)
            chk("no series badge after film match", await p.locator('[data-testid="movie-series-badge"]').count() == 0)
            dt = await director_text(p)
            chk("Directed by Dir B", dt == "Directed by Dir B", dt)
            await p.keyboard.press("Escape"); await p.wait_for_timeout(1500)
        r = {m["id"]: m for m in await save_lib(p)}["m808"]
        print("m808:", {k: r.get(k) for k in ("media_type", "season_count", "episode_count", "tmdb_id", "director")})
        chk("persisted movie, season/episode counts null", r.get("media_type") == "movie" and r.get("season_count") is None and r.get("episode_count") is None and r.get("tmdb_id") == 9002, r.get("season_count"))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
