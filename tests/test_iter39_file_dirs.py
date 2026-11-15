# ruff: noqa: F821
# Iteration 39: Manage Directories 'Folders from Add Files' section - type select, merge re-check, Remove (library only)
# Run: g={'page':page}; exec(open('/app/tests/test_iter39_file_dirs.py').read(), g); await g['run_fd_type_switch']() / run_fd_remove() / run_fd_edges()
exec(open('/app/tests/test_iter38_retest.py').read(), globals())

SPY = """
(() => {
  const base = window.electronAPI; window.__fsCalls = [];
  window.electronAPI = new Proxy({}, { get(t, k) {
    if (typeof k === 'string' && /delete|remove|trash|unlink|rm/i.test(k)) window.__fsCalls.push(k);
    return base[k]; } });
})();
"""


async def open5(lib, scan, dialog, dirs=("M:\\Movies",), cats=None, auto="off"):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    mock = Mock2(delay=0.1)
    await ctx.route("**/api.themoviedb.org/**", mock.handle)
    await ctx.add_init_script(H.init_script(lib=lib, key=True, auto=auto, scan=scan, dirs=dirs))
    await ctx.add_init_script(cats_script(cats or {d: "movies" for d in dirs}))
    await ctx.add_init_script(override_script(scan, dialog, None))
    await ctx.add_init_script(SPY)
    await ctx.add_init_script("(() => { const os = Storage.prototype.setItem; os.call(localStorage, 'obsidian_cinema_is_pro', 'true'); Storage.prototype.setItem = function(k, v) { if (k === 'obsidian_cinema_is_pro') v = 'true'; return os.call(this, k, v); }; })();")
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(URL)
    await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000)
    await p.wait_for_timeout(1000)
    return ctx, p, mock, errs


async def add_files(p, typ, wait=3000):
    await p.locator('[data-testid="more-actions-btn"]').click(); await p.wait_for_timeout(300); await p.locator('[data-testid="add-files-btn"]').click()
    await p.wait_for_timeout(500)
    await p.locator(f'[data-testid="files-type-{typ}"]').click()
    await p.locator('[data-testid="files-type-continue"]').click()
    await p.wait_for_timeout(wait)


async def fd_rows(p):
    return await p.evaluate("""() => {
      const sec = document.querySelector('[data-testid="file-dirs-section"]');
      const rows = Array.from(document.querySelectorAll('[data-testid^="file-dir-"]')).filter(e => /^file-dir-\\d+$/.test(e.dataset.testid));
      const dirs = Array.from(document.querySelectorAll('[data-testid^="dir-manage-"]')).map(e => e.innerText.split('\\n')[0]);
      return { section: !!sec, scanned: dirs, rows: rows.map((r, i) => ({ text: r.innerText.replace(/\\n/g, ' | '),
        type: (document.querySelector('[data-testid="file-dir-type-' + i + '"]') || {}).value,
        count: (document.querySelector('[data-testid="file-dir-count-' + i + '"]') || {}).innerText })) };
    }""")


async def cats(p):
    return await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')")


async def close_merge(p):
    if await p.locator('[data-testid="multipart-suggest-dialog"]').count():
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(600)


async def run_fd_type_switch():
    """3 Breaking Bad files added as Movies -> switch to TV opens 'Shows found in this folder'; Movies does not."""
    lib = [HEAT]
    ctx, p, mock, errs = await open5(lib, base_scan(lib), PICK)
    try:
        await add_files(p, "movies")
        await close_merge(p)
        L = await H.read_lib(p)
        print("cards after add:", lib_summary(L))
        await mgr(p)
        r = await fd_rows(p)
        print("mgr:", r)
        await p.screenshot(path=".screenshots/iter39_mgr.jpg", quality=40, full_page=False)
        sel = p.locator('[data-testid="file-dir-type-0"]')
        for typ in ["tv", "movies", "docs", "anim"]:
            if await sel.count() == 0:
                await mgr(p)
            await sel.select_option(typ)
            await p.wait_for_timeout(1200)
            d = p.locator('[data-testid="multipart-suggest-dialog"]')
            heading = (await d.inner_text())[:60].replace("\n", " | ") if await d.count() else ""
            print(f"--- switch to {typ}: dialog={await d.count()} heading={heading!r} cats={await cats(p)}")
            if await d.count():
                for g_ in await groups_text(p):
                    print("   GROUP:", g_[:160])
                if typ == "tv":
                    await p.screenshot(path=".screenshots/iter39_switch_tv.jpg", quality=40, full_page=False)
                await close_merge(p)
            # badges
            badges = await p.evaluate("""() => ['movies','tv','docs','anim'].map(t => { const b = document.querySelector('[data-testid="dir-cat-' + t + '"]'); return t + ':' + (b ? b.innerText.replace(/\\n/g,' ') : '-'); })""")
            print("   badges:", badges)
        # final: tv + merge
        if await sel.count() == 0:
            await mgr(p)
        await p.locator('[data-testid="file-dir-type-0"]').select_option("tv")
        await p.wait_for_timeout(1200)
        if await p.locator('[data-testid="multipart-merge-selected-btn"]').count():
            await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(2000)
        L = await H.read_lib(p)
        print("after tv merge:", lib_summary(L))
        if await p.locator('[data-testid="manage-dirs-btn"]').count() and await p.locator('[data-testid="file-dir-type-0"]').count() == 0:
            await mgr(p)
        print("mgr after merge:", await fd_rows(p))
        print("errors:", errs, "fs calls:", await p.evaluate("() => window.__fsCalls"))
    finally:
        await ctx.close()


async def run_fd_remove():
    """Two Add Files folders + scanned dir; cancel keeps, confirm removes only that exact folder."""
    pick = ["D:\\Downloads\\Alien (1979).mkv", "D:\\Downloads\\Aliens (1986).mkv", "D:\\Downloads\\Sub\\Up (2009).mkv"]
    lib = [HEAT, mk("ht2", "M:\\Movies\\Ronin (1998).mkv", "Ronin", year=1998)]
    ctx, p, mock, errs = await open5(lib, base_scan(lib), pick, cats={"M:\\Movies": "movies", "Q:\\Gone": "tv"})
    try:
        await add_files(p, "movies")
        await close_merge(p)
        print("cards:", lib_summary(await H.read_lib(p)))
        await mgr(p)
        r = await fd_rows(p)
        print("mgr:", r)
        idx = [i for i, x in enumerate(r["rows"]) if x["text"].split(" | ")[1] == "D:\\Downloads"]
        i = idx[0] if idx else 0
        await p.locator(f'[data-testid="file-dir-remove-{i}"]').click()
        await p.wait_for_timeout(500)
        dlg = p.locator('[data-testid="file-dir-remove-dialog"]')
        print("remove dialog:", (await dlg.inner_text()).replace("\n", " | ") if await dlg.count() else "MISSING")
        await p.screenshot(path=".screenshots/iter39_remove_dlg.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="file-dir-remove-cancel"]').click()
        await p.wait_for_timeout(500)
        print("after cancel: dialog", await dlg.count(), "mgr open:", await p.locator('[data-testid="file-dirs-section"]').count(),
              "cards:", len(await H.read_lib(p)), "cats:", await cats(p))
        await mgr(p)
        await p.locator(f'[data-testid="file-dir-remove-{i}"]').click()
        await p.wait_for_timeout(400)
        await p.locator('[data-testid="file-dir-remove-confirm"]').click()
        await p.wait_for_timeout(1500)
        print("toasts:", [t[:80] for t in await H.toasts(p)])
        L = await H.read_lib(p)
        print("after confirm cards:", lib_summary(L))
        print("cats:", await cats(p))
        await mgr(p)
        print("mgr after:", await fd_rows(p))
        # remove the last one too -> section hidden
        await p.locator('[data-testid="file-dir-remove-0"]').click()
        await p.wait_for_timeout(400)
        await p.locator('[data-testid="file-dir-remove-confirm"]').click()
        await p.wait_for_timeout(1200)
        await mgr(p)
        print("after removing all:", await fd_rows(p), "cards:", lib_summary(await H.read_lib(p)))
        print("errors:", errs, "fs calls:", await p.evaluate("() => window.__fsCalls"))
    finally:
        await ctx.close()


async def run_fd_edges():
    """Edge: Add Files from a subfolder of a scanned dir / from a scanned dir itself."""
    # (a) subfolder of scanned dir which already holds a scanned title
    lib = [HEAT, mk("sc1", "M:\\Movies\\Extra\\Ronin (1998).mkv", "Ronin", year=1998)]
    ctx, p, mock, errs = await open5(lib, base_scan(lib), ["M:\\Movies\\Extra\\Up (2009).mkv"])
    try:
        await add_files(p, "tv")
        await close_merge(p)
        print("(a) cats:", await cats(p))
        await mgr(p)
        r = await fd_rows(p)
        print("(a) mgr:", r)
        if r["rows"]:
            await p.locator('[data-testid="file-dir-remove-0"]').click()
            await p.wait_for_timeout(400)
            await p.locator('[data-testid="file-dir-remove-confirm"]').click()
            await p.wait_for_timeout(1200)
            print("(a) after remove cards:", lib_summary(await H.read_lib(p)))
        print("errors:", errs)
    finally:
        await ctx.close()
    # (b) file picked directly inside scanned dir as TV -> does scanned dir type flip?
    lib = [HEAT]
    ctx, p, mock, errs = await open5(lib, base_scan(lib), ["M:\\Movies\\Up (2009).mkv"])
    try:
        await add_files(p, "tv")
        await close_merge(p)
        print("(b) cats:", await cats(p))
        await mgr(p)
        r = await fd_rows(p)
        print("(b) mgr:", r, "dir-type-0:", await p.locator('[data-testid="dir-type-0"]').input_value())
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_scanned_rows_regress():
    """Scanned rows: dir-type, up/down, rename, remove still work alongside the file-dirs section."""
    lib = [HEAT, mk("tv1", "T:\\TV\\Lost\\Season 1\\Lost S01E01.mkv", "Lost")]
    ctx, p, mock, errs = await open5(lib, base_scan(lib), ["D:\\Downloads\\Alien (1979).mkv"], dirs=("M:\\Movies", "T:\\TV"), cats={"M:\\Movies": "movies", "T:\\TV": "tv"})
    try:
        await add_files(p, "movies")
        await close_merge(p)
        await mgr(p)
        print("start:", await fd_rows(p))
        print("dir-type-0/1:", await p.locator('[data-testid="dir-type-0"]').input_value(), await p.locator('[data-testid="dir-type-1"]').input_value())
        await p.locator('[data-testid="dir-mgr-down-0"]').click()
        await p.wait_for_timeout(400)
        print("after down:", (await fd_rows(p))["scanned"])
        await p.locator('[data-testid="dir-type-1"]').select_option("docs")
        await p.wait_for_timeout(800)
        await close_merge(p)
        print("cats after dir-type-1 docs:", await cats(p))
        if await p.locator('[data-testid="dir-mgr-rename-0"]').count() == 0:
            await mgr(p)
        await p.locator('[data-testid="dir-mgr-rename-0"]').click()
        await p.wait_for_timeout(500)
        print("rename dialog inputs:", await p.locator('[role="alertdialog"] input, [role="dialog"] input').count())
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(400)
        await mgr(p)
        await p.locator('[data-testid="dir-mgr-remove-0"]').click()
        await p.wait_for_timeout(400)
        dlg_txt = await p.locator('[role="alertdialog"]').last.inner_text()
        print("dir remove dialog:", dlg_txt[:160].replace("\n", " | "))
        btn = p.locator('[role="alertdialog"]').last.get_by_role("button", name=re.compile("Remove", re.I))
        await btn.last.click()
        await p.wait_for_timeout(1200)
        print("after scanned remove cards:", lib_summary(await H.read_lib(p)), "cats:", await cats(p))
        await mgr(p)
        print("end:", await fd_rows(p))
        print("errors:", errs, "fs calls:", await p.evaluate("() => window.__fsCalls"))
    finally:
        await ctx.close()


async def mgr(p):
    """Open Manage Directories unless already open."""
    if await p.locator('[data-testid^="dir-manage-"]').count() == 0:
        await open_mgr(p)
