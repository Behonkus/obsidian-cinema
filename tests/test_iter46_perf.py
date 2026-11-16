# ruff: noqa: F821
# Iteration 46: performance pass regression - sidebar counts refresh (shared parsed library), Stats matches library,
# lazy pages (Stats/Settings/Collections) load, save debounce 1200ms + unmount flush persistence
# Run: g={'page':page}; exec(open('/app/tests/test_iter46_perf.py').read(), g); await g['run_perf']()
exec(open('/app/tests/test_iter37_import_type.py').read(), globals())


def chk(label, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


def pm(i, title, year, rating=7.0, poster="/p.jpg", director="Dir A", genres=("Drama",)):
    fn = f"{title} ({year}).mkv"
    return {"id": i, "title": title, "file_name": fn, "file_path": "M:\\Movies\\" + fn, "year": year, "added_at": 100 + len(i),
            "poster_path": poster, "rating": rating, "tmdb_id": 9000 + len(title), "genres": list(genres), "media_type": "movie",
            "director": director, "directors": [{"name": director}], "cast": [{"name": "Actor X", "character": "C"}],
            "metadata_updated_at": 1, "runtime": 100}


PERF_LIB = [
    pm("p1", "TEST_Alpha", 2001, 8.0), pm("p2", "TEST_Beta", 2002, 6.0, director="Dir B"),
    pm("p3", "TEST_Gamma", 2003, 0, poster=None), pm("p4", "TEST_Delta", 2004, None, poster=None),
    pm("p5", "TEST_Eps", 2005, 0), pm("p6", "TEST_Zeta", 2006, 9.0),
]


async def qf_count(p, qf):
    loc = p.locator(f'[data-testid="qf-{qf}"]')
    if not await loc.count():
        return None
    t = await loc.inner_text()
    m = re.findall(r"\d+", t)
    return int(m[-1]) if m else 0


async def open_card(p, title):
    await p.get_by_text(title, exact=True).first.click(); await p.wait_for_timeout(1000)


async def set_rating(p, val):
    await p.locator('[data-testid="edit-rating-btn"]').click(); await p.wait_for_timeout(300)
    await p.locator('[data-testid="edit-rating-input"]').fill(str(val))
    await p.locator('[data-testid="confirm-rating-btn"]').click(); await p.wait_for_timeout(200)


async def run_perf():
    ctx, p, mock, errs = await open4([dict(m) for m in PERF_LIB], [], auto="off")
    try:
        np, nr = await qf_count(p, "no-poster"), await qf_count(p, "no-rating")
        chk("initial sidebar counts no-poster=2 no-rating=3", np == 2 and nr == 3, (np, nr))
        # Delete a no-poster card -> counts update within ~2s
        await open_card(p, "TEST_Gamma")
        await p.locator('[data-testid="remove-movie-btn"]').click(); await p.wait_for_timeout(400)
        c = p.locator('[data-testid="confirm-remove-movie-btn"]')
        if await c.count():
            await c.click()
        t0 = asyncio.get_event_loop().time(); ok = False
        while asyncio.get_event_loop().time() - t0 < 4:
            await p.wait_for_timeout(250)
            if await qf_count(p, "no-poster") == 1 and await qf_count(p, "no-rating") == 2:
                ok = True; break
        el = round(asyncio.get_event_loop().time() - t0, 2)
        chk("after delete counts no-poster=1 no-rating=2", ok, (await qf_count(p, "no-poster"), await qf_count(p, "no-rating"), f"{el}s"))
        chk("counts updated within ~2s", ok and el <= 2.5, f"{el}s")
        L = await H.read_lib(p)
        chk("deleted card gone from stored library", "p3" not in L and len(L) == 5, list(L))
        # Rating edit -> no-rating count drops; reload after >1.5s persisted
        await p.keyboard.press("Escape"); await p.wait_for_timeout(300)
        await open_card(p, "TEST_Eps")
        await set_rating(p, 7.5)
        await p.wait_for_timeout(1700)
        chk("no-rating count 1 after rating edit", await qf_count(p, "no-rating") == 1, await qf_count(p, "no-rating"))
        await p.reload(); await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000); await p.wait_for_timeout(800)
        L = await H.read_lib(p)
        chk("rating 7.5 persisted after reload", L.get("p5", {}).get("rating") == 7.5, L.get("p5", {}).get("rating"))
        # Edit then immediately navigate to Stats (unmount flush)
        await open_card(p, "TEST_Delta")
        await set_rating(p, 5.5)
        await p.keyboard.press("Escape")
        await p.locator('[data-testid="nav-stats"]').click()
        await p.wait_for_selector('[data-testid="stats-page"]', timeout=15000); await p.wait_for_timeout(3500)
        L = await H.read_lib(p)
        chk("immediate nav -> rating 5.5 persisted (unmount flush)", L.get("p4", {}).get("rating") == 5.5, L.get("p4", {}).get("rating"))
        st = await p.locator('[data-testid="stats-page"]').inner_text()
        tm = re.search(r"(\d+)\s*\n\s*Total Movies", st)
        ar = re.search(r"([\d.]+)\s*\n\s*Avg Rating", st)
        pc = re.search(r"(\d+)%\s*\n\s*Poster Coverage", st)
        rated = [m["rating"] for m in L.values() if m.get("rating")]
        exp_avg = round(sum(rated) / len(rated), 1)
        print("stats:", tm and tm.group(1), ar and ar.group(1), pc and pc.group(1), "expected avg", exp_avg)
        chk("Stats Total Movies = 5", tm and tm.group(1) == "5", tm and tm.group(1))
        chk("Stats Avg Rating matches library", ar and abs(float(ar.group(1)) - exp_avg) < 0.06, (ar and ar.group(1), exp_avg))
        chk("Stats Poster Coverage 80%", pc and pc.group(1) == "80", pc and pc.group(1))
        chk("Stats shows a director (Dir A)", "Dir A" in st)
        chk("sidebar no-rating 0 on stats page", await qf_count(p, "no-rating") in (0, None), await qf_count(p, "no-rating"))
        # Stats director -> filmography dialog
        d = p.get_by_text("Dir A", exact=True).first
        if await d.count():
            await d.click(); await p.wait_for_timeout(800)
            dlg = p.locator('[role="dialog"]')
            dt = await dlg.first.inner_text() if await dlg.count() else ""
            chk("director filmography dialog lists library films", "TEST_Alpha" in dt, dt[:200].replace("\n", " | "))
            await p.keyboard.press("Escape"); await p.wait_for_timeout(300)
        # Lazy pages via client nav
        for nav, needle in [("nav-settings", "Settings"), ("nav-collections", "Collection"), ("nav-library", None)]:
            await p.locator(f'[data-testid="{nav}"]').click(); await p.wait_for_timeout(1500)
            body = await p.inner_text("body")
            chk(f"{nav} rendered (no loading stuck)", await p.locator('[data-testid=page-loading]').count() == 0 and (needle is None or needle in body))
        chk("library page back with 5 cards", await p.locator('[data-testid="update-library-btn"]').count() == 1)
        await p.screenshot(path=".screenshots/iter46_library.jpg", quality=40, full_page=False)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
