# Iteration 34: year folders as seasons + unorganized show folders merged as root (TV / Docs / Anim dirs, not Movies)
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter34_year_seasons.py').read(), g); await g['run_suggest']() / run_scan() / run_single_root() / run_edges()
exec(open('/app/tests/test_iter32_multipart.py').read(), globals())

DIRS = ("D:\\TV", "D:\\Docs", "D:\\Anim", "D:\\Movies", "D:\\TV2\\Breaking Bad")
CATS = {"D:\\TV": "tv", "D:\\Docs": "docs", "D:\\Anim": "anim", "D:\\Movies": "movies", "D:\\TV2\\Breaking Bad": "tv"}


def cats_script(cats):
    return "(() => { if (!sessionStorage.getItem('catsSet')) { sessionStorage.setItem('catsSet','1'); localStorage.setItem('obsidian_cinema_dir_categories', %s); } })();" % json.dumps(json.dumps(cats))


async def open3(lib, scan, auto="off", cats=CATS, dirs=DIRS, url=None):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = Mock2(delay=0.2)
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    await ctx.add_init_script(H.init_script(lib=lib, key=True, auto=auto, scan=scan, dirs=dirs))
    await ctx.add_init_script(cats_script(cats))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(url or URL)
    if not url:
        await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
    await p.wait_for_timeout(1200)
    return ctx, p, mock, errs


DS = "D:\\TV\\The Daily Show\\"
RS = "D:\\TV\\Random Show\\"
LIB = [
    c("ds1", DS + "2019\\03 - Guest One.mkv", "Guest One"),
    c("ds2", DS + "2019\\05 - Guest Two.mkv", "Guest Two"),
    c("ds3", DS + "2020\\01 - New Year.mkv", "New Year"),
    c("rs1", RS + "Disc A\\pilot.mkv", "pilot"),
    c("rs2", RS + "Disc B\\finale.mkv", "finale"),
    c("rs3", RS + "bonus.mkv", "bonus"),
    c("pe1", "D:\\Docs\\Planet Earth\\Planet Earth Ep 1.mkv", "Planet Earth"),
    c("pe2", "D:\\Docs\\Planet Earth\\Planet Earth Ep 2.mkv", "Planet Earth"),
    c("fa", "D:\\Docs\\Collection\\Film A (2001).mkv", "Film A", year=2001),
    c("fb", "D:\\Docs\\Collection\\Film B (2005).mkv", "Film B", year=2005),
    c("ts", "D:\\Anim\\Toy Story\\Toy Story (1995).mkv", "Toy Story", year=1995),
    c("tsx", "D:\\Anim\\Toy Story\\Extras\\Making Of.mkv", "Making Of"),
    c("ma", "D:\\Movies\\2019\\Movie A (2019).mkv", "Movie A", year=2019),
    c("mb", "D:\\Movies\\2019\\Movie B (2019).mkv", "Movie B", year=2019),
    c("bb1", "D:\\TV2\\Breaking Bad\\Season 1\\Breaking Bad S01E01.mkv", "Breaking Bad"),
    c("bb2", "D:\\TV2\\Breaking Bad\\Season 2\\Breaking Bad S02E01.mkv", "Breaking Bad"),
    c("bb3", "D:\\TV2\\Breaking Bad\\2019\\El Camino.mkv", "El Camino"),
]


async def groups_text(p):
    return await p.evaluate("""() => Array.from(document.querySelectorAll('[data-testid^="multipart-group-"]')).filter(e => e.getAttribute('data-testid') !== 'multipart-group-checkbox').map(e => e.getAttribute('data-testid') + ' => ' + e.innerText.replace(/\\n/g,' | '))""")


async def open_card(p, title):
    await p.locator('div.cursor-pointer.overflow-hidden', has_text=title).first.click()
    await p.wait_for_timeout(700)
    secs = await p.locator('[data-testid^="parts-section-toggle-"]').all_inner_texts()
    # open all sections
    for t in await p.locator('[data-testid^="parts-section-toggle-"]').all():
        txt = await t.inner_text()
        if txt.split("\n")[0] != (secs[0].split("\n")[0] if secs else None):
            await t.click()
    await p.wait_for_timeout(300)
    rows = await p.locator('[data-testid="parts-list"]').inner_text() if await p.locator('[data-testid="parts-list"]').count() else None
    await p.keyboard.press("Escape")
    await p.wait_for_timeout(400)
    return [s.replace("\n", " ") for s in secs], (rows or "").replace("\n", " | ")


async def run_suggest():
    ctx, p, mock, errs = await open3(LIB, base_scan(LIB))
    try:
        print("TV count before:", await tv_count(p))
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("btn:", await btn.inner_text() if await btn.count() else "MISSING")
        await btn.click()
        await p.wait_for_timeout(500)
        for g in await groups_text(p):
            print("GROUP:", g)
        await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
        await p.wait_for_timeout(1200)
        L = await H.read_lib(p)
        print("cards after merge:", len(L))
        for k, m in L.items():
            print("  CARD", k, m.get("title"), "parts=", [pp["file_name"] for pp in (m.get("parts") or [])])
        print("TV count after:", await tv_count(p))
        await p.screenshot(path=".screenshots/iter34_after_merge.jpg", quality=40, full_page=False)
        for t in ["The Daily Show", "Random Show", "Breaking Bad", "Planet Earth", "Toy Story"]:
            try:
                print("DETAIL", t, await open_card(p, t))
            except Exception as e:
                print("DETAIL FAIL", t, e)
        # TV Shows filter
        await p.locator('[data-testid="qf-tv-shows"]').click()
        await p.wait_for_timeout(800)
        names = await p.locator('div.cursor-pointer.overflow-hidden').all_inner_texts()
        print("TV filter cards:", [n.split("\n")[0:2] for n in names])
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_scan():
    """Existing library has nothing for these shows; Update Library finds new files -> auto dialog."""
    base = [{"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "D:\\Movies\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}]
    new = [{"id": "n%d" % i, "file_path": m["file_path"], "file_name": m["file_name"], "title": m["title"]} for i, m in enumerate(LIB[:6])]
    ctx, p, mock, errs = await open3(base, base_scan(base) + new, auto="off")
    try:
        await p.locator('[data-testid="update-library-btn"]').click()
        await p.wait_for_timeout(4000)
        print("toasts:", await H.toasts(p))
        d = p.locator('[data-testid="multipart-suggest-dialog"]')
        print("auto dialog:", await d.count())
        if await d.count():
            for g in await groups_text(p):
                print("AUTO GROUP:", g)
            await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(1200)
        L = await H.read_lib(p)
        for k, m in L.items():
            print("  CARD", k, m.get("title"), "parts=", [pp["file_name"] for pp in (m.get("parts") or [])])
        print("TV count:", await tv_count(p))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_edges():
    """Edge probes: show literally named a year (1883), show named 'Extras', loose files in single-show root."""
    lib = [
        c("y1", "D:\\TV\\1883\\Season 1\\1883.S01E01.mkv", "1883"),
        c("y2", "D:\\TV\\1883\\Season 1\\1883.S01E02.mkv", "1883"),
        c("x1", "D:\\TV\\Extras\\Season 1\\Extras.S01E01.mkv", "Extras"),
        c("x2", "D:\\TV\\Extras\\Season 2\\Extras.S02E01.mkv", "Extras"),
        c("o1", "D:\\TV\\Other\\Season 1\\Other S01E01.mkv", "Other"),
        c("bbl", "D:\\TV2\\Breaking Bad\\Breaking Bad S03E01.mkv", "Breaking Bad"),
        c("bb1", "D:\\TV2\\Breaking Bad\\Season 1\\Breaking Bad S01E01.mkv", "Breaking Bad"),
    ]
    ctx, p, mock, errs = await open3(lib, base_scan(lib))
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("btn:", await btn.inner_text() if await btn.count() else "MISSING")
        if await btn.count():
            await btn.click()
            await p.wait_for_timeout(500)
            for g in await groups_text(p):
                print("EDGE GROUP:", g)
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_stats_other_page():
    """Sidebar TV count when the app is opened on a non-library route (showRoots not yet set)."""
    ctx, p, mock, errs = await open3(LIB, base_scan(LIB), url=URL + "settings")
    try:
        print("TV count on /settings first load:", await tv_count(p))
        await p.goto(URL)
        await p.wait_for_timeout(1500)
        print("TV count on library:", await tv_count(p))
    finally:
        await ctx.close()


async def run_regress_tv_cat():
    """Regression inside a 'tv' category dir: Season N, Specials, Extras deep, S07E12E13 double ep; Part 1/2 in Movies."""
    S = "D:\\TV\\Show\\"
    lib = [
        c("a1", S + "Season 7\\Show.S07E12E13.mkv", "Show"),
        c("a2", S + "Season 7\\Show.S07E14.mkv", "Show"),
        c("a3", S + "Specials\\Show.S00E01.mkv", "Show"),
        c("a4", S + "Season 7\\Extras\\Deleted\\Scene.mkv", "Scene"),
        c("p1", "D:\\Movies\\Dune\\Dune Part 1.mkv", "Dune"),
        c("p2", "D:\\Movies\\Dune\\Dune Part 2.mkv", "Dune"),
    ]
    ctx, p, mock, errs = await open3(lib, base_scan(lib))
    try:
        await p.locator('[data-testid="multipart-suggest-btn"]').click()
        await p.wait_for_timeout(500)
        for x in await groups_text(p):
            print("REG GROUP:", x)
        await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
        await p.wait_for_timeout(1200)
        print("DETAIL Show", await open_card(p, "Show"))
        print("DETAIL Dune", await open_card(p, "Dune"))
        print("TV count:", await tv_count(p), "errors:", errs)
    finally:
        await ctx.close()


async def run_dir_categories():
    import dir_categories_harness as D
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    await ctx.add_init_script(D.init_script({"D:\\Movies": "movies", "D:\\TV": "tv", "D:\\TVShows": "tv", "D:\\Docs": "docs"}))
    await ctx.add_init_script("localStorage.setItem('obsidian_cinema_eula_accepted','%s'); localStorage.setItem('obsidian_cinema_last_seen_version','%s');" % (H.VERSION, H.VERSION))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    try:
        await p.goto(URL)
        await p.wait_for_timeout(3500)
        print("TV count:", await tv_count(p))
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("multipart btn:", await btn.inner_text() if await btn.count() else "none")
        cards = await p.locator('div.cursor-pointer.overflow-hidden').count()
        print("cards:", cards, "errors:", errs)
    finally:
        await ctx.close()
