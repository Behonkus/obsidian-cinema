# Iteration 41: Stats filmography dialog (actors, directors, actor-director pairs) + Library ?open=<id>
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter41_filmography.py').read(), g); await g['run_filmography']()
g40 = {'page': page}
exec(open('/app/tests/test_iter40_aka_directors.py').read(), g40)
card, A, open_ctx, chk, lst, URL = g40['card'], g40['A'], g40['open_ctx'], g40['chk'], g40['lst'], g40['URL']


def film_lib():
    lib = []
    for i in range(1, 7):
        cast = [A("Actor X", f"Hero{i}", photo="https://image.tmdb.org/t/p/w185/x.jpg"), A("Cameo Guy", "Himself"), A("Actor Y")]
        if i <= 2:
            cast.append(A("Actor P", f"P{i}"))
        lib.append(card(600 + i, title=f"TEST_F{i}", year=2000 + i, rating=7.0 + i * 0.1, genres=["Drama" if i % 2 else "Action"],
                        cast=cast, directors=[{"name": "Dir A", "profile_path": None}]))
    # Actor X only as Himself -> excluded for Actor X; counts for Dir A
    lib.append(card(607, title="TEST_F7", year=2010, rating=6, genres=["Comedy"], cast=[A("Actor X", "Himself"), A("Actor Y")],
                    directors=[{"name": "Dir A", "profile_path": None}]))
    # concert (Music, mostly self credits) -> excluded entirely
    lib.append(card(608, title="TEST_Concert", year=2011, rating=8, genres=["Music"],
                    cast=[A("Actor X", "Lead"), A("Band1", "Himself"), A("Band2", "Herself")], directors=[{"name": "Dir A", "profile_path": None}]))
    # Music film with real acting -> counts; director string split
    lib.append(card(609, title="TEST_Musical", year=2012, rating=7.5, genres=["Music", "Drama"],
                    cast=[A("Actor X", "Singer"), A("Actor Y"), A("Actor Q")], director="Dir B, Dir C"))
    # Actor P is 6th acting credit (outside the top-5 used for pairs)
    lib.append(card(610, title="TEST_F10", year=1999, rating=6.5, genres=["Thriller"],
                    cast=[A("Actor X", "Old"), A("Actor Y"), A("E1"), A("E2"), A("E3"), A("Actor P", "P10")],
                    directors=[{"name": "Dir A", "profile_path": None}]))
    lib.append({"id": "tvz", "title": "TEST_TVZ", "media_type": "tv", "tmdb_id": 990, "genres": ["Drama"], "rating": 9,
                "file_name": "tvz S01E01.mkv", "file_path": "D:\\TV\\Z\\tvz S01E01.mkv", "cast": [A("Actor X")], "director": "Dir A"})
    lib.append(card(611, title="TEST_Doc", year=2013, genres=["Documentary"], cast=[A("Actor X", "Narrator")], directors=[{"name": "Dir A", "profile_path": None}]))
    return lib


async def dlg(p):
    return {
        "name": await p.locator('[data-testid="filmography-name"]').inner_text(),
        "count": await p.locator('[data-testid="filmography-count"]').inner_text(),
        "items": await lst(p, "filmography-item-"),
    }


async def pick(p, tid):
    await p.locator(f'[data-testid="{tid}"]').scroll_into_view_if_needed()
    await p.locator(f'[data-testid="{tid}"]').click()
    await p.wait_for_timeout(500)
    ok = await p.locator('[data-testid="filmography-dialog"]').count() == 1
    return (await dlg(p)) if ok else None


async def close(p, how="esc"):
    if how == "esc":
        await p.keyboard.press("Escape")
    else:
        await p.locator('[data-testid="filmography-dialog"] button:has(svg.lucide-x)').last.click()
    await p.wait_for_timeout(400)
    return await p.locator('[data-testid="filmography-dialog"]').count() == 0


async def find_row(p, prefix, text):
    rows = await lst(p, prefix)
    for i, r in enumerate(rows):
        if text in r:
            return f"{prefix}{i}", r
    return None, rows


async def run_filmography():
    ctx, p, mock, errs = await open_ctx(film_lib(), key=False, auto="off", url=URL + "stats")
    try:
        await p.wait_for_timeout(1500)
        top = await lst(p, "top-actor-"); cham = await lst(p, "chameleon-actor-"); rated = await lst(p, "rated-actor-")
        print("top:", top); print("cham:", cham); print("rated:", rated)
        tid, row = await find_row(p, "top-actor-", "Actor X")
        d = await pick(p, tid)
        print("Actor X dialog:", d)
        chk("actor dialog opens", d is not None)
        if d:
            chk("name", d["name"] == "Actor X", d["name"])
            chk("count 8 films", d["count"] == "Appears in 8 films in your library", d["count"])
            chk("count matches top badge", row.endswith("| 8") or "8" in row.split("|")[-1], row)
            titles = [x.split(" | ")[0] for x in d["items"]]
            chk("newest first & excludes F7/Concert/TV/Doc", titles == ["TEST_Musical", "TEST_F6", "TEST_F5", "TEST_F4", "TEST_F3", "TEST_F2", "TEST_F1", "TEST_F10"], titles)
            chk("item format year · as char + rating", d["items"] and d["items"][1] == "TEST_F6 | 2006 · as Hero6 | ★ 7.6", d["items"][:2])
            chk("poster img in item", await p.locator('[data-testid="filmography-item-0"] img').count() == 1)
            chk("header photo", await p.locator('[data-testid="filmography-dialog"] img.rounded-full').count() == 1)
            await p.screenshot(path=".screenshots/iter41_actor_dialog.jpg", quality=40, full_page=False)
            chk("Escape closes", await close(p, "esc"))
        tid, row = await find_row(p, "chameleon-actor-", "Actor Y")
        d = await pick(p, tid) if tid else None
        print("cham Actor Y:", d)
        chk("chameleon Actor Y: 9 films (incl F7)", d and d["count"] == "Appears in 9 films in your library", d and d["count"])
        if d: chk("close button closes", await close(p, "x"))
        if rated:
            d = await pick(p, "rated-actor-0"); print("rated-0:", d); await close(p)
        # directors
        most = await lst(p, "director-most-"); rng = await lst(p, "director-range-"); drated = await lst(p, "director-rated-"); pairs = await lst(p, "director-pairs-")
        print("most:", most); print("range:", rng); print("drated:", drated); print("pairs:", pairs)
        tid, row = await find_row(p, "director-most-", "Dir A")
        d = await pick(p, tid)
        print("Dir A:", d)
        chk("Dir A: Directed 8 films", d and d["count"] == "Directed 8 films in your library", d and d["count"])
        if d:
            titles = [x.split(" | ")[0] for x in d["items"]]
            chk("Dir A list (no concert/tv/doc), newest first", titles == ["TEST_F7", "TEST_F6", "TEST_F5", "TEST_F4", "TEST_F3", "TEST_F2", "TEST_F1", "TEST_F10"], titles)
            chk("director items have no 'as'", not any(" as " in x for x in d["items"]), d["items"][:2])
            await close(p)
        tid, row = await find_row(p, "director-most-", "Dir B")
        d = await pick(p, tid)
        chk("Dir B (split string) 1 film TEST_Musical", d and d["count"] == "Directed 1 film in your library" and d["items"][0].startswith("TEST_Musical"), d)
        if d: await close(p)
        for pf in ("director-range-", "director-rated-"):
            tid, row = await find_row(p, pf, "Dir A")
            if tid:
                d = await pick(p, tid)
                chk(f"{pf} Dir A dialog", d and d["count"] == "Directed 8 films in your library", d and d["count"])
                await close(p)
        # pairs
        for idx, r in enumerate(pairs):
            d = await pick(p, f"director-pairs-{idx}")
            badge = r.split(" | ")[-1]
            n = d["count"].split()[1] if d else None
            chk(f"pair row {idx} '{r}' count matches dialog", d and n == badge and d["count"].startswith("Together"), d and (d["name"], d["count"]))
            await close(p)
        # navigate
        tid, row = await find_row(p, "top-actor-", "Actor X")
        await pick(p, tid)
        await p.locator('[data-testid="filmography-item-1"]').click()
        await p.wait_for_timeout(1800)
        chk("dialog closed after item click", await p.locator('[data-testid="filmography-dialog"]').count() == 0)
        t = await p.locator('[data-testid="movie-title-editable"]').inner_text() if await p.locator('[data-testid="movie-title-editable"]').count() else None
        chk("library detail opened for TEST_F6", t and "TEST_F6" in t, t)
        chk("?open removed from URL", "open=" not in p.url, p.url)
        await p.screenshot(path=".screenshots/iter41_nav_detail.jpg", quality=40, full_page=False)
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(500)
        # reload library without open
        await p.reload(); await p.wait_for_timeout(2500)
        chk("library loads normally, no detail open", await p.locator('[data-testid="movie-title-editable"]').count() == 0)
        chk("library cards visible", await p.locator('h3.font-medium.truncate').count() > 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_bad_open():
    ctx, p, mock, errs = await open_ctx(film_lib(), key=False, auto="off", url=URL + "?open=doesnotexist")
    try:
        await p.wait_for_timeout(1000)
        chk("bad id: no detail, open removed", await p.locator('[data-testid="movie-title-editable"]').count() == 0 and "open=" not in p.url, p.url)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
    ctx, p, mock, errs = await open_ctx(film_lib(), key=False, auto="off", url=URL + "?open=m603")
    try:
        await p.wait_for_timeout(1000)
        t = await p.locator('[data-testid="movie-title-editable"]').inner_text() if await p.locator('[data-testid="movie-title-editable"]').count() else None
        chk("direct ?open=m603 opens TEST_F3", t and "TEST_F3" in t, (t, p.url))
    finally:
        await ctx.close()
