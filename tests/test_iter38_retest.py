# ruff: noqa: F821
# Iteration 38: retest of iter36 bugs - loose docs/anim series heuristics, scan button text, add-files dropdown counts, nested typed dir badge
# Run: g={'page':page}; exec(open('/app/tests/test_iter38_retest.py').read(), g); await g['run_loose_heuristics']() / run_button_text() / run_nested_badge()
exec(open('/app/tests/test_iter37_import_type.py').read(), globals())

LOOSE_CASES = [
    # (label, folder segs, names, typ, expect_group)
    ("Kids films anim", ["Kids"], ["Toy Story.mkv", "Cars.mkv", "Shrek (2001).mkv", "Up.mkv"], "anim", False),
    ("Kids films docs", ["Kids"], ["Toy Story.mkv", "Cars.mkv", "Shrek (2001).mkv", "Up.mkv"], "docs", False),
    ("Nature numbered docs", ["Nature"], ["01 - Oceans.mkv", "02 - Deserts.mkv", "03 - Jungles.mkv", "04 - Ice.mkv"], "docs", True),
    ("Planet Earth folder-named docs", ["Planet Earth"], ["Planet Earth - Oceans.mkv", "Planet Earth - Deserts.mkv", "Planet Earth - Caves.mkv"], "docs", True),
    ("Shared first words anim", ["Cartoons"], ["Looney Tunes Rabbit Fire.mkv", "Looney Tunes Duck Amuck.mkv", "Looney Tunes Baseball Bugs.mkv"], "anim", True),
    ("Docs films different names", ["DocsMix"], ["Free Solo.mkv", "Man on Wire.mkv", "Senna.mkv", "Jiro Dreams of Sushi.mkv"], "docs", False),
]


async def run_loose_heuristics(cases=None, auto="on"):
    res = []
    for label, segs, names, typ, expect in (cases or LOOSE_CASES):
        print("===", label, typ)
        R = "X:\\" + "\\".join(segs) + "\\"
        files = [{"id": "lz%d" % i, "file_path": R + n, "file_name": n, "title": n[:-4]} for i, n in enumerate(names)]
        lib = [HEAT]
        ctx, p, mock, errs = await open4(lib, base_scan(lib) + files, auto=auto)
        try:
            await browse_to(p, "X:", segs)
            mock.calls.clear()
            await scan_as(p, typ, wait=5000)
            groups = await report_dialog(p, merge=False)
            await p.wait_for_timeout(1500)
            L = await H.read_lib(p)
            print("  cards:", lib_summary(L))
            print("  searches:", [c_ for c_ in mock.calls if "search" in c_][:8])
            ok = bool(groups) == expect
            res.append((label, typ, "PASS" if ok else "FAIL"))
            print("  RESULT", "PASS" if ok else "FAIL", "errors:", errs)
        finally:
            await ctx.close()
    print("SUMMARY", res)


async def run_button_text():
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + MM_FILES[:3])
    try:
        await browse_to(p, "X:", ["Docs"])
        btn = p.locator('[data-testid="scan-folder-btn"]')
        dlg = p.locator('[role="dialog"]').last
        print("desc:", (await dlg.inner_text())[:300].replace("\n", " | "))
        print("no pick:", (await btn.inner_text()).strip())
        for t in ["movies", "tv", "docs", "anim"]:
            await p.locator(f'[data-testid="scan-type-{t}"]').click()
            await p.wait_for_timeout(150)
            print(t, "->", (await btn.inner_text()).strip())
        await p.screenshot(path=".screenshots/iter38_btn.jpg", quality=40, full_page=False)
        # Cancel button resets
        cancel = dlg.get_by_role("button", name="Cancel")
        if await cancel.count():
            await cancel.first.click()
            await p.wait_for_timeout(400)
            await browse_to(p, None, [])
            print("after Cancel btn + reopen: disabled:", await btn.is_disabled(), await picker_state(p))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_nested_badge():
    """Scanned M:\\Movies (movies) then scan M:\\Movies\\2019 as movies -> badge should not double count."""
    files = [
        {"id": "ma", "file_path": "M:\\Movies\\2019\\A (2019).mkv", "file_name": "A (2019).mkv", "title": "A", "year": 2019},
        {"id": "mb", "file_path": "M:\\Movies\\2019\\B (2019).mkv", "file_name": "B (2019).mkv", "title": "B", "year": 2019},
    ]
    lib = [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + files, auto="off")
    try:
        await browse_to(p, "M:", ["Movies", "2019"])
        await scan_as(p, "movies")
        await report_dialog(p, merge=False)
        L = await H.read_lib(p)
        print("cards:", len(L))
        cat_btn = p.locator('[data-testid="dir-cat-movies"]')
        print("movies badge:", (await cat_btn.inner_text()).replace("\n", " "))
        await cat_btn.click()
        await p.wait_for_timeout(400)
        menu = p.locator('[data-testid="dir-cat-menu-movies"]')
        print("menu:", (await menu.inner_text()).replace("\n", " | ") if await menu.count() else "none")
        await p.keyboard.press("Escape")
        print("errors:", errs)
    finally:
        await ctx.close()
