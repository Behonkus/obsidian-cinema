# ruff: noqa: F821
# Iteration 36: extras-drop fix (applyCardUpdate) across varied roots, dir-type switch opens merge dialog, varied structures
# Run: g={'page':page}; exec(open('/app/tests/test_iter36_varied_layouts.py').read(), g); await g['run_extras_later_variants']() / run_type_switch() / run_structures()
exec(open('/app/tests/test_iter35_user_paths.py').read(), globals())
import re as _re


def fn(path):
    return _re.split(r"[\\/]", path)[-1]


def mk(i, path, title, **kw):
    d = {"id": i, "file_path": path, "file_name": fn(path), "title": title, "added_at": 1}
    d.update(kw)
    return d


def show_card(cid, title, paths, **kw):
    parts = [{"file_path": p, "file_name": fn(p)} for p in paths]
    d = {"id": cid, "title": title, "media_type": "tv", "tmdb_id": 5, "poster_path": "/s.jpg", "added_at": 1,
         "parts": parts, "file_path": parts[0]["file_path"], "file_name": parts[0]["file_name"]}
    d.update(kw)
    return d


def newf(lst, pre):
    return [{"id": pre + str(i), "file_path": p, "file_name": fn(p), "title": t} for i, (p, t) in enumerate(lst)]


# Existing merged show card + files found later (Extras / new season) -> after merge all parts must remain
VARIANTS = [
    {
        "name": "E:\\Media\\Cartoons (anim) year-range show, Season folders, nested Extras",
        "dirs": ("E:\\Media\\Cartoons",), "cats": {"E:\\Media\\Cartoons": "anim"},
        "card": ("dt", "Duck Tales", ["E:\\Media\\Cartoons\\Duck Tales (1987-1990)\\Season 1\\01 - Treasure.mkv",
                                      "E:\\Media\\Cartoons\\Duck Tales (1987-1990)\\Season 1\\02 - Gold.mkv",
                                      "E:\\Media\\Cartoons\\Duck Tales (1987-1990)\\Season 2\\01 - Ship.mkv"]),
        "new": [("E:\\Media\\Cartoons\\Duck Tales (1987-1990)\\Extras\\Theme Song.mkv", "Theme Song"),
                ("E:\\Media\\Cartoons\\Duck Tales (1987-1990)\\Extras\\Interviews\\Voice Cast.mkv", "Voice Cast")],
        "expect": 5,
    },
    {
        "name": "\\\\NAS\\Shows (tv) Extras + new season",
        "dirs": ("\\\\NAS\\Shows",), "cats": {"\\\\NAS\\Shows": "tv"},
        "card": ("of", "The Office", ["\\\\NAS\\Shows\\The Office\\Season 1\\The Office S01E01.mkv",
                                      "\\\\NAS\\Shows\\The Office\\Season 1\\The Office S01E02.mkv"]),
        "new": [("\\\\NAS\\Shows\\The Office\\Extras\\Bloopers.mkv", "Bloopers"),
                ("\\\\NAS\\Shows\\The Office\\Season 3\\The Office S03E01.mkv", "The Office")],
        "expect": 4,
    },
    {
        "name": "F:\\Users\\Bob\\Videos\\Kids\\Anim (anim, deep root) year folders '(1940)' + Extras",
        "dirs": ("F:\\Users\\Bob\\Videos\\Kids\\Anim",), "cats": {"F:\\Users\\Bob\\Videos\\Kids\\Anim": "anim"},
        "card": ("tj", "Tom and Jerry", ["F:\\Users\\Bob\\Videos\\Kids\\Anim\\Tom and Jerry (1940-1958)\\(1940)\\0001 - Puss Gets the Boot.mkv",
                                         "F:\\Users\\Bob\\Videos\\Kids\\Anim\\Tom and Jerry (1940-1958)\\(1941)\\0002 - The Midnight Snack.mkv"]),
        "new": [("F:\\Users\\Bob\\Videos\\Kids\\Anim\\Tom and Jerry (1940-1958)\\Extras\\Commentary\\Hanna Barbera.mkv", "Hanna Barbera"),
                ("F:\\Users\\Bob\\Videos\\Kids\\Anim\\Tom and Jerry (1940-1958)\\1942\\0003 - Dog Trouble.mkv", "Dog Trouble")],
        "expect": 4,
    },
    {
        "name": "G:\\Home Movies (anim, root = show folder) Season + Extras",
        "dirs": ("G:\\Home Movies",), "cats": {"G:\\Home Movies": "anim"},
        "card": ("hm", "Home Movies", ["G:\\Home Movies\\Season 1\\12 - Law & Boarder.mp4",
                                       "G:\\Home Movies\\Season 2\\01 - Brendon Gets Rabies.mp4"]),
        "new": [("G:\\Home Movies\\Extras\\Brendon On Guitar.mp4", "Brendon On Guitar")],
        "expect": 3,
    },
    {
        "name": "X:\\ drive root (anim) Extras",
        "dirs": ("X:\\",), "cats": {"X:\\": "anim"},
        "card": ("xs", "Squidbillies", ["X:\\Squidbillies\\Season 1\\01 - Pilot.mkv", "X:\\Squidbillies\\Season 1\\02 - Second.mkv"]),
        "new": [("X:\\Squidbillies\\Extras\\Promo.mkv", "Promo"), ("X:\\Squidbillies\\Extras\\Live.mkv", "Live")],
        "expect": 4,
    },
]


async def run_extras_later_variants(auto="on"):
    for v in VARIANTS:
        print("=== VARIANT:", v["name"], "auto=", auto)
        cid, title, paths = v["card"]
        lib = [show_card(cid, title, paths)]
        ctx, p, mock, errs = await open3(lib, base_scan(lib) + newf(v["new"], "n"), auto=auto, cats=v["cats"], dirs=v["dirs"])
        try:
            await p.locator('[data-testid="update-library-btn"]').click()
            await p.wait_for_timeout(5000)
            d = p.locator('[data-testid="multipart-suggest-dialog"]')
            print("auto dialog:", await d.count())
            if await d.count():
                for g_ in await groups_text(p):
                    print("  AUTO GROUP:", g_)
                await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(6000)
            L = await H.read_lib(p)
            n = len((L.get(cid) or {}).get("parts") or [])
            print("cards:", [(k, m.get("title"), len(m.get("parts") or [])) for k, m in L.items()])
            print("RESULT", "PASS" if len(L) == 1 and n == v["expect"] else "FAIL", "parts=", n, "expected", v["expect"], "errors:", errs)
        except Exception as e:
            print("VARIANT ERROR", e)
        finally:
            await ctx.close()


async def open_mgr(p):
    await p.locator('[data-testid="manage-dirs-btn"]').click()
    await p.wait_for_timeout(600)


async def run_type_switch():
    """Individual cards in a folder typed Movies; switching folder type to Anim/TV/Docs opens merge dialog."""
    R = "E:\\Media\\Toons"
    lib = [
        mk("l1", R + "\\Looney Tunes (1929-2020)\\1941\\0322 - Toy Trouble.mkv", "Toy Trouble"),
        mk("l2", R + "\\Looney Tunes (1929-2020)\\(1942)\\0340 - The Wabbit Who Came to Supper.mkv", "The Wabbit"),
        mk("h1", R + "\\Home Movies\\Season 1\\12 - Law & Boarder.mp4", "Law & Boarder"),
        mk("h2", R + "\\Home Movies\\Extras\\Brendon On Guitar.mp4", "Brendon On Guitar"),
        mk("u1", R + "\\Random Toon\\pilot.mkv", "pilot"),
        mk("u2", R + "\\Random Toon\\disc 2\\finale.mkv", "finale"),
        mk("m1", "M:\\Movies\\Heat (1995).mkv", "Heat", year=1995),
    ]
    dirs = (R, "M:\\Movies")
    cats = {R: "movies", "M:\\Movies": "movies"}
    ctx, p, mock, errs = await open3(lib, base_scan(lib), auto="off", cats=cats, dirs=dirs)
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("multipart btn while Movies:", await btn.inner_text() if await btn.count() else "none")
        await open_mgr(p)
        sel = p.locator('[data-testid="dir-type-0"]')
        print("dir-type-0 value:", await sel.input_value(), "options:", await sel.locator("option").all_inner_texts())
        for typ in ["anim", "movies", "tv", "docs"]:
            # close any open merge dialog first
            await sel.select_option(typ)
            await p.wait_for_timeout(1200)
            d = p.locator('[data-testid="multipart-suggest-dialog"]')
            cnt = await d.count()
            print(f"--- switch to {typ}: dialog={cnt}")
            if cnt:
                for g_ in await groups_text(p):
                    print("  GROUP:", g_)
                await p.screenshot(path=f".screenshots/iter36_switch_{typ}.jpg", quality=40, full_page=False)
                if typ == "docs":
                    await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
                    await p.wait_for_timeout(1500)
                else:
                    await p.keyboard.press("Escape")
                    await p.wait_for_timeout(600)
                    if await p.locator('[data-testid="dir-type-0"]').count() == 0:
                        await open_mgr(p)
                    sel = p.locator('[data-testid="dir-type-0"]')
        L = await H.read_lib(p)
        print("after docs merge:", [(k, m.get("title"), len(m.get("parts") or [])) for k, m in L.items()])
        print("stored cats:", await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')"))
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_type_switch_movies_dir():
    """Switching the Movies-by-year folder to Anim: separate films from different years not merged; Movies type no dialog."""
    R = "M:\\Films"
    lib = [mk("a", R + "\\2019\\A (2019).mkv", "A", year=2019), mk("b", R + "\\2019\\B (2019).mkv", "B", year=2019),
           mk("c1", R + "\\2020\\C (2020).mkv", "C", year=2020)]
    ctx, p, mock, errs = await open3(lib, base_scan(lib), auto="off", cats={R: "tv"}, dirs=(R,))
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("btn when tv:", await btn.inner_text() if await btn.count() else "none")
        await open_mgr(p)
        await p.locator('[data-testid="dir-type-0"]').select_option("movies")
        await p.wait_for_timeout(1200)
        print("dialog after ->movies:", await p.locator('[data-testid="multipart-suggest-dialog"]').count())
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("btn when movies:", await btn.inner_text() if await btn.count() else "none")
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_structures():
    """Existing individual cards across many layouts; Multi-Part button groups."""
    lib = [
        mk("a1", "X:\\Show A (2001-2005)\\2001\\0101 - First.mkv", "First"),
        mk("a2", "X:\\Show A (2001-2005)\\(2002)\\0201 - Second.mkv", "Second"),
        mk("a3", "X:\\Show A (2001-2005)\\Extras\\Commentary\\Director.mkv", "Director"),
        mk("b1", "Y:\\Media\\Toons\\Show B\\Season 1\\01 - One.mkv", "One"),
        mk("b2", "Y:\\Media\\Toons\\Show B\\Season 2\\01 - Two.mkv", "Two"),
        mk("b3", "Y:\\Media\\Toons\\Show B\\Extras\\Bonus.mkv", "Bonus"),
        mk("c1", "Z:\\Solo Show\\Season 1\\Solo Show S01E01.mkv", "Solo Show"),
        mk("c2", "Z:\\Solo Show\\1999\\0001 - Special.mkv", "Special"),
        mk("c3", "Z:\\Solo Show\\Extras\\Gag Reel.mkv", "Gag Reel"),
        mk("d1", "/mnt/media/toons/Futurama (1999-2013)/Season 1/01 - Space Pilot.mkv", "Space Pilot"),
        mk("d2", "/mnt/media/toons/Futurama (1999-2013)/Extras/Trailer.mkv", "Trailer"),
        mk("m1", "M:\\Movies\\2019\\A (2019).mkv", "A", year=2019),
        mk("m2", "M:\\Movies\\2019\\B (2019).mkv", "B", year=2019),
    ]
    dirs = ("X:\\", "Y:\\Media\\Toons", "Z:\\Solo Show", "/mnt/media/toons", "M:\\Movies")
    cats = {"X:\\": "anim", "Y:\\Media\\Toons": "docs", "Z:\\Solo Show": "tv", "/mnt/media/toons": "anim", "M:\\Movies": "movies"}
    ctx, p, mock, errs = await open3(lib, base_scan(lib), auto="off", cats=cats, dirs=dirs)
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("btn:", await btn.inner_text() if await btn.count() else "none")
        if await btn.count():
            await btn.click()
            await p.wait_for_timeout(500)
            for g_ in await groups_text(p):
                print("GROUP:", g_)
            await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(1500)
        L = await H.read_lib(p)
        print("cards:", [(k, m.get("title"), len(m.get("parts") or [])) for k, m in L.items()])
        for t in ["Show A", "Show B", "Solo Show", "Futurama"]:
            try:
                print("DETAIL", t, await open_card(p, t))
            except Exception as e:
                print("DETAIL FAIL", t, e)
        print("TV count:", await tv_count(p), "errors:", errs)
    finally:
        await ctx.close()
