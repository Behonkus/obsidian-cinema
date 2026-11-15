# Iteration 42: genre normalization (library/stats), Show all in Library person filter, Missing filmography (TMDB person credits)
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter42_genres_person.py').read(), g); await g['run_genres']() / run_person_filter() / run_missing() / run_missing_nokey()
import json, re, asyncio
g41 = {'page': page}
exec(open('/app/tests/test_iter41_filmography.py').read(), g41)
card, A, open_ctx, chk, lst, URL, film_lib, pick, close, find_row = (g41[k] for k in ('card', 'A', 'open_ctx', 'chk', 'lst', 'URL', 'film_lib', 'pick', 'close', 'find_row'))


# ---- Genre normalization ----
def genre_lib():
    return [
        card(701, title="TEST_G1", genres=["Action & Adventure", "Action", "Drama"]),
        card(702, title="TEST_G2", genres=[{"id": 10765, "name": "Sci-Fi & Fantasy"}, {"id": 878, "name": "Science Fiction"}]),
        card(703, title="TEST_G3", genres=["War & Politics"]),
        card(704, title="TEST_G4", genres=["Kids", "Family"]),
        card(705, title="TEST_G5", genres=["Sci-Fi"]),
        card(706, title="TEST_G6", genres=["Action"]),
        card(707, title="TEST_G7", genres=["War", "Comedy"]),
        card(708, title="TEST_G8", genres=[]),
    ]


async def genre_items(p):
    await p.locator('[data-testid="genre-dropdown"]').click()
    await p.wait_for_timeout(400)
    items = await p.evaluate("() => Array.from(document.querySelectorAll('[role=menuitem]')).map(e => e.innerText.split('\\n').map(x=>x.trim()).filter(Boolean).join(' | '))")
    return items


async def run_genres():
    ctx, p, mock, errs = await open_ctx(genre_lib(), key=False, auto="off")
    try:
        await p.wait_for_timeout(1500)
        items = await genre_items(p)
        print("genre items:", items)
        names = [i.split(" | ")[0] for i in items if i != "All Genres"]
        chk("no combined genres in dropdown", not any(x in names for x in ["Action & Adventure", "Sci-Fi & Fantasy", "War & Politics", "Kids", "Sci-Fi"]), names)
        chk("no duplicates", len(names) == len(set(names)), names)
        exp = {"Action": "2", "Science Fiction": "2", "War": "2", "Family": "1", "Drama": "1", "Comedy": "1"}
        got = {i.split(" | ")[0]: i.split(" | ")[-1] for i in items if " | " in i}
        chk("expected counts", got == exp, got)
        await p.screenshot(path=".screenshots/iter42_genre_dropdown.jpg", quality=40, full_page=False)
        await p.get_by_role("menuitem").filter(has_text=re.compile(r"^Action")).first.click()
        await p.wait_for_timeout(800)
        titles = await p.evaluate("() => Array.from(document.querySelectorAll('h3.font-medium.truncate')).map(e => e.innerText)")
        chk("Action filter shows G1+G6", sorted(titles) == ["TEST_G1", "TEST_G6"], titles)
        await p.wait_for_timeout(1200)
        saved = await p.evaluate("() => { const s = sessionStorage.getItem('fakeLibFile') || localStorage.getItem('obsidian_cinema_local_movies'); return JSON.parse(s).map(m => [m.title, m.genres]); }")
        print("persisted:", saved)
        sd = dict((t, g) for t, g in saved)
        chk("persisted normalized", sd.get("TEST_G1") == ["Action", "Drama"] and sd.get("TEST_G2") == ["Science Fiction"] and sd.get("TEST_G3") == ["War"]
            and sd.get("TEST_G4") == ["Family"] and sd.get("TEST_G5") == ["Science Fiction"] and sd.get("TEST_G7") == ["War", "Comedy"], sd)
        # Stats
        await p.goto(URL + "stats"); await p.wait_for_timeout(2000)
        txt = await p.evaluate("() => { const h = Array.from(document.querySelectorAll('*')).find(e => e.childNodes.length && e.innerText && e.innerText.startsWith('Genre Totals')); return h ? h.closest('.rounded-lg, [class*=card]')?.innerText || h.innerText : ''; }")
        print("stats genre totals:", txt.replace("\n", " | ")[:400])
        chk("stats has no combined genres", "&" not in txt and "Kids" not in txt and "Sci-Fi" not in txt, txt[:300])
        chk("stats 6 genres badge", "6 genres" in txt, txt[:80])
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_genres_stats_direct():
    # Stats page opened first (no library load) must normalize too
    ctx, p, mock, errs = await open_ctx(genre_lib(), key=False, auto="off", url=URL + "stats")
    try:
        await p.wait_for_timeout(1500)
        txt = await p.evaluate("() => document.body.innerText")
        i = txt.find("Genre Totals")
        seg = txt[i:i + 300]
        print("stats direct:", seg.replace("\n", " | "))
        chk("stats direct: no combined", "&" not in seg and "Kids" not in seg and "Sci-Fi" not in seg, seg)
        chk("stats direct 6 genres", "6 genres" in seg, seg[:60])
    finally:
        await ctx.close()


# ---- Person filter ----
async def chip(p):
    c = p.locator('[data-testid="person-filter-chip"]')
    return (await c.inner_text()).split("\n")[0].strip() if await c.count() else None


async def titles(p):
    return await p.evaluate("() => Array.from(document.querySelectorAll('h3.font-medium.truncate')).map(e => e.innerText)")


async def run_person_filter():
    ctx, p, mock, errs = await open_ctx(film_lib(), key=False, auto="off", url=URL + "stats")
    try:
        await p.wait_for_timeout(1500)
        all_n = None
        cases = [("top-actor-", "Actor X", "actor", 8), ("director-most-", "Dir A", "director", 8), ("director-most-", "Dir B", "director", 1)]
        for pf, name, role, n in cases:
            tid, row = await find_row(p, pf, name)
            d = await pick(p, tid)
            btn = p.locator('[data-testid="filmography-show-library"]')
            chk(f"{name}: show-library button visible", await btn.count() == 1)
            await btn.click(); await p.wait_for_timeout(1500)
            print(name, "url:", p.url)
            chk(f"{name}: url has person & role", f"role={role}" in p.url and "person=" in p.url, p.url)
            c = await chip(p); t = await titles(p)
            print(name, "chip:", c, "titles:", t)
            chk(f"{name}: chip text", c == f"{name} · {n} {'film' if n == 1 else 'films'}", c)
            chk(f"{name}: grid count == {n}", len(t) == n, t)
            if name == "Actor X":
                chk("Actor X grid excludes F7/Concert/TV/Doc", not any(x in t for x in ["TEST_F7", "TEST_Concert", "TEST_TVZ", "TEST_Doc"]), t)
                await p.screenshot(path=".screenshots/iter42_person_chip.jpg", quality=40, full_page=False)
                # combine with search
                s = p.locator('input[placeholder*="Search" i]').first
                if await s.count():
                    await s.fill("TEST_F1"); await p.wait_for_timeout(800)
                    t2 = await titles(p)
                    chk("search combines with person filter", sorted(t2) == ["TEST_F1", "TEST_F10"], t2)
                    await s.fill(""); await p.wait_for_timeout(600)
                # combine with genre
                items = await p.locator('[data-testid="genre-dropdown"]').count()
                if items:
                    await p.locator('[data-testid="genre-dropdown"]').click(); await p.wait_for_timeout(300)
                    await p.get_by_role("menuitem").filter(has_text=re.compile(r"^Action")).first.click(); await p.wait_for_timeout(700)
                    t3 = await titles(p)
                    chk("genre Action combines (F2,F4,F6)", sorted(t3) == ["TEST_F2", "TEST_F4", "TEST_F6"], t3)
                    await p.locator('[data-testid="genre-dropdown"]').click(); await p.wait_for_timeout(300)
                    await p.get_by_role("menuitem", name="All Genres").click(); await p.wait_for_timeout(500)
            await p.locator('[data-testid="person-filter-clear"]').click(); await p.wait_for_timeout(800)
            t = await titles(p)
            chk(f"{name}: clear restores all", await chip(p) is None and len(t) > n and "person=" not in p.url, (len(t), p.url))
            all_n = len(t)
            await p.goto(URL + "stats"); await p.wait_for_timeout(1500)
        # pair
        pairs = await lst(p, "director-pairs-")
        print("pairs:", pairs)
        if pairs:
            d = await pick(p, "director-pairs-0")
            n = int(d["count"].split()[1])
            await p.locator('[data-testid="filmography-show-library"]').click(); await p.wait_for_timeout(1500)
            print("pair url:", p.url)
            c = await chip(p); t = await titles(p)
            print("pair chip:", c, t)
            chk("pair url role=pair & director", "role=pair" in p.url and "director=" in p.url, p.url)
            chk("pair grid count == dialog", len(t) == n and c and c.endswith(f"{n} films" if n != 1 else "1 film") and " & " in c, (c, len(t), n))
        # direct URL with unknown person
        await p.goto(URL + "?person=Nobody%20Here&role=actor"); await p.wait_for_timeout(1500)
        c = await chip(p); t = await titles(p)
        print("unknown:", c, t)
        chk("unknown person -> 0 films chip, empty grid", c == "Nobody Here · 0 films" and len(t) == 0, (c, t))
        await p.screenshot(path=".screenshots/iter42_unknown_person.jpg", quality=40, full_page=False)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


# ---- Missing films ----
class PersonMock:
    def __init__(self):
        self.calls = []
        self.opened = []

    async def handle(self, route):
        url = route.request.url
        hdr = {"Access-Control-Allow-Origin": "*"}
        self.calls.append(url)
        body = {"results": []}
        if "/search/person" in url:
            q = re.search(r"query=([^&]+)", url).group(1).replace("+", " ").replace("%20", " ")
            await asyncio.sleep(0.8)
            if q == "Actor X":
                body = {"results": [
                    {"id": 11, "name": "Actor X", "known_for_department": "Directing"},
                    {"id": 12, "name": "actor x", "known_for_department": "Acting"},
                    {"id": 13, "name": "Actor Xavier", "known_for_department": "Acting"}]}
            elif q == "Actor Y":
                body = {"results": [{"id": 21, "name": "Actor Y", "known_for_department": "Acting"}]}
            elif q == "Dir A":
                body = {"results": [{"id": 31, "name": "Dir A", "known_for_department": "Acting"}, {"id": 32, "name": "Dir A", "known_for_department": "Directing"}]}
        m = re.search(r"/person/(\d+)/movie_credits", url)
        if m:
            pid = int(m.group(1))
            if pid == 12:
                cast = [{"id": 900 + i, "title": f"Miss{i}", "release_date": f"{1990 + i}-05-01", "vote_count": i * 100, "vote_average": 6 + i * 0.1,
                         "character": f"Role{i}", "poster_path": "/p.jpg" if i % 2 else None, "genre_ids": [18]} for i in range(1, 11)]
                cast += [
                    {"id": 601, "title": "Owned F1", "release_date": "2001-01-01", "vote_count": 99999, "character": "Hero1"},
                    {"id": 950, "title": "DocFilm", "release_date": "2005-01-01", "vote_count": 50000, "genre_ids": [99, 18]},
                    {"id": 951, "title": "FutureFilm", "release_date": "2099-01-01", "vote_count": 40000},
                    {"id": 952, "title": "NoDate", "release_date": "", "vote_count": 30000},
                    {"id": 953, "title": "SelfCameo", "release_date": "2010-01-01", "vote_count": 20000, "character": "Himself"},
                    {"id": 910, "title": "Miss10", "release_date": "2000-05-01", "vote_count": 1000, "character": "Dup"},
                ]
                body = {"cast": cast, "crew": []}
            elif pid == 21:
                body = {"cast": [{"id": 601, "title": "Owned", "release_date": "2001-01-01", "vote_count": 10, "character": "c"}], "crew": []}
            elif pid == 32:
                body = {"cast": [{"id": 970, "title": "ActedOnly", "release_date": "2000-01-01", "vote_count": 9000, "character": "x"}],
                        "crew": [{"id": 980, "title": "Directed1", "release_date": "2003-01-01", "vote_count": 500, "job": "Director"},
                                 {"id": 981, "title": "Produced", "release_date": "2004-01-01", "vote_count": 9000, "job": "Producer"},
                                 {"id": 982, "title": "Directed2", "release_date": "2006-01-01", "vote_count": 800, "job": "Director"},
                                 {"id": 603, "title": "OwnedDir", "release_date": "2003-01-01", "vote_count": 9999, "job": "Director"}]}
            elif pid == 31:
                body = {"cast": [], "crew": [{"id": 990, "title": "WRONG_PERSON", "release_date": "2000-01-01", "vote_count": 1, "job": "Director"}]}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)


async def run_missing():
    mock = PersonMock()
    ctx, p, _, errs = await open_ctx(film_lib(), key=True, auto="off", url=URL + "stats", mock=mock)
    await ctx.add_init_script("window.__opened=[]; const _w = () => { if (window.electronAPI) { const o = window.electronAPI; window.electronAPI = new Proxy(o, {get(t,k){ if(k==='openExternal') return (u)=>{window.__opened.push(u); return Promise.resolve(true);}; return t[k];}}); } }; _w();")
    try:
        await p.reload(); await p.wait_for_timeout(2000)
        tid, row = await find_row(p, "top-actor-", "Actor X")
        await p.locator(f'[data-testid="{tid}"]').click()
        await p.wait_for_timeout(300)
        chk("missing section present", await p.locator('[data-testid="filmography-missing"]').count() == 1)
        chk("loading state shown", await p.locator('[data-testid="filmography-missing-loading"]').count() == 1)
        await p.wait_for_timeout(2000)
        rows = await lst(p, "filmography-missing-")
        rows = [r for r in rows if r and not r.startswith("Well-known")]
        print("missing Actor X:", rows)
        tl = [r.split(" | ")[0] for r in rows]
        chk("8 rows, vote_count desc", tl == ["Miss10", "Miss9", "Miss8", "Miss7", "Miss6", "Miss5", "Miss4", "Miss3"], tl)
        chk("row format year · as char · rating", rows and rows[0].startswith("Miss10 | 2000 · as Role10") and "★ 7.0" in rows[0], rows[:1])
        chk("excludes owned/doc/future/nodate/himself", not any(x in tl for x in ["Owned F1", "DocFilm", "FutureFilm", "NoDate", "SelfCameo"]), tl)
        chk("used Acting person id 12", any("/person/12/movie_credits" in u for u in mock.calls), [u for u in mock.calls if "person" in u])
        await p.screenshot(path=".screenshots/iter42_missing.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="filmography-missing-0"]').click(); await p.wait_for_timeout(500)
        opened = await p.evaluate("() => window.__opened")
        chk("click opens TMDB url via openExternal", opened == ["https://www.themoviedb.org/movie/910"], opened)
        await close(p)
        # Actor Y -> all owned
        tid, row = await find_row(p, "top-actor-", "Actor Y")
        if tid:
            await p.locator(f'[data-testid="{tid}"]').click(); await p.wait_for_timeout(2500)
            chk("Actor Y empty message", await p.locator('[data-testid="filmography-missing-empty"]').count() == 1)
            await close(p)
        # Director
        tid, row = await find_row(p, "director-most-", "Dir A")
        await p.locator(f'[data-testid="{tid}"]').click(); await p.wait_for_timeout(2500)
        rows = [r for r in await lst(p, "filmography-missing-") if r and not r.startswith("Well-known")]
        print("missing Dir A:", rows)
        tl = [r.split(" | ")[0] for r in rows]
        chk("director: only Director jobs, owned excluded, sorted", tl == ["Directed2", "Directed1"], tl)
        chk("director rows have no 'as'", not any(" as " in r for r in rows), rows)
        await close(p)
        # Pair -> no missing section
        pairs = await lst(p, "director-pairs-")
        if pairs:
            await p.locator('[data-testid="director-pairs-0"]').click(); await p.wait_for_timeout(800)
            chk("pair has no missing section", await p.locator('[data-testid="filmography-missing"]').count() == 0)
            await close(p)
        # Person not found on TMDB (Actor P -> empty results)
        tid, row = await find_row(p, "top-actor-", "Actor P")
        if tid:
            await p.locator(f'[data-testid="{tid}"]').click(); await p.wait_for_timeout(2500)
            chk("unknown TMDB person -> empty msg", await p.locator('[data-testid="filmography-missing-empty"]').count() == 1)
            await close(p)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_missing_nokey():
    mock = PersonMock()
    ctx, p, _, errs = await open_ctx(film_lib(), key=False, auto="off", url=URL + "stats", mock=mock)
    try:
        await p.wait_for_timeout(1000)
        tid, row = await find_row(p, "top-actor-", "Actor X")
        await p.locator(f'[data-testid="{tid}"]').click(); await p.wait_for_timeout(800)
        txt = await p.locator('[data-testid="filmography-missing"]').inner_text()
        print("nokey:", txt)
        chk("no key hint", "TMDB API key" in txt, txt)
        chk("no TMDB person calls without key", not any("person" in u for u in mock.calls), mock.calls)
    finally:
        await ctx.close()
