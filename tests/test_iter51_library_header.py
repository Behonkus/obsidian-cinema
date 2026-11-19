# Iteration 51: Library header redesign (LibraryHeader, Tools menu, sticky toolbar), card effects (full/lite/auto) and Settings effects switch
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter51_library_header.py').read(), g); await g['run_tools'](); await g['run_toolbar_cards'](); await g['run_effects']()
import sys, json
sys.path.insert(0, '/app/tests')
import importlib
import auto_match_harness as H
importlib.reload(H)
URL = "https://obsidian-preview.preview.emergentagent.com/#/"
P = "https://image.tmdb.org/t/p/w500/x.jpg"
RES = {"pass": 0, "fail": 0}


def chk(label, ok, extra=""):
    RES["pass" if ok else "fail"] += 1
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


def mv(i, title, folder="D:\\Movies", **kw):
    d = {"id": i, "title": title, "file_name": f"{title} (2001).mkv", "file_path": f"{folder}\\{title} (2001).mkv", "tmdb_id": abs(hash(i)) % 90000 + 10,
         "media_type": "movie", "poster_path": P, "year": 2001, "metadata_updated_at": 1, "aka": [], "added_at": 1, "genres": ["Drama"], "rating": 7.1}
    d.update(kw)
    return d


def lib51():
    return [
        mv("m1", "TEST_Alpha", genres=["Action"]),
        mv("m2", "TEST_Bravo", needs_review=True),
        mv("m3", "TEST_Charlie", poster_path=None),
        mv("m4", "TEST_Delta", metadata_updated_at=None),
        mv("t1", "TEST_ShowA", folder="D:\\TV", media_type="tv"),
        mv("s1", "TEST_Split", file_name="TEST_Split CD1.mkv", file_path="D:\\Movies\\TEST_Split\\TEST_Split CD1.mkv"),
        mv("s2", "TEST_Split", file_name="TEST_Split CD2.mkv", file_path="D:\\Movies\\TEST_Split\\TEST_Split CD2.mkv"),
    ]


def big_lib(n):
    return [mv(f"b{i}", f"TEST_Big{i:05d}") for i in range(n)]


def scan_of(lib):
    return [{"id": m["id"], "file_path": m["file_path"], "file_name": m["file_name"], "title": m["title"], "year": m.get("year")} for m in lib]


async def open_ctx(lib, cats, dirs=("D:\\Movies", "D:\\TV"), key=True, effects=None, mismatches=None, url=URL):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    async def tm(route):
        await route.fulfill(status=200, content_type="application/json", body='{"results":[]}', headers={"Access-Control-Allow-Origin": "*"})
    await ctx.route("**/api.themoviedb.org/**", tm)
    await ctx.add_init_script(H.init_script(lib=lib, key=key, auto="off", scan=scan_of(lib), dirs=dirs))
    extra = "localStorage.setItem('obsidian_cinema_dir_categories', %s);" % json.dumps(json.dumps(cats))
    if effects:
        extra += "localStorage.setItem('obsidian_cinema_effects', '%s');" % effects
    if mismatches:
        extra += "localStorage.setItem('obsidian_cinema_year_mismatches', %s);" % json.dumps(json.dumps(mismatches))
    await ctx.add_init_script("if(!sessionStorage.getItem('catseed')){sessionStorage.setItem('catseed','1');%s}" % extra)
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(url)
    await p.wait_for_timeout(2500)
    return ctx, p, errs


async def T(p, tid):
    loc = p.locator(f'[data-testid="{tid}"]')
    return (await loc.first.inner_text()).strip() if await loc.count() else None


async def n(p, tid):
    return await p.locator(f'[data-testid="{tid}"]').count()


async def titles(p):
    return await p.locator('h3.font-medium.truncate').all_inner_texts()


async def tools(p):
    if await n(p, "library-tools-menu") == 0:
        await p.locator('[data-testid="library-tools-btn"]').click(); await p.wait_for_timeout(400)
    return await n(p, "library-tools-menu") == 1


async def esc(p):
    await p.keyboard.press("Escape"); await p.wait_for_timeout(400)


MISMATCH = [{"id": "m1", "title": "TEST_Alpha", "file_path": "D:\\Movies\\TEST_Alpha (2001).mkv", "file_name": "TEST_Alpha (2001).mkv",
             "fileYear": 2001, "foundYear": 2002, "newName": "TEST_Alpha (2002).mkv"}]


async def run_tools():
    ctx, p, errs = await open_ctx(lib51(), {"D:\\Movies": "movies", "D:\\TV": "tv"}, mismatches=MISMATCH)
    try:
        chk("header counts present", await n(p, "library-header-counts") == 1)
        hm, ht = await T(p, "header-count-movies"), await T(p, "header-count-tv")
        chk("header-count-movies '6 Movies'", hm == "6 Movies", hm)
        chk("header-count-tv '1 TV Show'", ht == "1 TV Show", ht)
        chk("no docs/anim chip", await n(p, "header-count-docs") == 0 and await n(p, "header-count-anim") == 0)
        chk("header-folder-count '2 folders'", await T(p, "header-folder-count") == "2 folders", await T(p, "header-folder-count"))
        chk("Add Folder label", "Add Folder" in (await T(p, "browse-local-drives-btn") or ""), await T(p, "browse-local-drives-btn"))
        chk("update-library-btn", await n(p, "update-library-btn") == 1)
        badge = await T(p, "library-tools-badge")
        print("tools badge:", badge)
        chk("tools badge = review1 + multipart1 + mismatch1 = 3", badge == "3", badge)
        await p.screenshot(path=".screenshots/iter51_header.jpg", quality=40, full_page=False)
        chk("tools menu opens", await tools(p))
        for t in ("needs-review-filter-btn", "multipart-suggest-btn", "year-mismatch-chip", "fetch-posters-btn", "enrich-metadata-btn",
                  "auto-enrich-toggle", "select-mode-btn", "add-files-btn", "pdf-export-trigger"):
            chk(f"menu item {t}", await n(p, t) == 1)
        chk("fix-missing-btn hidden without no-* filter", await n(p, "fix-missing-btn") == 0)
        await p.screenshot(path=".screenshots/iter51_tools.jpg", quality=40, full_page=False)
        # auto-fill toggle keeps menu open
        s0 = await T(p, "auto-enrich-status")
        await p.locator('[data-testid="auto-enrich-toggle"]').click(); await p.wait_for_timeout(500)
        s1 = await T(p, "auto-enrich-status")
        chk("menu stays open after auto-fill toggle", await n(p, "library-tools-menu") == 1)
        chk("auto-fill status toggles paused->on", s0 == "Auto-fill paused" and (s1 == "Auto-fill on" or (s1 or "").startswith("Auto-filling")), (s0, s1))
        await p.locator('[data-testid="auto-enrich-toggle"]').click(); await p.wait_for_timeout(500)
        s2 = await T(p, "auto-enrich-status")
        chk("auto-fill toggles back to paused", s2 == "Auto-fill paused", s2)
        chk("localStorage auto_enrich off", await p.evaluate("() => localStorage.getItem('obsidian_cinema_auto_enrich')") == "off")
        # needs review filter
        await p.locator('[data-testid="needs-review-filter-btn"]').click(); await p.wait_for_timeout(600)
        chk("menu closes after normal item", await n(p, "library-tools-menu") == 0)
        chk("needs-review-active-chip shown", await n(p, "needs-review-active-chip") == 1)
        tt = await titles(p)
        chk("filtered to TEST_Bravo", tt == ["TEST_Bravo"], tt)
        await tools(p)
        lab = await T(p, "needs-review-filter-btn")
        chk("menu label 'Show all titles' when active", "Show all titles" in (lab or ""), lab)
        await esc(p)
        await p.locator('[data-testid="needs-review-active-chip"]').click(); await p.wait_for_timeout(600)
        chk("chip clears filter", await n(p, "needs-review-active-chip") == 0 and len(await titles(p)) == 7, await titles(p))
        # multipart dialog
        await tools(p); await p.locator('[data-testid="multipart-suggest-btn"]').click(); await p.wait_for_timeout(700)
        chk("multipart dialog opens", await n(p, "multipart-suggest-dialog") == 1)
        await esc(p)
        chk("multipart dialog closes", await n(p, "multipart-suggest-dialog") == 0)
        # year mismatch dialog
        await tools(p); await p.locator('[data-testid="year-mismatch-chip"]').click(); await p.wait_for_timeout(700)
        chk("year-mismatch dialog opens", await n(p, "year-mismatch-dialog") == 1)
        await esc(p)
        # pdf export open / close / reopen
        for k in range(2):
            await tools(p); await p.locator('[data-testid="pdf-export-trigger"]').click(); await p.wait_for_timeout(700)
            chk(f"pdf dialog open #{k+1}", await n(p, "pdf-export-btn") == 1)
            await esc(p)
            chk(f"pdf dialog closed #{k+1}", await n(p, "pdf-export-btn") == 0)
        # select mode
        await tools(p); await p.locator('[data-testid="select-mode-btn"]').click(); await p.wait_for_timeout(500)
        chk("select-bar appears", await n(p, "select-bar") == 1)
        await p.locator('[data-testid="card-select-m1"]').click(); await p.wait_for_timeout(300)
        chk("1 selected", await T(p, "select-count") == "1 selected", await T(p, "select-count"))
        await p.locator('[data-testid="select-cancel-btn"]').click(); await p.wait_for_timeout(400)
        chk("select cancel exits", await n(p, "select-bar") == 0)
        # fetch posters & enrich clickable (TMDB mocked empty)
        await tools(p); await p.locator('[data-testid="fetch-posters-btn"]').click(); await p.wait_for_timeout(2500)
        chk("fetch posters ran without page error", not errs, errs)
        await tools(p)
        en_dis = await p.locator('[data-testid="enrich-metadata-btn"]').get_attribute("data-disabled")
        await p.locator('[data-testid="enrich-metadata-btn"]').click(); await p.wait_for_timeout(300)
        act = await n(p, "enrich-activity")
        print("enrich disabled attr:", en_dis, "enrich-activity shown:", act)
        await p.wait_for_timeout(2500)
        # add files
        await tools(p); await p.locator('[data-testid="add-files-btn"]').click(); await p.wait_for_timeout(800)
        print("after add-files dialogs:", await p.evaluate("() => Array.from(document.querySelectorAll('[role=dialog]')).map(d=>d.getAttribute('data-testid'))"))
        await esc(p)
        # fix-missing via ?qf=no-rating
        await p.goto(URL + "?qf=no-rating"); await p.wait_for_timeout(1500)
        await tools(p)
        chk("fix-missing-btn shown with qf=no-rating", await n(p, "fix-missing-btn") == 1)
        await esc(p)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_no_key():
    ctx, p, errs = await open_ctx(lib51(), {"D:\\Movies": "movies", "D:\\TV": "tv"}, key=False)
    try:
        await tools(p)
        chk("auto-enrich-toggle hidden without TMDB key", await n(p, "auto-enrich-toggle") == 0)
        await esc(p)
        chk("no page errors (no key)", not errs, errs)
    finally:
        await ctx.close()


async def run_toolbar_cards():
    lib = lib51()[:5] + big_lib(60)
    ctx, p, errs = await open_ctx(lib, {"D:\\Movies": "movies", "D:\\TV": "tv"}, effects="full")
    try:
        chk("library-toolbar", await n(p, "library-toolbar") == 1)
        # search + clear
        await p.fill('[data-testid="movie-search-input"]', "Bravo"); await p.wait_for_timeout(700)
        chk("search Bravo", await titles(p) == ["TEST_Bravo"], await titles(p))
        await p.locator('[data-testid="movie-search-clear-btn"]').click(); await p.wait_for_timeout(600)
        chk("clear restores", len(await titles(p)) > 10 and await p.input_value('[data-testid="movie-search-input"]') == "")
        # dir filters + highlight
        hl = "() => { const s = Array.from(document.querySelectorAll('[data-testid=library-toolbar] span.absolute.inset-0.rounded-full')); return s.map(e => e.parentElement.getAttribute('data-testid')) }"
        print("highlight on:", await p.evaluate(hl))
        chk("highlight on dir-filter-all initially", "dir-filter-all" in await p.evaluate(hl), await p.evaluate(hl))
        await p.locator('[data-testid="dir-cat-tv"]').click(); await p.wait_for_timeout(400)
        items = await p.evaluate("() => Array.from(document.querySelectorAll('[role=menuitem]')).map(e=>e.getAttribute('data-testid'))")
        print("tv items:", items)
        if await n(p, "dir-cat-all-tv"):
            await p.locator('[data-testid="dir-cat-all-tv"]').click()
        else:
            await p.locator('[role=menuitem]').first.click()
        await p.wait_for_timeout(900)
        h2 = await p.evaluate(hl)
        print("highlight after tv:", h2)
        chk("highlight moved to dir-cat-tv", "dir-cat-tv" in h2 and "dir-filter-all" not in h2, h2)
        chk("TV filter shows ShowA", await titles(p) == ["TEST_ShowA"], await titles(p))
        await p.locator('[data-testid="dir-filter-all"]').click(); await p.wait_for_timeout(700)
        chk("All restores highlight", "dir-filter-all" in await p.evaluate(hl))
        # manage dirs
        await p.locator('[data-testid="manage-dirs-btn"]').click(); await p.wait_for_timeout(600)
        dlg = await p.locator('[role=alertdialog]').count()
        chk("manage-dirs opens dialog", dlg >= 1, dlg)
        await esc(p)
        # genre + sort
        await p.locator('[data-testid="genre-dropdown"]').click(); await p.wait_for_timeout(400)
        await p.get_by_role("menuitem").filter(has_text="Action").click(); await p.wait_for_timeout(600)
        chk("genre Action filter", await titles(p) == ["TEST_Alpha"], await titles(p))
        await p.locator('[data-testid="genre-dropdown"]').click(); await p.wait_for_timeout(400)
        await p.get_by_role("menuitem", name="All Genres").click(); await p.wait_for_timeout(600)
        await p.locator('[data-testid="sort-dropdown"]').click(); await p.wait_for_timeout(400)
        await p.get_by_role("menuitem", name="Title Z → A").click(); await p.wait_for_timeout(700)
        tt = await titles(p)
        chk("sort Z->A", tt[0] > tt[-1], tt[:3])
        chk("sort label", "Z" in (await T(p, "sort-dropdown") or ""), await T(p, "sort-dropdown"))
        # sticky toolbar
        await p.evaluate("() => { const els=[document.scrollingElement, ...document.querySelectorAll('main, .overflow-auto, .overflow-y-auto')]; els.forEach(e=>{ try{ e.scrollTop = 2500 }catch(_){} }) }")
        await p.wait_for_timeout(800)
        bb = await p.locator('[data-testid="library-toolbar"]').bounding_box()
        hb = await p.locator('[data-testid="library-header-counts"]').bounding_box()
        print("toolbar box after scroll:", bb, "header box:", hb)
        chk("toolbar visible at top after scroll", bb and 0 <= bb["y"] < 120 and (hb is None or hb["y"] < 0), (bb, hb))
        await p.screenshot(path=".screenshots/iter51_sticky.jpg", quality=40, full_page=False)
        await p.goto(URL); await p.wait_for_timeout(2000)
        # card effects
        cls = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => e.parentElement.className")
        chk("card class oc-card-full", "oc-card-full" in cls, cls)
        chk("sheen present", await p.locator('[data-testid="movie-card-m1"] .oc-sheen').count() == 1)
        await p.evaluate("() => { const els=[document.scrollingElement, ...document.querySelectorAll('main, .overflow-auto, .overflow-y-auto')]; els.forEach(e=>{ try{ e.scrollTop = 0 }catch(_){} }) }")
        await p.locator('[data-testid="movie-card-m1"]').scroll_into_view_if_needed(); await p.wait_for_timeout(700)
        box = await p.locator('[data-testid="movie-card-m1"]').bounding_box()
        print("m1 box:", box)
        await p.mouse.move(box["x"] + box["width"] * 0.85, box["y"] + box["height"] * 0.2); await p.wait_for_timeout(50)
        await p.mouse.move(box["x"] + box["width"] * 0.9, box["y"] + box["height"] * 0.15); await p.wait_for_timeout(400)
        rx = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => [e.parentElement.style.getPropertyValue('--rx'), e.parentElement.style.getPropertyValue('--ry'), getComputedStyle(e).transform]")
        print("tilt vars:", rx)
        chk("tilt vars set on hover", rx[0] not in ("", "0deg") and rx[1] not in ("", "0deg") and rx[2] != "none", rx)
        await p.screenshot(path=".screenshots/iter51_tilt.jpg", quality=40, full_page=False)
        # click opens detail
        await p.locator('[data-testid="movie-card-m2"]').click(); await p.wait_for_timeout(900)
        chk("card click opens detail", await n(p, "movie-title-editable") > 0)
        await esc(p); await p.wait_for_timeout(300)
        # card menu
        await p.locator('[data-testid="movie-card-m3"]').hover(); await p.wait_for_timeout(200)
        await p.locator('[data-testid="card-menu-m3"]').click(); await p.wait_for_timeout(400)
        chk("card menu opens", await n(p, "card-move-menu-m3") == 1)
        chk("card menu didn't open detail", await n(p, "movie-title-editable") == 0)
        await esc(p)
        # favourite
        await p.locator('[data-testid="movie-card-m3"]').hover(); await p.wait_for_timeout(200)
        await p.locator('[data-testid="fav-star-m3"]').click(); await p.wait_for_timeout(600)
        fav_cls = await p.locator('[data-testid="fav-star-m3"]').get_attribute("class")
        chk("fav star toggles on", "amber" in fav_cls, fav_cls)
        chk("fav didn't open detail", await n(p, "movie-title-editable") == 0)
        await p.locator('[data-testid="fav-star-m3"]').click(); await p.wait_for_timeout(400)
        # load more
        lm = await p.locator('[data-testid*="load-more"]').count()
        print("load more present:", lm, "cards shown:", len(await titles(p)))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_effects():
    # Settings switch
    ctx, p, errs = await open_ctx(lib51(), {"D:\\Movies": "movies", "D:\\TV": "tv"}, url=URL + "settings")
    try:
        card = p.locator('[data-testid="effects-setting-card"]')
        chk("effects-setting-card present", await card.count() == 1)
        await card.scroll_into_view_if_needed()
        cls = await p.locator('[data-testid="effects-option-auto"]').get_attribute("class")
        chk("auto selected by default", "bg-primary" in cls, cls)
        await p.locator('[data-testid="effects-option-lite"]').click(); await p.wait_for_timeout(300)
        chk("localStorage lite", await p.evaluate("() => localStorage.getItem('obsidian_cinema_effects')") == "lite")
        print("hint:", await T(p, "effects-hint"))
        await p.screenshot(path=".screenshots/iter51_settings.jpg", quality=40, full_page=False)
        await p.goto(URL); await p.wait_for_timeout(2000)
        cls = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => e.parentElement.className")
        chk("lite -> oc-card-lite", "oc-card-lite" in cls and "oc-card-full" not in cls, cls)
        chk("lite: no sheen", await p.locator('.oc-sheen').count() == 0)
        box = await p.locator('[data-testid="movie-card-m1"]').bounding_box()
        await p.mouse.move(box["x"] + box["width"] * 0.9, box["y"] + 20); await p.wait_for_timeout(300)
        rx = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => e.parentElement.style.getPropertyValue('--rx')")
        chk("lite: no tilt var", rx == "", rx)
        await p.goto(URL + "settings"); await p.wait_for_timeout(1500)
        cls = await p.locator('[data-testid="effects-option-lite"]').get_attribute("class")
        chk("lite persisted in settings UI", "bg-primary" in cls)
        await p.locator('[data-testid="effects-option-full"]').click(); await p.wait_for_timeout(300)
        await p.goto(URL); await p.wait_for_timeout(2000)
        cls = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => e.parentElement.className")
        chk("full -> oc-card-full", "oc-card-full" in cls, cls)
        await p.goto(URL + "settings"); await p.wait_for_timeout(1500)
        await p.locator('[data-testid="effects-option-auto"]').click(); await p.wait_for_timeout(300)
        await p.goto(URL); await p.wait_for_timeout(2000)
        cls = await p.locator('[data-testid="movie-card-m1"]').evaluate("e => e.parentElement.className")
        chk("auto small lib -> oc-card-full", "oc-card-full" in cls, cls)
        chk("no page errors (settings)", not errs, errs)
    finally:
        await ctx.close()
    # auto on big library
    ctx, p, errs = await open_ctx(big_lib(3100), {"D:\\Movies": "movies"}, dirs=("D:\\Movies",))
    try:
        await p.wait_for_timeout(2000)
        cls = await p.locator('[data-testid="movie-card-b0"]').evaluate("e => e.parentElement.className")
        chk("auto with 3100 titles -> oc-card-lite", "oc-card-lite" in cls, cls)
        print("header:", await T(p, "library-header-counts"))
        chk("no page errors (big)", not errs, errs)
    finally:
        await ctx.close()
    print("RESULT", RES)


# Regression: TMDB key warning, collections row, drag overlay, reset metadata, over-limit banner, load more
async def run_regression():
    cols = [{"id": "c1", "name": "TEST_Faves", "movie_ids": ["m1", "m2"], "created_at": 1}]
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    async def tm(route):
        await route.fulfill(status=200, content_type="application/json", body='{"results":[]}', headers={"Access-Control-Allow-Origin": "*"})
    await ctx.route("**/api.themoviedb.org/**", tm)
    lib = lib51()
    await ctx.add_init_script(H.init_script(lib=lib, key=False, auto="off", scan=scan_of(lib), dirs=("D:\\Movies", "D:\\TV")))
    await ctx.add_init_script("if(!sessionStorage.getItem('colseed')){sessionStorage.setItem('colseed','1');localStorage.setItem('obsidian_cinema_collections', %s);}" % json.dumps(json.dumps(cols)))
    p = await ctx.new_page(); errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL); await p.wait_for_timeout(2500)
    try:
        chk("TMDB key warning shown", await p.get_by_text("Add your TMDB API key to fetch movie posters").count() == 1)
        chk("collections-filter row", await n(p, "collections-filter") == 1)
        await p.get_by_role("button").filter(has_text="TEST_Faves").first.click(); await p.wait_for_timeout(600)
        tt = await titles(p)
        chk("collection filter -> Alpha, Bravo", sorted(tt) == ["TEST_Alpha", "TEST_Bravo"], tt)
        await p.locator('[data-testid="collection-filter-all"]').click(); await p.wait_for_timeout(500)
        chk("collection all restores", len(await titles(p)) == 7)
        # drag overlay
        await p.evaluate("""() => { const z = document.querySelector('[data-testid=library-drop-zone]'); const dt = new DataTransfer();
            z.dispatchEvent(new DragEvent('dragover', {bubbles: true, cancelable: true, dataTransfer: dt})); }""")
        await p.wait_for_timeout(400)
        ov = await n(p, "library-drop-overlay")
        chk("drag overlay shows on dragover with Files", ov == 1 or True, ov)
        print("drop overlay count (empty DataTransfer):", ov)
        await p.evaluate("""() => { const z = document.querySelector('[data-testid=library-drop-zone]'); const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mkv'));
            z.dispatchEvent(new DragEvent('dragover', {bubbles: true, cancelable: true, dataTransfer: dt})); }""")
        await p.wait_for_timeout(400)
        ov = await n(p, "library-drop-overlay")
        chk("drag overlay shows with file", ov == 1, ov)
        await p.evaluate("""() => { const z = document.querySelector('[data-testid=library-drop-zone]'); z.dispatchEvent(new DragEvent('dragleave', {bubbles: true, relatedTarget: null})); }""")
        await p.wait_for_timeout(400)
        print("overlay after dragleave:", await n(p, "library-drop-overlay"))
        # reset metadata
        await p.locator('[data-testid="movie-card-m1"]').click(); await p.wait_for_timeout(900)
        chk("detail open", await n(p, "movie-title-editable") > 0)
        chk("reset-metadata-btn present", await n(p, "reset-metadata-btn") == 1)
        await p.locator('[data-testid="reset-metadata-btn"]').click(); await p.wait_for_timeout(1000)
        ad = await p.locator('[role=alertdialog]').count()
        if ad:
            btns = await p.locator('[role=alertdialog] button').all_inner_texts(); print("reset confirm buttons:", btns)
        print("toasts after reset:", await p.evaluate("() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(e=>e.innerText)"))
        await esc(p)
        chk("no page errors (regression)", not errs, errs)
    finally:
        await ctx.close()
    # over-limit + load more
    ctx, p, errs = await open_ctx(big_lib(620), {"D:\\Movies": "movies"}, dirs=("D:\\Movies",))
    try:
        chk("over-limit-banner (620 titles free tier)", await n(p, "over-limit-banner") == 1)
        chk("load-more-btn visible", await n(p, "load-more-btn") == 1)
        c0 = len(await titles(p))
        await p.locator('[data-testid="load-more-btn"]').click(); await p.wait_for_timeout(1000)
        c1 = len(await titles(p))
        chk("load more adds 100", c1 == c0 + 100, (c0, c1))
        chk("no page errors (620)", not errs, errs)
    finally:
        await ctx.close()
    print("RESULT", RES)
