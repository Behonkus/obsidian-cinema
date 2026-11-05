# Iteration 32 retest: Extras show name, The Interview, show-folder auto-match skip, new show lookup, Feature section, toast, failed season keeps episodes
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter32_multipart.py').read(), g); then await g['run_X']()
exec(open('/app/tests/test_auto_multipart_ui.py').read(), globals())
import json, re, asyncio
from urllib.parse import urlparse, parse_qs


class Mock2(X.TmdbMock):
    """Adds: search/tv 'lost' -> id 9; fail_season -> /tv/*/season/* returns 500."""
    fail_season = False

    async def handle(self, route):
        p = urlparse(route.request.url)
        qs = parse_qs(p.query)
        hdr = {"Access-Control-Allow-Origin": "*"}
        if self.fail_season and re.search(r"/season/\d+$", p.path):
            self.calls.append(p.path + " (500)")
            await route.fulfill(status=500, content_type="application/json", body="{}", headers=hdr)
            return
        if p.path.endswith("/search/tv") and "lost" in qs.get("query", [""])[0].lower():
            self.calls.append(p.path + "?query=" + qs["query"][0])
            body = {"results": [{"id": 9, "name": "Lost", "original_name": "Lost", "first_air_date": "2004-09-22",
                                 "popularity": 80, "vote_count": 5000, "poster_path": "/lost.jpg"}]}
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)
            return
        await super().handle(route)


async def open2(lib, scan, auto="off", delay=0.2):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = Mock2(delay=delay)
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    await ctx.add_init_script(H.init_script(lib=lib, key=True, auto=auto, scan=scan, dirs=("D:\\TV", "D:\\Movies")))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL)
    await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
    await p.wait_for_timeout(1000)
    return ctx, p, mock, errs


def c(i, path, title, **kw):
    d = {"id": i, "file_path": path, "file_name": path.split("\\")[-1], "title": title, "added_at": 1}
    d.update(kw)
    return d


async def tv_count(p):
    return (await p.locator('[data-testid="qf-tv-shows"]').inner_text()).replace("\n", " ")


async def dialog_text(p):
    d = p.locator('[data-testid="multipart-suggest-dialog"]')
    return (await d.inner_text()).replace("\n", " | ") if await d.count() else None


async def run_names():
    """Extras show + The Interview + Heat movie+extras Feature / movie-first search."""
    E = "D:\\TV\\Extras\\"
    I = "D:\\Movies\\The Interview\\"
    lib = [
        c("e1", E + "Season 1\\Extras.S01E01.mkv", "Extras"),
        c("e2", E + "Season 1\\Extras.S01E02.mkv", "Extras"),
        c("e3", E + "Season 2\\Extras.S02E01.mkv", "Extras"),
        c("i1", I + "The Interview Part 1.mkv", "The Interview"),
        c("i2", I + "The Interview Part 2.mkv", "The Interview"),
        c("heat", "D:\\Movies\\Heat (1995)\\Heat (1995).mkv", "Heat", year=1995, parts=[
            {"file_path": "D:\\Movies\\Heat (1995)\\Heat (1995).mkv", "file_name": "Heat (1995).mkv"},
            {"file_path": "D:\\Movies\\Heat (1995)\\Extras\\Trailer.mkv", "file_name": "Trailer.mkv"}]),
    ]
    ctx, p, mock, errs = await open2(lib, base_scan(lib))
    try:
        print("TV count before:", await tv_count(p))
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("multipart btn:", await btn.inner_text() if await btn.count() else "MISSING")
        await btn.click()
        await p.wait_for_timeout(500)
        print("DIALOG:", await dialog_text(p))
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(400)
        await p.locator('[data-testid="qf-tv-shows"]').click()
        await p.wait_for_timeout(600)
        cards = await p.locator('div.cursor-pointer.overflow-hidden').all_inner_texts()
        print("TV filter cards:", [x.replace("\n", " ")[:40] for x in cards])
        await p.goto(URL)
        await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
        await p.wait_for_timeout(800)
        # Heat details
        await p.locator('div.cursor-pointer.overflow-hidden', has_text="Heat").first.click()
        await p.wait_for_timeout(800)
        pl = p.locator('[data-testid="parts-list"]')
        print("parts-list:", (await pl.inner_text()).replace("\n", " | ") if await pl.count() else "MISSING")
        print("feature section:", await p.locator('[data-testid="parts-section-feature"]').count(),
              "extras section:", await p.locator('[data-testid="parts-section-extras"]').count(),
              "parts section:", await p.locator('[data-testid="parts-section-parts"]').count())
        print("series-info-btn on Heat:", await p.locator('[data-testid="series-info-btn"]').count())
        await p.screenshot(path=".screenshots/heat_feature.jpg", quality=40, full_page=False)
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(400)
        mock.calls.clear()
        await p.locator('[data-testid="fetch-posters-btn"]').click()
        for _ in range(40):
            await p.wait_for_timeout(500)
            if any("Done" in t for t in await H.toasts(p)):
                break
        heat_calls = [x for x in mock.calls if "query=Heat" in x]
        print("Heat search calls in order:", heat_calls)
        print("toasts:", await H.toasts(p))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_batman_flip():
    lib = batman_lib(None)
    ctx, p, mock, errs = await open2(lib, base_scan(lib) + NEW, auto="on")
    try:
        await p.locator('[data-testid="update-library-btn"]').click()
        await p.wait_for_selector('[data-testid="multipart-suggest-dialog"]', timeout=15000)
        print("DIALOG:", await dialog_text(p))
        await p.wait_for_timeout(4000)  # let any auto-match run
        print("calls before merge:", mock.calls)
        L = await H.read_lib(p)
        print("pre-merge n1/n2:", {k: (L[k].get("tmdb_id"), L[k].get("media_type"), L[k].get("poster_path")) for k in ("n1", "n2") if k in L})
        await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
        await p.wait_for_timeout(3000)
        L = await H.read_lib(p)
        print("after merge:", summarize(L))
        b = L.get("bat") or {}
        print("bat parts:", [(x["file_name"], (x.get("episode") or {}).get("name")) for x in b.get("parts", [])])
        print("calls total:", mock.calls)
        print("toasts:", await H.toasts(p))
        # series toast + failed season keeps episodes
        await p.locator('div.cursor-pointer.overflow-hidden', has_text="Batman").first.click()
        await p.wait_for_timeout(800)
        await p.locator('[data-testid="series-info-btn"]').click()
        await p.wait_for_timeout(2500)
        print("series toasts:", [t for t in await H.toasts(p) if "episodes" in t or "parts" in t])
        mock.fail_season = True
        mock.calls.clear()
        await p.locator('[data-testid="series-info-btn"]').click()
        await p.wait_for_timeout(2500)
        print("fail calls:", mock.calls)
        print("fail toasts:", [t for t in await H.toasts(p) if "episodes" in t])
        L = await H.read_lib(p)
        print("bat parts after failed season:", [(x["file_name"], (x.get("episode") or {}).get("name")) for x in L["bat"].get("parts", [])])
        names = await p.locator('[data-testid^="part-episode-name-"]').all_inner_texts()
        print("UI episode names:", names)
        print("TV count:", await tv_count(p))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_lost():
    L0 = "D:\\TV\\Lost\\Season 1\\"
    lib = [{"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "D:\\Movies\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}]
    new = [{"id": "l1", "file_path": L0 + "Lost.S01E01.mkv", "file_name": "Lost.S01E01.mkv", "title": "Lost"},
           {"id": "l2", "file_path": L0 + "Lost.S01E02.mkv", "file_name": "Lost.S01E02.mkv", "title": "Lost"}]
    ctx, p, mock, errs = await open2(lib, base_scan(lib) + new, auto="on")
    try:
        await p.locator('[data-testid="update-library-btn"]').click()
        await p.wait_for_selector('[data-testid="multipart-suggest-dialog"]', timeout=15000)
        print("DIALOG:", await dialog_text(p))
        await p.wait_for_timeout(3000)
        print("calls before merge:", mock.calls)
        await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
        await p.wait_for_timeout(4000)
        print("calls after merge:", mock.calls)
        L = await H.read_lib(p)
        print("lib:", summarize(L))
        for k, m in L.items():
            if m.get("parts"):
                print(k, "parts:", [(x["file_name"], (x.get("episode") or {}).get("name")) for x in m["parts"]])
        print("toasts:", await H.toasts(p))
        print("TV count:", await tv_count(p))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_regression():
    """7 Batman cards extras at any depth -> 1 group; Green Planet; Escape / Not multi-part on auto dialog."""
    T = X.TV
    lib = [
        X.card("b1", "Season 1\\Batman.S01E01.mkv"), X.card("b2", "Season 1\\Batman.S01E02.mkv"),
        X.card("b3", "Extras\\Gag Reel.mkv"), X.card("b4", "Extras\\Interviews\\Batman Part 1.mkv"),
        X.card("b5", "Extras\\Interviews\\Batman Part 2.mkv"), X.card("b6", "Season 1\\Extras\\Batman.S01E01.Commentary.mkv"),
        X.card("b7", "Season 1\\Extras\\Promo.mkv"),
        c("g1", "D:\\Movies\\Green Planet Part 1.mkv", "Green Planet"), c("g2", "D:\\Movies\\Green Planet Part 2.mkv", "Green Planet"),
        c("g3", "D:\\Movies\\Green Planet Part 3.mkv", "Green Planet"),
    ]
    ctx, p, mock, errs = await open2(lib, base_scan(lib))
    try:
        print("btn:", await p.locator('[data-testid="multipart-suggest-btn"]').inner_text())
        await p.locator('[data-testid="multipart-suggest-btn"]').click()
        await p.wait_for_timeout(500)
        print("DIALOG:", await dialog_text(p))
        await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
        await p.wait_for_timeout(1500)
        L = await H.read_lib(p)
        print("after merge:", summarize(L))
        print("TV count:", await tv_count(p))
        mock.calls.clear()
        await p.locator('div.cursor-pointer.overflow-hidden', has_text="Batman").first.click()
        await p.wait_for_timeout(800)
        secs = await p.locator('[data-testid^="parts-section-toggle-"]').all_inner_texts()
        print("sections:", [s.replace("\n", " ") for s in secs])
        await p.locator('[data-testid="series-info-btn"]').click()
        await p.wait_for_timeout(2500)
        print("series calls:", mock.calls)
        print("series toasts:", [t for t in await H.toasts(p) if "episodes" in t or "parts" in t])
        print("TV count after series:", await tv_count(p))
        print("errors:", errs)
    finally:
        await ctx.close()
    # auto dialog Escape / Not multi-part
    lib = batman_lib("ov")
    for action in ("escape", "dismiss"):
        ctx, p, mock, errs = await open2(lib, base_scan(lib) + NEW, auto="off")
        try:
            await p.locator('[data-testid="update-library-btn"]').click()
            await p.wait_for_selector('[data-testid="multipart-suggest-dialog"]', timeout=15000)
            h = await p.locator('[data-testid="multipart-suggest-dialog"] h2').inner_text()
            if action == "escape":
                await p.keyboard.press("Escape")
            else:
                await p.locator('[data-testid="multipart-dismiss-btn"]').first.click()
            await p.wait_for_timeout(800)
            L = await H.read_lib(p)
            print(action, "heading:", h, "| dialog open:", await p.locator('[data-testid="multipart-suggest-dialog"]').count(),
                  "| ids:", sorted(L.keys()), "| btn:", await p.locator('[data-testid="multipart-suggest-btn"]').count(),
                  "| dismissed:", await p.evaluate("() => localStorage.getItem('obsidian_cinema_multipart_dismissed')"))
            print("errors:", errs)
        finally:
            await ctx.close()
