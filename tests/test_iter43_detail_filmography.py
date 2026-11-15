# Iteration 43: Library detail window -> cast/director click opens FilmographyDialog (same as Stats), nav from popup, Show all in Library
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter43_detail_filmography.py').read(), g); await g['run_detail_people']() / run_detail_missing()
g42 = {'page': page}
exec(open('/app/tests/test_iter42_genres_person.py').read(), g42)
card, A, open_ctx, chk, lst, URL, film_lib, close, PersonMock, chip, titles = (g42[k] for k in ('card', 'A', 'open_ctx', 'chk', 'lst', 'URL', 'film_lib', 'close', 'PersonMock', 'chip', 'titles'))
dlg = g42['g41']['dlg']


def lib43():
    lib = film_lib()
    for m in lib:
        if m.get("directors") and not m.get("director"):
            m["director"] = ", ".join(d["name"] for d in m["directors"])
    # card with only directors[] (no director string) - to observe gating
    lib.append(card(612, title="TEST_OnlyArr", year=2014, genres=["Drama"], cast=[A("Actor Z", "Zed")], directors=[{"name": "Dir Z", "profile_path": None}]))
    return lib


async def detail_title(p):
    loc = p.locator('[data-testid="movie-title-editable"]')
    return (await loc.inner_text()) if await loc.count() else None


async def open_detail(p, title):
    await p.locator('h3.font-medium.truncate', has_text=title).first.click()
    await p.wait_for_timeout(800)
    return await detail_title(p)


async def run_detail_people():
    ctx, p, mock, errs = await open_ctx(lib43(), key=False, auto="off")
    try:
        await p.wait_for_timeout(1000)
        t = await open_detail(p, "TEST_F1")
        chk("detail opened TEST_F1", t and "TEST_F1" in t, t)
        cm = await lst(p, "cast-member-")
        print("cast members:", cm)
        tag = await p.locator('[data-testid="cast-member-0"]').evaluate("e => e.tagName + '|' + e.type")
        chk("cast-member is a button", tag == "BUTTON|button", tag)
        await p.locator('[data-testid="cast-member-0"]').click(); await p.wait_for_timeout(600)
        d = await dlg(p)
        print("Actor X from detail:", d)
        chk("actor popup name", d["name"] == "Actor X", d["name"])
        chk("actor popup count 8", d["count"] == "Appears in 8 films in your library", d["count"])
        tl = [x.split(" | ")[0] for x in d["items"]]
        chk("same list as Stats", tl == ["TEST_Musical", "TEST_F6", "TEST_F5", "TEST_F4", "TEST_F3", "TEST_F2", "TEST_F1", "TEST_F10"], tl)
        chk("show-library + missing present", await p.locator('[data-testid="filmography-show-library"]').count() == 1 and await p.locator('[data-testid="filmography-missing"]').count() == 1)
        chk("header photo", await p.locator('[data-testid="filmography-dialog"] img.rounded-full').count() == 1)
        await p.screenshot(path=".screenshots/iter43_cast_popup.jpg", quality=40, full_page=False)
        chk("Escape closes popup", await close(p, "esc"))
        t = await detail_title(p)
        chk("detail still open after Escape", t and "TEST_F1" in t, t)
        # Actor Y via X button
        await p.locator('[data-testid="cast-member-2"]').click(); await p.wait_for_timeout(600)
        d = await dlg(p)
        chk("Actor Y 9 films", d["name"] == "Actor Y" and d["count"] == "Appears in 9 films in your library", d)
        chk("X closes popup", await close(p, "x"))
        chk("detail still open after X", "TEST_F1" in (await detail_title(p) or ""))
        # Cameo Guy (Himself only) -> 0 films
        await p.locator('[data-testid="cast-member-1"]').click(); await p.wait_for_timeout(600)
        d = await dlg(p)
        print("Cameo Guy:", d)
        chk("Cameo Guy popup opens (0 films, no show-library)", d["name"] == "Cameo Guy" and await p.locator('[data-testid="filmography-show-library"]').count() == 0, d)
        await close(p)
        # Director
        dl = await lst(p, "movie-director-link-")
        print("director links:", dl, await p.locator('[data-testid="movie-director"]').inner_text())
        await p.locator('[data-testid="movie-director-link-0"]').click(); await p.wait_for_timeout(600)
        d = await dlg(p)
        chk("Dir A popup Directed 8", d["name"] == "Dir A" and d["count"] == "Directed 8 films in your library", d)
        chk("director items no 'as'", not any(" as " in x for x in d["items"]), d["items"][:2])
        await close(p)
        chk("detail still open after director popup", "TEST_F1" in (await detail_title(p) or ""))
        # Nav: from popup item -> other film
        await p.locator('[data-testid="cast-member-0"]').click(); await p.wait_for_timeout(600)
        await p.locator('[data-testid="filmography-item-1"]').click(); await p.wait_for_timeout(1500)
        chk("popup closed after item click", await p.locator('[data-testid="filmography-dialog"]').count() == 0)
        t = await detail_title(p)
        chk("detail switched to TEST_F6", t and "TEST_F6" in t, t)
        chk("only one detail window", await p.locator('[data-testid="detail-close-x"]').count() == 1)
        chk("open= removed", "open=" not in p.url, p.url)
        # same film
        await p.locator('[data-testid="cast-member-0"]').click(); await p.wait_for_timeout(600)
        await p.locator('[data-testid="filmography-item-1"]').click(); await p.wait_for_timeout(1500)
        t = await detail_title(p)
        chk("same film re-opens TEST_F6", t and "TEST_F6" in t and await p.locator('[data-testid="filmography-dialog"]').count() == 0, t)
        # Escape closes detail now
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        chk("Escape closes detail when no popup", await detail_title(p) is None)
        # Multi director string
        t = await open_detail(p, "TEST_Musical")
        dl = await lst(p, "movie-director-link-")
        print("Musical directors:", dl)
        chk("2 director links Dir B, Dir C", dl == ["Dir B", "Dir C"], dl)
        for i, n in enumerate(["Dir B", "Dir C"]):
            await p.locator(f'[data-testid="movie-director-link-{i}"]').click(); await p.wait_for_timeout(600)
            d = await dlg(p)
            chk(f"{n} popup Directed 1 film", d["name"] == n and d["count"] == "Directed 1 film in your library" and d["items"][0].startswith("TEST_Musical"), d)
            await close(p)
        # Show all in Library from detail (director)
        await p.locator('[data-testid="movie-director-link-0"]').click(); await p.wait_for_timeout(600)
        await p.locator('[data-testid="filmography-show-library"]').click(); await p.wait_for_timeout(1500)
        c = await chip(p); tt = await titles(p)
        chk("show-all: popup+detail closed", await p.locator('[data-testid="filmography-dialog"]').count() == 0 and await detail_title(p) is None)
        chk("show-all: chip Dir B · 1 film, grid 1", c == "Dir B · 1 film" and tt == ["TEST_Musical"], (c, tt, p.url))
        await p.locator('[data-testid="person-filter-clear"]').click(); await p.wait_for_timeout(800)
        chk("clear restores", await chip(p) is None and len(await titles(p)) > 1)
        # Show all from cast popup
        await open_detail(p, "TEST_F2")
        await p.locator('[data-testid="cast-member-0"]').click(); await p.wait_for_timeout(600)
        await p.locator('[data-testid="filmography-show-library"]').click(); await p.wait_for_timeout(1500)
        c = await chip(p); tt = await titles(p)
        chk("cast show-all: chip Actor X · 8 films", c == "Actor X · 8 films" and len(tt) == 8 and await detail_title(p) is None, (c, len(tt)))
        await p.screenshot(path=".screenshots/iter43_show_all.jpg", quality=40, full_page=False)
        # item click while person filter active -> film outside filter?
        await open_detail(p, "TEST_F2")
        await p.locator('[data-testid="cast-member-2"]').click(); await p.wait_for_timeout(600)  # Actor Y includes TEST_F7 (not in Actor X filter)
        d = await dlg(p)
        idx = [x.split(" | ")[0] for x in d["items"]].index("TEST_F7")
        await p.locator(f'[data-testid="filmography-item-{idx}"]').click(); await p.wait_for_timeout(1500)
        t = await detail_title(p)
        print("after nav with filter active: detail", t, "chip", await chip(p), "url", p.url)
        chk("nav to film outside active person filter opens it", t and "TEST_F7" in t, t)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        if await chip(p):
            await p.locator('[data-testid="person-filter-clear"]').click(); await p.wait_for_timeout(600)
        # directors[] only, no director string
        await open_detail(p, "TEST_OnlyArr")
        chk("OBS: directors[]-only card shows Directed by", await p.locator('[data-testid="movie-director"]').count() == 1)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        # Clear cast
        await open_detail(p, "TEST_F3")
        await p.locator('[data-testid="clear-cast-btn"]').click(); await p.wait_for_timeout(700)
        chk("clear cast removes cast section, no popup", await p.locator('[data-testid="cast-section"]').count() == 0 and await p.locator('[data-testid="filmography-dialog"]').count() == 0)
        chk("detail still open after clear", "TEST_F3" in (await detail_title(p) or ""))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_detail_missing():
    mock = PersonMock()
    ctx, p, _, errs = await open_ctx(lib43(), key=True, auto="off", mock=mock)
    try:
        await p.wait_for_timeout(1500)
        await open_detail(p, "TEST_F1")
        await p.locator('[data-testid="cast-member-0"]').click(); await p.wait_for_timeout(300)
        chk("missing loading", await p.locator('[data-testid="filmography-missing-loading"]').count() == 1)
        await p.wait_for_timeout(2500)
        rows = [r for r in await lst(p, "filmography-missing-") if r and not r.startswith("Well-known")]
        tl = [r.split(" | ")[0] for r in rows]
        print("missing from detail:", tl)
        chk("missing rows Miss10..Miss3", tl == ["Miss10", "Miss9", "Miss8", "Miss7", "Miss6", "Miss5", "Miss4", "Miss3"], tl)
        await p.screenshot(path=".screenshots/iter43_missing.jpg", quality=40, full_page=False)
        await close(p)
        await p.locator('[data-testid="movie-director-link-0"]').click(); await p.wait_for_timeout(2500)
        rows = [r for r in await lst(p, "filmography-missing-") if r and not r.startswith("Well-known")]
        tl = [r.split(" | ")[0] for r in rows]
        chk("director missing Directed2, Directed1", tl == ["Directed2", "Directed1"], tl)
        await close(p)
        chk("detail still open", "TEST_F1" in (await detail_title(p) or ""))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
