# Iteration 50: per-title "Move to" category (card menu + multi-select), category_override persistence, header per-category counts, Stats TypeStats
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter50_move_category.py').read(), g); await g['run_main']() / run_select() / run_no_tv_folder()
import sys, json
sys.path.insert(0, '/app/tests')
import importlib
import auto_match_harness as H
importlib.reload(H)
URL = "https://obsidian-preview.preview.emergentagent.com/#/"
P = "https://image.tmdb.org/t/p/w500/x.jpg"


def chk(label, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


def mv(i, title, folder="D:\\Movies", **kw):
    d = {"id": i, "title": title, "file_name": f"{title}.mkv", "file_path": f"{folder}\\{title}.mkv", "tmdb_id": abs(hash(i)) % 90000 + 10,
         "media_type": "movie", "poster_path": P, "year": 2001, "metadata_updated_at": 1, "aka": [], "added_at": 1}
    d.update(kw)
    return d


def lib50():
    parts = [{"file_path": "D:\\Movies\\TEST_Multi\\TEST_Multi CD1.mkv", "file_name": "TEST_Multi CD1.mkv"},
             {"file_path": "D:\\Movies\\TEST_Multi\\TEST_Multi CD2.mkv", "file_name": "TEST_Multi CD2.mkv"}]
    return [
        mv("m1", "TEST_MovieA"), mv("m2", "TEST_MovieB"), mv("m3", "TEST_MovieC"), mv("m4", "TEST_MovieD"),
        mv("t1", "TEST_ShowA", folder="D:\\TV", media_type="tv"),
        mv("mp1", "TEST_Multi", file_path=parts[0]["file_path"], file_name=parts[0]["file_name"], parts=parts),
    ]


def scan_of(lib):
    out = []
    for m in lib:
        for p in (m.get("parts") or [{"file_path": m["file_path"], "file_name": m["file_name"]}]):
            out.append({"id": m["id"] + p["file_name"], "file_path": p["file_path"], "file_name": p["file_name"], "title": m["title"], "year": m.get("year")})
    return out


async def open_ctx(lib, cats, dirs=("D:\\Movies", "D:\\TV")):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    async def tm(route):
        await route.fulfill(status=200, content_type="application/json", body='{"results":[]}', headers={"Access-Control-Allow-Origin": "*"})
    await ctx.route("**/api.themoviedb.org/**", tm)
    await ctx.add_init_script(H.init_script(lib=lib, key=False, auto="off", scan=scan_of(lib), dirs=dirs))
    await ctx.add_init_script("if(!sessionStorage.getItem('catseed')){sessionStorage.setItem('catseed','1');localStorage.setItem('obsidian_cinema_dir_categories', %s);}" % json.dumps(json.dumps(cats)))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL)
    await p.wait_for_timeout(2500)
    return ctx, p, errs


async def T(p, tid):
    loc = p.locator(f'[data-testid="{tid}"]')
    return (await loc.inner_text()).strip() if await loc.count() else None


async def header(p):
    # iter51: header is now chips; rebuild old "A · B · N folders" text
    chips = await p.locator('[data-testid^="header-count-"]').all_inner_texts()
    f = await T(p, "header-folder-count")
    f = f.replace(" folder", " folders") if f and f.endswith(" folder") else f
    return " · ".join([c.strip() for c in chips] + ([f] if f else []))


async def open_select(p):
    # iter51: select-mode-btn moved into the Tools menu
    if await p.locator('[data-testid="select-bar"]').count():
        return
    await p.locator('[data-testid="library-tools-btn"]').click(); await p.wait_for_timeout(400)
    await p.locator('[data-testid="select-mode-btn"]').click(); await p.wait_for_timeout(400)


async def titles(p):
    return await p.locator('h3.font-medium.truncate').all_inner_texts()


async def toasts(p):
    return await p.evaluate("() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(e => e.innerText.replace(/\\n/g, ' '))")


async def badge(p, cat):
    return await p.evaluate("(c) => { const b = document.querySelector(`[data-testid=dir-cat-${c}] .h-4`); return b ? b.innerText : null }", cat)


async def lib_store(p):
    return {m["id"]: m for m in await p.evaluate("() => JSON.parse(sessionStorage.getItem('fakeLibFile') || '[]')")}


async def open_card_menu(p, cid):
    await p.locator(f'[data-testid="movie-card-{cid}"]').hover()
    await p.wait_for_timeout(200)
    await p.locator(f'[data-testid="card-menu-{cid}"]').click()
    await p.wait_for_timeout(400)
    return await p.locator(f'[data-testid="card-move-menu-{cid}"]').count() == 1


async def detail_open(p):
    return await p.locator('[data-testid="movie-title-editable"]').count() > 0


async def pick_cat(p, cat, item):
    await p.locator(f'[data-testid="dir-cat-{cat}"]').click(); await p.wait_for_timeout(400)
    loc = p.locator(f'[data-testid="{item}"]')
    if await loc.count() == 0:
        await p.keyboard.press("Escape"); return False
    await loc.click(); await p.wait_for_timeout(700)
    return True


async def run_main():
    ctx, p, errs = await open_ctx(lib50(), {"D:\\Movies": "movies", "D:\\TV": "tv"})
    try:
        h = await header(p); print("header:", h)
        chk("header '5 Movies · 1 TV Show · 2 folders'", h == "5 Movies · 1 TV Show · 2 folders", h)
        chk("no docs/anim header counts", await p.locator('[data-testid="header-count-docs"]').count() == 0 and await p.locator('[data-testid="header-count-anim"]').count() == 0)
        chk("badges movies 5 tv 1", (await badge(p, "movies"), await badge(p, "tv")) == ("5", "1"), (await badge(p, "movies"), await badge(p, "tv")))
        # card menu
        ok = await open_card_menu(p, "m1")
        chk("card-move-menu opens", ok)
        chk("menu opening did not open detail", not await detail_open(p))
        dis = await p.locator('[data-testid="card-move-movies-m1"]').get_attribute("data-disabled")
        chk("current category Movies disabled", dis is not None, dis)
        chk("no reset item on non-overridden", await p.locator('[data-testid="card-move-reset-m1"]').count() == 0)
        await p.screenshot(path=".screenshots/iter50_menu.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="card-move-tv-m1"]').click(); await p.wait_for_timeout(900)
        ts = await toasts(p); print("toasts:", ts)
        chk("toast Moved 1 title to TV Shows", any("Moved 1 title to TV Shows" in t for t in ts), ts)
        chk("clicking move item did not open detail", not await detail_open(p))
        h = await header(p); print("header:", h)
        chk("header 4 Movies · 2 TV Shows", h == "4 Movies · 2 TV Shows · 2 folders", h)
        chk("badges movies 4 tv 2", (await badge(p, "movies"), await badge(p, "tv")) == ("4", "2"), (await badge(p, "movies"), await badge(p, "tv")))
        # filters
        await pick_cat(p, "tv", "dir-cat-all-tv")
        tt = await titles(p); print("All TV:", tt)
        chk("All TV Shows = ShowA + MovieA", sorted(tt) == ["TEST_MovieA", "TEST_ShowA"], tt)
        await pick_cat(p, "movies", "dir-cat-all-movies")
        tt = await titles(p); print("All Movies:", tt)
        chk("All Movies excludes MovieA", "TEST_MovieA" not in tt and len(tt) == 4, tt)
        # folder filter (regression) - D:\Movies folder still lists everything inside that folder?
        await pick_cat(p, "movies", "dir-cat-item-movies-Movies")
        tt = await titles(p); print("Folder Movies:", tt)
        await p.locator('[data-testid="dir-filter-all"]').click(); await p.wait_for_timeout(600)
        # reset item present & works
        await open_card_menu(p, "m1")
        chk("TV checked+disabled after move", await p.locator('[data-testid="card-move-tv-m1"]').get_attribute("data-disabled") is not None)
        chk("reset item shown on overridden", await p.locator('[data-testid="card-move-reset-m1"]').count() == 1)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(300)
        await p.wait_for_timeout(1500)
        L = await lib_store(p)
        chk("persisted category_override tv on m1", L["m1"].get("category_override") == "tv", L["m1"].get("category_override"))
        # merged multipart move -> docs
        await open_card_menu(p, "mp1")
        await p.locator('[data-testid="card-move-docs-mp1"]').click(); await p.wait_for_timeout(900)
        h = await header(p); print("header:", h)
        chk("header 3 Movies · 2 TV Shows · 1 Documentary", h == "3 Movies · 2 TV Shows · 1 Documentary · 2 folders", h)
        await pick_cat(p, "docs", "dir-cat-all-docs")
        tt = await titles(p); print("All Docs:", tt)
        chk("docs dropdown (no docs folders) offers All Documentaries -> Multi", tt == ["TEST_Multi"], tt)
        await p.locator('[data-testid="dir-filter-all"]').click(); await p.wait_for_timeout(600)
        # moving to folder's type clears override: move t1 to movies then back to tv (same as folder)
        await open_card_menu(p, "t1")
        await p.locator('[data-testid="card-move-movies-t1"]').click(); await p.wait_for_timeout(700)
        await open_card_menu(p, "t1")
        await p.locator('[data-testid="card-move-tv-t1"]').click(); await p.wait_for_timeout(1800)
        L = await lib_store(p)
        chk("t1 moved back to folder type -> override cleared", "category_override" not in L["t1"], L["t1"].get("category_override"))
        # normal click opens detail (regression)
        await p.locator('[data-testid="movie-card-m2"]').click(); await p.wait_for_timeout(800)
        chk("normal click opens detail", await detail_open(p))
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        # reload persistence
        await p.reload(); await p.wait_for_timeout(2500)
        h = await header(p); print("after reload:", h)
        chk("after reload header kept", h == "3 Movies · 2 TV Shows · 1 Documentary · 2 folders", h)
        # rescan
        await p.locator('[data-testid="update-library-btn"]').click(); await p.wait_for_timeout(3500)
        h = await header(p); print("after rescan:", h)
        L = await lib_store(p)
        chk("after rescan header kept", h == "3 Movies · 2 TV Shows · 1 Documentary · 2 folders", h)
        chk("after rescan overrides kept", L["m1"].get("category_override") == "tv" and L["mp1"].get("category_override") == "docs" and len(L["mp1"].get("parts") or []) == 2,
            {k: (L[k].get("category_override"), len(L[k].get("parts") or [])) for k in L})
        # search regression
        await p.fill('[data-testid="movie-search-input"]', "MovieA"); await p.wait_for_timeout(800)
        chk("search MovieA", await titles(p) == ["TEST_MovieA"], await titles(p))
        await p.fill('[data-testid="movie-search-input"]', ""); await p.wait_for_timeout(500)
        # reset via menu
        await open_card_menu(p, "m1")
        await p.locator('[data-testid="card-move-reset-m1"]').click(); await p.wait_for_timeout(900)
        ts = await toasts(p)
        chk("reset toast", any("to their folder's type" in t for t in ts), ts)
        h = await header(p)
        chk("after reset header 4 Movies · 1 TV Show · 1 Documentary", h == "4 Movies · 1 TV Show · 1 Documentary · 2 folders", h)
        await p.wait_for_timeout(1500)
        # stats
        await p.goto(URL + "stats"); await p.wait_for_timeout(2500)
        st = {c: await T(p, f"type-stat-{c}-titles") for c in ("movies", "tv", "docs", "anim")}
        sub = await T(p, "type-stat-docs-sub")
        print("stats:", st, sub)
        chk("stats movies 4 tv 1 docs 1 anim 0", st == {"movies": "4", "tv": "1", "docs": "1", "anim": "0"}, st)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_select():
    ctx, p, errs = await open_ctx(lib50(), {"D:\\Movies": "movies", "D:\\TV": "tv"})
    try:
        await open_select(p)
        chk("select-bar shown", await p.locator('[data-testid="select-bar"]').count() == 1)
        chk("0 selected", await T(p, "select-count") == "0 selected", await T(p, "select-count"))
        chk("bulk-move-btn disabled at 0", await p.locator('[data-testid="bulk-move-btn"]').is_disabled())
        chk("card menu hidden in select mode", await p.locator('[data-testid="card-menu-m1"]').count() == 0)
        await p.locator('[data-testid="card-select-m2"]').click(); await p.wait_for_timeout(300)
        await p.locator('[data-testid="movie-card-mp1"]').click(); await p.wait_for_timeout(300)
        chk("click in select mode didn't open detail", not await detail_open(p))
        chk("2 selected", await T(p, "select-count") == "2 selected", await T(p, "select-count"))
        ring = await p.locator('[data-testid="movie-card-m2"]').get_attribute("class")
        chk("selected ring", "ring-2" in ring, ring)
        await p.locator('[data-testid="card-select-m2"]').click(); await p.wait_for_timeout(300)
        chk("toggle off -> 1 selected", await T(p, "select-count") == "1 selected")
        await p.locator('[data-testid="select-all-shown-btn"]').click(); await p.wait_for_timeout(300)
        chk("select all shown -> 6", await T(p, "select-count") == "6 selected", await T(p, "select-count"))
        await p.locator('[data-testid="select-clear-btn"]').click(); await p.wait_for_timeout(300)
        chk("clear -> 0", await T(p, "select-count") == "0 selected")
        for c in ("m2", "m3", "mp1"):
            await p.locator(f'[data-testid="card-select-{c}"]').click(); await p.wait_for_timeout(200)
        await p.screenshot(path=".screenshots/iter50_select.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="bulk-move-btn"]').click(); await p.wait_for_timeout(500)
        chk("bulk-move-menu opens", await p.locator('[data-testid="bulk-move-menu"]').count() == 1)
        await p.locator('[data-testid="bulk-move-anim"]', ).click(); await p.wait_for_timeout(900)
        ts = await toasts(p)
        chk("toast Moved 3 titles to Animations", any("Moved 3 titles to Animations" in t for t in ts), ts)
        chk("select mode exited", await p.locator('[data-testid="select-bar"]').count() == 0 )
        h = await header(p); print("header:", h)
        chk("header 2 Movies · 1 TV Show · 3 Animations", h == "2 Movies · 1 TV Show · 3 Animations · 2 folders", h)
        # bulk reset
        await open_select(p)
        for c in ("m2", "m3"):
            await p.locator(f'[data-testid="card-select-{c}"]').click(); await p.wait_for_timeout(200)
        await p.locator('[data-testid="bulk-move-btn"]').click(); await p.wait_for_timeout(500)
        await p.locator('[data-testid="bulk-move-reset"]').click(); await p.wait_for_timeout(1800)
        h = await header(p); print("header:", h)
        chk("after bulk reset: 4 Movies · 1 TV Show · 1 Animation", h == "4 Movies · 1 TV Show · 1 Animation · 2 folders", h)
        L = await lib_store(p)
        chk("store: m2/m3 no override, mp1 anim", "category_override" not in L["m2"] and "category_override" not in L["m3"] and L["mp1"].get("category_override") == "anim")
        # select via Done button exit
        await open_select(p)
        await p.locator('[data-testid="select-cancel-btn"]').click(); await p.wait_for_timeout(300)
        chk("Done exits select mode", await p.locator('[data-testid="select-bar"]').count() == 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_no_tv_folder():
    lib = [m for m in lib50() if m["id"] != "t1"]
    ctx, p, errs = await open_ctx(lib, {"D:\\Movies": "movies"}, dirs=("D:\\Movies",))
    try:
        h = await header(p); print("header:", h)
        chk("header '5 Movies · 1 folders'", h == "5 Movies · 1 folders", h)
        await p.locator('[data-testid="dir-cat-tv"]').click(); await p.wait_for_timeout(400)
        chk("TV dropdown no 'All TV Shows' before move", await p.locator('[data-testid="dir-cat-all-tv"]').count() == 0)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(300)
        await open_card_menu(p, "m4")
        await p.locator('[data-testid="card-move-tv-m4"]').click(); await p.wait_for_timeout(800)
        h = await header(p); print("header:", h)
        chk("header '4 Movies · 1 TV Show · 1 folders'", h == "4 Movies · 1 TV Show · 1 folders", h)
        ok = await pick_cat(p, "tv", "dir-cat-all-tv")
        chk("All TV Shows offered w/o TV folder", ok)
        chk("All TV shows -> MovieD", await titles(p) == ["TEST_MovieD"], await titles(p))
        await p.screenshot(path=".screenshots/iter50_notv.jpg", quality=40, full_page=False)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
