# ruff: noqa: F821
# Iteration 37: import type picker (Browse Local Drives + Add Files), loose show folder -> one card, Movies stay separate, stats/filters
# Run: g={'page':page}; exec(open('/app/tests/test_iter37_import_type.py').read(), g); await g['run_browse_modern_marvels']() etc.
exec(open('/app/tests/test_iter36_varied_layouts.py').read(), globals())

HEAT = {"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "M:\\Movies\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}


def override_script(scan, dialog, drives):
    return """
(() => {
  const base = window.electronAPI;
  const SCANX = %s; const DLG = %s; const DRIVES = %s;
  window.__dlgCalls = 0; window.__listCalls = [];
  const norm = s => s.replace(/[\\\\/]+$/, '');
  const ov = {
    getDrives: () => Promise.resolve(DRIVES),
    listDirectory: (p) => {
      window.__listCalls.push(p);
      const d = norm(p); const seen = {}; const out = [];
      SCANX.forEach(f => {
        if (!f.file_path.toLowerCase().startsWith(d.toLowerCase() + '\\\\')) return;
        const rest = f.file_path.slice(d.length + 1).split('\\\\');
        const name = rest[0];
        if (seen[name]) return; seen[name] = 1;
        out.push({ name, path: d + '\\\\' + name, isDirectory: rest.length > 1 });
      });
      return Promise.resolve(out);
    },
    openFileDialog: () => { window.__dlgCalls++; return Promise.resolve({ canceled: false, filePaths: DLG }); },
  };
  window.electronAPI = new Proxy({}, { get(t, k) { if (k in ov) return ov[k]; return base[k]; } });
})();
""" % (json.dumps(scan), json.dumps(dialog or []), json.dumps(drives or [{"name": "X:", "path": "X:\\"}, {"name": "M:", "path": "M:\\"}, {"name": "T:", "path": "T:\\"}]))


async def open4(lib, scan, auto="on", cats=None, dirs=("M:\\Movies",), dialog=None, skip_tip=True, pro=True):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = Mock2(delay=0.1)
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    await ctx.add_init_script(H.init_script(lib=lib, key=True, auto=auto, scan=scan, dirs=dirs))
    await ctx.add_init_script(cats_script(cats or {d: "movies" for d in dirs}))
    if not skip_tip:
        await ctx.add_init_script("(() => { if (!sessionStorage.getItem('tipRm')) { sessionStorage.setItem('tipRm','1'); localStorage.removeItem('obsidian_cinema_skip_naming_tip'); } })();")
    await ctx.add_init_script(override_script(scan, dialog, None))
    if pro:
        await ctx.add_init_script("(() => { const os = Storage.prototype.setItem; os.call(localStorage, 'obsidian_cinema_is_pro', 'true'); Storage.prototype.setItem = function(k, v) { if (k === 'obsidian_cinema_is_pro') v = 'true'; return os.call(this, k, v); }; })();")
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL)
    await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
    await p.wait_for_timeout(1000)
    return ctx, p, mock, errs


async def browse_to(p, drive, segs):
    await p.locator('[data-testid="browse-local-drives-btn"]').click()
    await p.wait_for_timeout(500)
    dlg = p.locator('[role="dialog"]').last
    for s in ([drive] if drive else []) + list(segs):
        await dlg.locator('button.w-full').filter(has=p.get_by_text(s, exact=True)).first.click()
        await p.wait_for_timeout(400)
    return dlg


async def picker_state(p, prefix="scan-type"):
    out = {}
    for t in ["movies", "tv", "docs", "anim"]:
        loc = p.locator(f'[data-testid="{prefix}-{t}"]')
        out[t] = (await loc.get_attribute("class") or "")[-60:] if await loc.count() else "MISSING"
    return out


async def scan_as(p, typ, wait=4000):
    btn = p.locator('[data-testid="scan-folder-btn"]')
    print("  picker visible:", await p.locator('[data-testid="scan-type-picker"]').count(), "| scan disabled before pick:", await btn.is_disabled())
    await p.locator(f'[data-testid="scan-type-{typ}"]').click()
    await p.wait_for_timeout(200)
    print("  scan disabled after pick:", await btn.is_disabled())
    await btn.click()
    await p.wait_for_timeout(wait)


async def report_dialog(p, merge=True):
    d = p.locator('[data-testid="multipart-suggest-dialog"]')
    cnt = await d.count()
    print("  merge dialog:", cnt)
    groups = []
    if cnt:
        groups = await groups_text(p)
        for g_ in groups:
            print("  GROUP:", g_[:220])
        if merge:
            await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(3000)
    return groups


def lib_summary(L):
    return sorted([(m.get("title"), len(m.get("parts") or []), m.get("tmdb_id")) for m in L.values()], key=lambda x: str(x[0]))


MM = "X:\\Docs\\Modern Marvels\\"
MM_FILES = [{"id": "mm%d" % i, "file_path": MM + "Modern Marvels - Topic %d (%d).mkv" % (i, 1993 + i % 20),
             "file_name": "Modern Marvels - Topic %d (%d).mkv" % (i, 1993 + i % 20), "title": "Modern Marvels - Topic %d" % i} for i in range(600)]


async def run_browse_modern_marvels(segs=("Docs", "Modern Marvels"), typ="docs", files=None, auto="on", pro=True):
    files = files or MM_FILES
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + files, auto=auto, pro=pro)
    try:
        await browse_to(p, "X:", list(segs))
        await p.screenshot(path=".screenshots/iter37_picker.jpg", quality=40, full_page=False)
        print("  pills before pick:", await picker_state(p))
        mock.calls.clear()
        await scan_as(p, typ, wait=6000)
        print("  toasts:", [t[:80] for t in await H.toasts(p)])
        groups = await report_dialog(p)
        await p.wait_for_timeout(3000)
        L = await H.read_lib(p)
        print("  cards:", len(L), [x for x in lib_summary(L)][:6])
        movie_searches = [c_ for c_ in mock.calls if "search/movie" in c_]
        print("  movie searches:", len(movie_searches), movie_searches[:3], "| tv searches:", [c_ for c_ in mock.calls if "search/tv" in c_][:3])
        print("  stored cats:", await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')"))
        # picker resets for next scan
        await p.locator('[data-testid="browse-local-drives-btn"]').click()
        await p.wait_for_timeout(500)
        print("  next scan path input:", await p.locator('[role="dialog"]').last.locator('input').first.input_value())
        print("  next scan: scan disabled:", await p.locator('[data-testid="scan-folder-btn"]').is_disabled(), "pills:", await picker_state(p))
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(400)
        await open_mgr(p)
        mgr = await p.evaluate("""() => Array.from(document.querySelectorAll('[data-testid^="dir-manage-"]')).map(e => { const s = e.querySelector('select'); return e.innerText.split('\\n')[0] + ' => ' + (s ? s.value : '?'); })""")
        print("  manage dirs:", mgr)
        await p.screenshot(path=".screenshots/iter37_mgr.jpg", quality=40, full_page=False)
        print("RESULT", "PASS" if len(L) == 2 and len(groups) == 1 else "CHECK", "errors:", errs)
    finally:
        await ctx.close()


async def run_cancel_resets():
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + MM_FILES[:5])
    try:
        await browse_to(p, "X:", ["Docs"])
        await p.locator('[data-testid="scan-type-tv"]').click()
        await p.wait_for_timeout(200)
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(500)
        await browse_to(p, None, [])
        print("path after reopen:", await p.locator('[role="dialog"]').last.locator('input').first.input_value())
        print("after cancel + reopen: scan disabled:", await p.locator('[data-testid="scan-folder-btn"]').is_disabled(), await picker_state(p))
        # switching folder after picking keeps type?
        await p.locator('[data-testid="scan-type-anim"]').click()
        await p.locator('[role="dialog"]').last.locator('button.w-full').filter(has=p.get_by_text("Modern Marvels", exact=True)).first.click()
        await p.wait_for_timeout(400)
        print("after navigating into subfolder: scan disabled:", await p.locator('[data-testid="scan-folder-btn"]').is_disabled())
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_movies_and_loose():
    """Movies\\2019 scanned as movies; loose multi-show TV folder; docs folder of distinct-year films."""
    files = [
        {"id": "ma", "file_path": "M:\\Movies\\2019\\A (2019).mkv", "file_name": "A (2019).mkv", "title": "A", "year": 2019},
        {"id": "mb", "file_path": "M:\\Movies\\2019\\B (2019).mkv", "file_name": "B (2019).mkv", "title": "B", "year": 2019},
    ]
    tvf = [{"id": "t%d" % i, "file_path": "T:\\TV\\" + n, "file_name": n, "title": n} for i, n in enumerate(["Show.A.S01E01.mkv", "Show.A.S01E02.mkv", "Show.B.S01E01.mkv", "Show.C.S02E05.mkv"])]
    docf = [{"id": "d%d" % i, "file_path": "X:\\DocFilms\\" + n, "file_name": n, "title": n.split(" (")[0]} for i, n in enumerate(["Film A (2001).mkv", "Film B (2005).mkv", "Film C (2010).mkv"])]
    for label, segs, drive, typ, fl in [("MOVIES", ["Movies", "2019"], "M:", "movies", files), ("LOOSE TV", ["TV"], "T:", "tv", tvf), ("DOC FILMS", ["DocFilms"], "X:", "docs", docf)]:
        print("===", label)
        lib = [dict(HEAT, file_path="Z:\\Heat (1995).mkv")]
        ctx, p, mock, errs = await open4(lib, base_scan(lib) + fl, auto="off", dirs=("Z:\\",))
        try:
            await browse_to(p, drive, segs)
            await scan_as(p, typ)
            await report_dialog(p, merge=False)
            btn = p.locator('[data-testid="multipart-suggest-btn"]')
            print("  multipart btn:", await btn.inner_text() if await btn.count() else "none")
            if await btn.count() and await p.locator('[data-testid="multipart-suggest-dialog"]').count() == 0:
                await btn.click()
                await p.wait_for_timeout(500)
                for g_ in await groups_text(p):
                    print("  BTN GROUP:", g_[:200])
            L = await H.read_lib(p)
            print("  cards:", lib_summary(L), "errors:", errs)
        finally:
            await ctx.close()


SH = "D:\\Downloads\\Breaking Bad\\"
PICK = [SH + "Breaking Bad S01E01.mkv", SH + "Breaking Bad S01E02.mkv", SH + "Breaking Bad S01E03.mkv"]


async def run_add_files(skip_tip=True, typ="tv", lib=None, dirs=("M:\\Movies",), cats=None, pick=None):
    lib = lib or [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib), auto="on", dialog=pick or PICK, skip_tip=skip_tip, dirs=dirs, cats=cats)
    try:
        await p.locator('[data-testid="more-actions-btn"]').click(); await p.wait_for_timeout(300); await p.locator('[data-testid="add-files-btn"]').click()
        await p.wait_for_timeout(500)
        if not skip_tip:
            print("naming tip shown:", await p.locator('[data-testid="confirm-naming-tip-files-btn"]').count())
            await p.locator('[data-testid="confirm-naming-tip-files-btn"]').click()
            await p.wait_for_timeout(500)
        d = p.locator('[data-testid="files-type-dialog"]')
        print("files-type-dialog:", await d.count(), "| continue disabled:", await p.locator('[data-testid="files-type-continue"]').is_disabled(), "| pills:", list((await picker_state(p, "files-type")).keys()))
        await p.screenshot(path=".screenshots/iter37_files_type.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="files-type-cancel"]').click()
        await p.wait_for_timeout(400)
        print("after cancel: dialog", await d.count(), "file dialog calls:", await p.evaluate("() => window.__dlgCalls"))
        await p.locator('[data-testid="more-actions-btn"]').click(); await p.wait_for_timeout(300); await p.locator('[data-testid="add-files-btn"]').click()
        await p.wait_for_timeout(500)
        if not skip_tip:
            if await p.locator('[data-testid="confirm-naming-tip-files-btn"]').count():
                await p.locator('[data-testid="confirm-naming-tip-files-btn"]').click()
                await p.wait_for_timeout(400)
        print("reopen continue disabled (reset):", await p.locator('[data-testid="files-type-continue"]').is_disabled())
        await p.locator(f'[data-testid="files-type-{typ}"]').click()
        print("continue disabled after pick:", await p.locator('[data-testid="files-type-continue"]').is_disabled())
        mock.calls.clear()
        await p.locator('[data-testid="files-type-continue"]').click()
        await p.wait_for_timeout(4000)
        print("file dialog calls:", await p.evaluate("() => window.__dlgCalls"), "toasts:", [t[:60] for t in await H.toasts(p)])
        await report_dialog(p)
        await p.wait_for_timeout(2500)
        L = await H.read_lib(p)
        print("cards:", lib_summary(L))
        print("tmdb calls:", mock.calls[:6])
        print("stored cats:", await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')"))
        # category filter
        cat_btn = p.locator(f'[data-testid="dir-cat-{typ}"]')
        print("cat button:", (await cat_btn.inner_text()).replace("\n", " "))
        await cat_btn.click()
        await p.wait_for_timeout(400)
        menu = p.locator(f'[data-testid="dir-cat-menu-{typ}"]')
        print("cat menu:", (await menu.inner_text()).replace("\n", " | ") if await menu.count() else "none")
        allb = p.locator(f'[data-testid="dir-cat-all-{typ}"]')
        if await allb.count():
            await allb.click()
            await p.wait_for_timeout(600)
            print("filtered cards:", [x.split("\n")[0] for x in await p.locator('div.cursor-pointer.overflow-hidden').all_inner_texts()])
        else:
            await p.keyboard.press("Escape")
        await p.screenshot(path=".screenshots/iter37_addfiles_filter.jpg", quality=40, full_page=False)
        # stats page
        await p.goto(URL + "stats")
        await p.wait_for_timeout(2500)
        for t in ["movies", "tv", "docs", "anim"]:
            loc = p.locator(f'[data-testid="type-stat-{t}-titles"]')
            sub = p.locator(f'[data-testid="type-stat-{t}-sub"]')
            print("STAT", t, await loc.inner_text() if await loc.count() else "MISSING", "|", (await sub.inner_text()).replace("\n", " ") if await sub.count() else "")
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_add_files_existing_tv_dir():
    """User already has a TV folder; Add Files of a show elsewhere as TV -> does All TV Shows include it, badge count?"""
    lib = [HEAT, mk("lo", "T:\\TV\\Lost\\Season 1\\Lost S01E01.mkv", "Lost")]
    await run_add_files(lib=lib, dirs=("M:\\Movies", "T:\\TV"), cats={"M:\\Movies": "movies", "T:\\TV": "tv"})


async def run_add_files_movies():
    await run_add_files(typ="movies", pick=["D:\\Downloads\\Alien (1979).mkv", "D:\\Downloads\\Aliens (1986).mkv"])


async def run_loose_sxxexx(typ="tv"):
    """Loose single-show folder with standard SxxExx names (+ one non-numbered file) scanned as TV -> expect ONE show group."""
    R = "X:\\TV\\Modern Marvels\\"
    names = ["Modern Marvels S01E0%d.mkv" % i for i in range(1, 6)] + ["Modern Marvels S02E01 - Bridges.mkv", "Modern Marvels - Hoover Dam.mkv"]
    files = [{"id": "s%d" % i, "file_path": R + n, "file_name": n, "title": n[:-4]} for i, n in enumerate(names)]
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + files, auto="on")
    try:
        await browse_to(p, "X:", ["TV", "Modern Marvels"])
        mock.calls.clear()
        await scan_as(p, typ)
        groups = await report_dialog(p)
        await p.wait_for_timeout(3000)
        L = await H.read_lib(p)
        print("  cards:", lib_summary(L))
        print("  tmdb calls:", [c_ for c_ in mock.calls if "search" in c_])
        print("RESULT", "PASS" if len(L) == 2 and groups and groups[0].startswith("multipart-group-show|") else "FAIL", "errors:", errs)
    finally:
        await ctx.close()


async def run_loose_films_no_years(typ="anim"):
    """Animations folder holding loose separate films, not all with years -> should they become one 'Kids' card?"""
    R = "X:\\Kids\\"
    names = ["Toy Story.mkv", "Cars.mkv", "Shrek (2001).mkv", "Up.mkv"]
    files = [{"id": "k%d" % i, "file_path": R + n, "file_name": n, "title": n[:-4]} for i, n in enumerate(names)]
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + files, auto="off")
    try:
        await browse_to(p, "X:", ["Kids"])
        await scan_as(p, typ)
        groups = await report_dialog(p, merge=False)
        print("RESULT", "MERGED-INTO-FOLDER-CARD" if groups else "SEPARATE", "errors:", errs)
    finally:
        await ctx.close()
