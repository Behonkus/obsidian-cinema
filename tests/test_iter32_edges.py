# Iteration 32 edge probes: single new episode in show folder (auto-match skipped?), 'Extras' show with non-prefixed file names
exec(open('/app/tests/test_iter32_multipart.py').read(), globals())


async def run_edges():
    lib = [{"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "D:\\Movies\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}]
    new = [{"id": "s1", "file_path": "D:\\TV\\Lost\\Season 1\\Lost.S01E01.mkv", "file_name": "Lost.S01E01.mkv", "title": "Lost"}]
    ctx, p, mock, errs = await open2(lib, base_scan(lib) + new, auto="on")
    try:
        await p.locator('[data-testid="update-library-btn"]').click()
        await p.wait_for_timeout(6000)
        L = await H.read_lib(p)
        print("single episode:", summarize(L), "| calls:", mock.calls, "| dialog:", await p.locator('[data-testid="multipart-suggest-dialog"]').count())
        print("queue:", await p.evaluate("() => Object.keys(localStorage).filter(k => k.includes('queue')).map(k => k + '=' + localStorage.getItem(k))"))
        print("toasts:", await H.toasts(p))
    finally:
        await ctx.close()
    E = "D:\\TV\\Extras\\"
    lib = [c("e1", E + "Season 1\\01 - Pilot.mkv", "Pilot"), c("e2", E + "Season 1\\02 - Second.mkv", "Second")]
    ctx, p, mock, errs = await open2(lib, base_scan(lib))
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("Extras show numbered files: btn", await btn.inner_text() if await btn.count() else "MISSING", "| TV:", await tv_count(p))
        if await btn.count():
            await btn.click(); await p.wait_for_timeout(400)
            print("DIALOG:", await dialog_text(p))
        print("errors:", errs)
    finally:
        await ctx.close()
