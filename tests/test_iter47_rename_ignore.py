# Iteration 47: Year-rename "Never rename" (ignore list), Allow again reset, stale-entry pruning, unticked state survives removal
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter47_rename_ignore.py').read(), g); await g['run_ignore'](); await g['run_prune']()
import json
g44 = {'page': page}
exec(open('/app/tests/test_iter44_fix_missing.py').read(), g44)
mk, fix_lib, open_ctx, saved, toasts, btn_text, chk, URL = (g44[k] for k in ("mk", "fix_lib", "open_ctx", "saved", "toasts", "btn_text", "chk", "URL"))
IGN = "obsidian_cinema_year_rename_ignored"
MIS = "obsidian_cinema_year_mismatches"


def lib47():
    lib = fix_lib()
    lib += [mk("third", "TEST_Third", "TEST_Third (2003).mkv", tmdb_id=720, year=2003, rating=0, genres=["Comedy"]),
            mk("fourth", "TEST_Fourth", "TEST_Fourth (2003).mkv", tmdb_id=720, year=2003, rating=0, genres=["Comedy"])]
    return lib


async def rows(p):
    out, i = [], 0
    while await p.locator(f'[data-testid="year-mismatch-{i}"]').count():
        out.append(await p.locator(f'[data-testid="year-mismatch-{i}"]').inner_text()); i += 1
    return out


async def idx_of(p, text):
    r = await rows(p)
    return next((i for i, t in enumerate(r) if text in t), None)


async def ls(p, k):
    return await p.evaluate(f"() => JSON.parse(localStorage.getItem('{k}') || 'null')")


async def run_fix(p):
    await p.goto(URL + "?qf=no-rating"); await p.wait_for_timeout(1500)
    await p.locator('[data-testid="fix-missing-btn"]').click()
    for _ in range(50):
        await p.wait_for_timeout(500)
        t = await btn_text(p, "fix-missing-btn")
        if not (t or "").startswith("Fixing"): break
    await p.wait_for_timeout(1000)


async def run_ignore():
    ctx, p, tm, wd, errs = await open_ctx(lib47(), key=True, fail=("TEST_Second",), tmdb_delay=0.1)
    try:
        await run_fix(p)
        r = await rows(p)
        print("rows:", r)
        chk("dialog with 4 mismatch rows", len(r) == 4, len(r))
        chk("no reset link initially", await p.locator('[data-testid="year-mismatch-reset-ignored"]').count() == 0)
        it = await idx_of(p, "TEST_Third")
        await p.locator(f'[data-testid="year-mismatch-check-{it}"]').click(); await p.wait_for_timeout(200)
        chk("rename label after untick = 3", await btn_text(p, "year-mismatch-rename") == "Rename 3 files", await btn_text(p, "year-mismatch-rename"))
        ih = await idx_of(p, "Heat (1996)")
        heat_state_before = await p.locator(f'[data-testid="year-mismatch-check-{ih}"]').get_attribute("data-state")
        await p.locator(f'[data-testid="year-mismatch-ignore-{ih}"]').click(); await p.wait_for_timeout(600)
        r = await rows(p)
        print("rows after ignore:", r)
        chk("heat row removed", len(r) == 3 and not any("Heat" in x for x in r), r)
        chk("heat checkbox was not toggled before removal (was checked)", heat_state_before == "checked")
        it = await idx_of(p, "TEST_Third")
        st = await p.locator(f'[data-testid="year-mismatch-check-{it}"]').get_attribute("data-state")
        chk("TEST_Third still unticked after another row removed", st == "unchecked", st)
        others = [await p.locator(f'[data-testid="year-mismatch-check-{j}"]').get_attribute("data-state") for j in range(3) if j != it]
        chk("other rows still ticked", all(s == "checked" for s in others), others)
        ts = await toasts(p)
        chk("toast '<file> will not be suggested'", any("Heat (1996).mkv will not be suggested for renaming again" in t for t in ts), ts)
        ign = await ls(p, IGN)
        chk("ignored list stored heat path", ign == ["D:\\Movies\\Heat (1996).mkv"], ign)
        mis = await ls(p, MIS)
        chk("heat removed from stored mismatches", mis is not None and not any(m["id"] == "heat" for m in mis) and len(mis) == 3, [m["id"] for m in (mis or [])])
        chk("chip shows 3", await btn_text(p, "year-mismatch-chip") == "3 file names differ in year", await btn_text(p, "year-mismatch-chip"))
        rl = await btn_text(p, "year-mismatch-reset-ignored")
        chk("footer '1 file is set to never rename · Allow again'", rl and "1 file is set to never rename" in rl and "Allow again" in rl, rl)
        chk("dialog still open", await p.locator('[data-testid="year-mismatch-dialog"]').count() == 1)
        chk("rename label = 2", await btn_text(p, "year-mismatch-rename") == "Rename 2 files", await btn_text(p, "year-mismatch-rename"))
        await p.screenshot(path=".screenshots/iter47_after_ignore.jpg", quality=40, full_page=False)
        # Rename ticked rows only
        await p.locator('[data-testid="year-mismatch-rename"]').click(); await p.wait_for_timeout(1500)
        ren = await p.evaluate("() => window.__renames")
        print("renames:", ren)
        names = sorted(x[1] for x in ren)
        chk("only ticked rows renamed (Second, Fourth)", names == ["TEST_Fourth (2002).mkv", "TEST_Second (2002).mkv"], ren)
        ts = await toasts(p)
        print("toasts:", ts)
        chk("Renamed 1 file + Could not rename Second", any("Renamed 1 file" in t for t in ts) and any("Could not rename" in t and "TEST_Second" in t for t in ts), ts)
        await p.wait_for_timeout(1500)
        chip = await btn_text(p, "year-mismatch-chip")
        chk("chip = 2 (failed Second + unticked Third)", chip == "2 file names differ in year", chip)
        mis = await ls(p, MIS)
        chk("stored mismatches = second, third", sorted(m["id"] for m in mis) == ["second", "third"], [m["id"] for m in mis])
        L = await saved(p)
        chk("fourth renamed on card", L["fourth"]["file_name"] == "TEST_Fourth (2002).mkv")
        chk("heat untouched (not renamed)", L["heat"]["file_name"] == "Heat (1996).mkv")
        # Reload persistence
        await p.reload(); await p.wait_for_timeout(3000)
        chip = await btn_text(p, "year-mismatch-chip")
        chk("after reload chip = 2, heat gone", chip == "2 file names differ in year", chip)
        chk("ignored persisted after reload", await ls(p, IGN) == ["D:\\Movies\\Heat (1996).mkv"])
        # Re-run Fix: make heat need a rating again so it gets checked and mismatches again
        await p.evaluate("""() => { const L = JSON.parse(sessionStorage.getItem('fakeLibFile')); const arr = Array.isArray(L) ? L : L.movies;
            arr.forEach(m => { if (m.id === 'heat') { m.rating = 0; m.gap_checked_at = null; } });
            sessionStorage.setItem('fakeLibFile', JSON.stringify(L)); }""")
        await p.reload(); await p.wait_for_timeout(3000)
        n0 = len(tm.details)
        await run_fix(p)
        print("tmdb details on rerun:", tm.details[n0:])
        chk("heat was re-checked on second run", "movie/949" in tm.details[n0:], tm.details[n0:])
        ts = await toasts(p)
        print("toasts rerun:", ts)
        r = await rows(p) if await p.locator('[data-testid="year-mismatch-dialog"]').count() else []
        print("rows rerun:", r)
        chk("heat NOT re-added on later run (dialog)", not any("Heat" in x for x in r), r)
        mis = await ls(p, MIS)
        chk("heat NOT in stored mismatches after rerun", not any(m["id"] == "heat" for m in mis), [m["id"] for m in mis])
        chk("OBS: fill toast mismatch count excludes ignored", not any("differ in year" in t and "3 file names" in t for t in ts), ts)
        # Allow again
        if not await p.locator('[data-testid="year-mismatch-dialog"]').count():
            await p.locator('[data-testid="year-mismatch-chip"]').click(); await p.wait_for_timeout(500)
        await p.locator('[data-testid="year-mismatch-reset-ignored"]').click(); await p.wait_for_timeout(600)
        ts = await toasts(p)
        chk("reset toast", any("can be suggested again on the next check" in t for t in ts), ts)
        chk("ignored list cleared", await ls(p, IGN) == [], await ls(p, IGN))
        chk("reset link hidden", await p.locator('[data-testid="year-mismatch-reset-ignored"]').count() == 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


def mis_entry(id_, title, path, fy, ny):
    name = path.split("\\")[-1]
    return {"id": id_, "title": title, "file_path": path, "file_name": name, "fileYear": fy, "foundYear": ny, "newName": name.replace(str(fy), str(ny))}


async def run_prune():
    seeds = [mis_entry("heat", "Heat", "D:\\Movies\\Heat (1996).mkv", 1996, 1995),
             mis_entry("gone", "TEST_Gone", "D:\\Movies\\TEST_Gone (2001).mkv", 2001, 2000),
             mis_entry("matrix", "TEST_Matrix", "D:\\Old\\TEST_Matrix (1999).mkv", 1999, 1998)]
    extra = "localStorage.setItem('%s', %s);" % (MIS, json.dumps(json.dumps(seeds)))
    ctx, p, tm, wd, errs = await open_ctx(fix_lib(), key=False, extra=extra)
    try:
        await p.wait_for_timeout(1500)
        chip = await btn_text(p, "year-mismatch-chip")
        chk("chip shows 1 (live only)", chip == "1 file name differs in year", chip)
        mis = await ls(p, MIS)
        chk("stored list pruned to heat", [m["id"] for m in mis] == ["heat"], [m["id"] for m in mis])
        await p.locator('[data-testid="year-mismatch-chip"]').click(); await p.wait_for_timeout(500)
        r = await rows(p)
        chk("dialog lists only Heat", len(r) == 1 and "Heat" in r[0], r)
        await p.screenshot(path=".screenshots/iter47_prune.jpg", quality=40, full_page=False)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
    # Empty library: must not prune
    ctx, p, tm, wd, errs = await open_ctx([], key=False, extra=extra)
    try:
        await p.wait_for_timeout(2000)
        mis = await ls(p, MIS)
        chk("empty library: stored list not pruned (3 kept)", mis and len(mis) == 3, mis and len(mis))
        chk("empty library: no chip", await p.locator('[data-testid="year-mismatch-chip"]').count() == 0)
        chk("no page errors (empty)", not errs, errs)
    finally:
        await ctx.close()
