# ruff: noqa: F821
# Iteration 35: user's real layout - Q:\ (anim) with Looney Tunes year folders and Home Movies Season/Extras
exec(open('/app/tests/test_iter34_year_seasons.py').read(), globals())

QD = ("Q:\\",)
QC = {"Q:\\": "anim"}
LT = "Q:\\Looney Tunes (1929-2020)\\"
HM = "Q:\\Home Movies\\"
NEWF = [
    (LT + "1941\\0322 - Toy Trouble.mkv", "Toy Trouble"),
    (LT + "1941\\0323 - Porky's Pooch.mkv", "Porky's Pooch"),
    (LT + "1942\\0340 - The Wabbit Who Came to Supper.mkv", "The Wabbit Who Came to Supper"),
    (HM + "Season 1\\12 - Law & Boarder.mp4", "Law & Boarder"),
    (HM + "Season 1\\13 - Bad Influences.mp4", "Bad Influences"),
    (HM + "Season 2\\01 - Brendon Gets Rabies.mp4", "Brendon Gets Rabies"),
    (HM + "Extras\\Brendon On Guitar.mp4", "Brendon On Guitar"),
    (HM + "Extras\\Commentary\\Pilot Commentary.mp4", "Pilot Commentary"),
]


def nf(start=0):
    return [{"id": "q%d" % i, "file_path": p, "file_name": p.split("\\")[-1], "title": t} for i, (p, t) in enumerate(NEWF) if i >= start]


async def dump(p, label):
    L = await H.read_lib(p)
    print(label, "cards:", len(L))
    for k, m in L.items():
        print("  CARD", k, repr(m.get("title")), m.get("media_type"), "parts=", len(m.get("parts") or []))


async def scan_flow(base, scan, auto):
    ctx, p, mock, errs = await open3(base, scan, auto=auto, cats=QC, dirs=QD)
    try:
        await p.locator('[data-testid="update-library-btn"]').click()
        await p.wait_for_timeout(6000)
        print("toasts:", await H.toasts(p))
        d = p.locator('[data-testid="multipart-suggest-dialog"]')
        print("auto dialog:", await d.count())
        if await d.count():
            for g in await groups_text(p):
                print("AUTO GROUP:", g)
            await p.locator('[data-testid="multipart-merge-selected-btn"]').click()
            await p.wait_for_timeout(5000)
        await dump(p, "after")
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("multipart btn after:", await btn.inner_text() if await btn.count() else "none")
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_fresh_auto_on():
    base = [{"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "Q:\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}]
    await scan_flow(base, base_scan(base) + nf(), "on")


async def run_fresh_auto_off():
    base = [{"id": "heat", "title": "Heat", "file_name": "Heat (1995).mkv", "file_path": "Q:\\Heat (1995).mkv", "year": 1995, "added_at": 1, "poster_path": "/heat.jpg", "tmdb_id": 949}]
    await scan_flow(base, base_scan(base) + nf(), "off")


async def run_existing_individual():
    """Cards already in the library as separate (TMDB-matched) movies; open Multi-Part."""
    lib = [{"id": "e%d" % i, "file_path": p, "file_name": p.split("\\")[-1], "title": t, "media_type": "movie", "tmdb_id": 100 + i, "poster_path": "/x.jpg", "added_at": i + 1} for i, (p, t) in enumerate(NEWF)]
    ctx, p, mock, errs = await open3(lib, base_scan(lib), auto="off", cats=QC, dirs=QD)
    try:
        btn = p.locator('[data-testid="multipart-suggest-btn"]')
        print("multipart btn:", await btn.inner_text() if await btn.count() else "none")
        if await btn.count():
            await btn.click()
            await p.wait_for_timeout(500)
            for g in await groups_text(p):
                print("GROUP:", g)
        print("errors:", errs)
    finally:
        await ctx.close()


async def run_extras_later():
    """Home Movies already merged (seasons), Extras files found on a later Update Library."""
    parts = [{"file_path": p, "file_name": p.split("\\")[-1]} for p, _ in NEWF[3:6]]
    lib = [{"id": "hm", "title": "Home Movies", "media_type": "tv", "tmdb_id": 77, "poster_path": "/hm.jpg", "added_at": 1, "parts": parts, "file_path": parts[0]["file_path"], "file_name": parts[0]["file_name"]}]
    await scan_flow(lib, base_scan(lib) + nf(6), "on")
