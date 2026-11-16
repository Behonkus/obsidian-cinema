# ruff: noqa: F821
# Iteration 45: drag & drop files/folders onto the library (type dialog -> add), rating source tag (card + detail, cleared on manual edit)
# Run via browser_automation: g={'page':page}; exec(open('/app/tests/test_iter45_drop_rating.py').read(), g); await g['run_drop_main'](); await g['run_drop_edges'](); await g['run_rating_tag']()
exec(open('/app/tests/test_iter37_import_type.py').read(), globals())


def chk(label, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + label + (" :: " + str(extra) if extra else ""))


DROP_SCAN = [
    {"id": "fa", "file_path": "D:\\Drop\\Folder\\A.mkv", "file_name": "A.mkv", "title": "A"},
    {"id": "fn", "file_path": "D:\\Drop\\Folder\\Sub\\Nested.mkv", "file_name": "Nested.mkv", "title": "Nested"},
]

# scanForVideos: record (path, recursive) and honour recursive=false
SCAN_SPY = """
(() => {
  const base = window.electronAPI; const S = %s;
  window.__scanArgs = [];
  window.electronAPI = new Proxy({}, { get(t, k) {
    if (k === 'scanForVideos') return (dir, rec) => { window.__scanArgs.push([dir, rec]);
      const d = dir.replace(/[\\\\/]+$/, '') + '\\\\';
      return Promise.resolve(S.filter(f => f.file_path.startsWith(d) && (rec !== false || !f.file_path.slice(d.length).includes('\\\\')))); };
    return base[k]; } });
})();
"""

DROP_JS = """([kind, paths, types]) => {
  const zone = document.querySelector('[data-testid=library-drop-zone]');
  const ev = new Event(kind, { bubbles: true, cancelable: true });
  ev.dataTransfer = { types: types || ['Files'], files: (paths || []).map(p => ({ path: p })), dropEffect: '' };
  zone.dispatchEvent(ev);
  return { prevented: ev.defaultPrevented, dropEffect: ev.dataTransfer.dropEffect };
}"""


async def open_drop(lib=None, scan_extra=None, pro=True):
    lib = lib or [HEAT]
    ctx, p, mock, errs = await open4(lib, base_scan(lib) + DROP_SCAN + (scan_extra or []), auto="off", dialog=PICK, pro=pro)
    return ctx, p, mock, errs


async def drop(p, paths, types=None, kind="drop"):
    return await p.evaluate(DROP_JS, [kind, paths, types])


async def run_drop_main():
    ctx, p, mock, errs = await open_drop()
    await p.add_init_script(SCAN_SPY % json.dumps(base_scan([HEAT]) + DROP_SCAN))
    await p.reload(); await p.wait_for_selector('[data-testid="update-library-btn"]', timeout=20000); await p.wait_for_timeout(1000)
    try:
        chk("drop zone present", await p.locator('[data-testid="library-drop-zone"]').count() == 1)
        r = await drop(p, [], kind="dragover")
        chk("dragover Files -> preventDefault + copy", r["prevented"] and r["dropEffect"] == "copy", r)
        await p.wait_for_timeout(300)
        ov = p.locator('[data-testid="library-drop-overlay"]')
        chk("overlay visible with text", await ov.count() == 1 and "Drop video files or a folder to add them" in await ov.inner_text(), await ov.inner_text() if await ov.count() else None)
        await p.screenshot(path=".screenshots/iter45_overlay.jpg", quality=40, full_page=False)
        await drop(p, [], kind="dragleave"); await p.wait_for_timeout(300)
        chk("dragleave hides overlay", await ov.count() == 0)
        r = await drop(p, [], types=["text/plain"], kind="dragover"); await p.wait_for_timeout(200)
        chk("non-file drag ignored", not r["prevented"] and await ov.count() == 0, r)
        # Drop a video file + folder + duplicate path + a non-video file
        paths = ["D:\\Drop\\Heat (1995).mkv", "D:\\Drop\\Folder", "D:\\Drop\\Heat (1995).mkv", "D:\\Drop\\Folder\\A.mkv"]
        await drop(p, paths, kind="dragover"); await p.wait_for_timeout(200)
        r = await drop(p, paths); await p.wait_for_timeout(800)
        chk("drop preventDefault + overlay hidden", r["prevented"] and await ov.count() == 0, r)
        sa = await p.evaluate("() => window.__scanArgs")
        chk("folder scanned non-recursive", ["D:\\Drop\\Folder", False] in sa and not any(a[0].endswith(".mkv") for a in sa), sa)
        d = p.locator('[data-testid="files-type-dialog"]')
        txt = await d.inner_text() if await d.count() else ""
        chk("type dialog opened 'Choose the type for the 2 dropped items'", "Choose the type for the 2 dropped items" in txt, txt.replace("\n", " | "))
        cont = p.locator('[data-testid="files-type-continue"]')
        chk("continue 'Add to library' disabled before pick", (await cont.inner_text()).strip() == "Add to library" and await cont.is_disabled())
        await p.screenshot(path=".screenshots/iter45_drop_dialog.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="files-type-movies"]').click(); await p.wait_for_timeout(200)
        await cont.click(); await p.wait_for_timeout(2500)
        ts = await H.toasts(p)
        print("toasts:", ts)
        L = await H.read_lib(p)
        fps = sorted(m["file_path"] for m in L.values())
        print("lib:", lib_summary(L), fps)
        chk("2 dropped files added (Heat drop + A), nested not added", "D:\\Drop\\Heat (1995).mkv" in fps and "D:\\Drop\\Folder\\A.mkv" in fps and not any("Nested" in f for f in fps) and len(L) == 3, fps)
        chk("no file dialog for drop", await p.evaluate("() => window.__dlgCalls") == 0)
        chk("success toast 'Added 2 movies'", any("Added 2 movies" in t for t in ts), ts)
        cats = json.loads(await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')") or "{}")
        chk("folder types saved", cats.get("D:\\Drop") == "movies" and cats.get("D:\\Drop\\Folder") == "movies", cats)
        # Drop the same again -> already in library
        # Already-known paths are filtered before the dialog (toast only, no type dialog)
        await drop(p, ["D:\\Drop\\Heat (1995).mkv"]); await p.wait_for_timeout(1200)
        chk("re-drop of known file: no type dialog", await d.count() == 0)
        ts = await H.toasts(p)
        chk("existing path skipped toast", any("already in your library" in t for t in ts), ts)
        chk("count unchanged", len(await H.read_lib(p)) == 3)
        # Normal Add Files still uses the file dialog
        await p.locator('[data-testid="more-actions-btn"]').click(); await p.wait_for_timeout(300)
        await p.locator('[data-testid="add-files-btn"]').click(); await p.wait_for_timeout(500)
        txt = await d.inner_text() if await d.count() else ""
        chk("Add Files dialog default text + 'Choose files'", "about to pick" in txt and (await cont.inner_text()).strip() == "Choose files", txt.replace("\n", " | "))
        await p.locator('[data-testid="files-type-tv"]').click(); await cont.click(); await p.wait_for_timeout(3000)
        chk("file dialog called once", await p.evaluate("() => window.__dlgCalls") == 1)
        L = await H.read_lib(p)
        print("after add files:", lib_summary(L))
        chk("Breaking Bad files added", any("Breaking Bad" in str(m.get("file_path")) for m in L.values()))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()


async def run_drop_edges():
    ctx, p, mock, errs = await open_drop()
    try:
        d = p.locator('[data-testid="files-type-dialog"]')
        # empty folder / non-video
        await drop(p, ["D:\\Empty", "D:\\notes.txt"]); await p.wait_for_timeout(800)
        ts = await H.toasts(p)
        chk("nothing found toast", any("No video files found in what you dropped" in t for t in ts) and await d.count() == 0, ts)
        # cancel adds nothing
        await drop(p, ["D:\\Drop\\X (2000).MP4", "D:\\Drop\\y.ts"]); await p.wait_for_timeout(600)
        chk("uppercase .MP4 + .ts accepted (2 items)", "2 dropped items" in (await d.inner_text() if await d.count() else ""))
        await p.locator('[data-testid="files-type-movies"]').click()
        await p.locator('[data-testid="files-type-cancel"]').click(); await p.wait_for_timeout(800)
        chk("cancel adds nothing", len(await H.read_lib(p)) == 1 and await d.count() == 0)
        # after cancel, Add Files reset to normal mode
        await p.locator('[data-testid="more-actions-btn"]').click(); await p.wait_for_timeout(300)
        await p.locator('[data-testid="add-files-btn"]').click(); await p.wait_for_timeout(500)
        chk("after cancelled drop, Add Files shows 'Choose files' + reset pick",
            (await p.locator('[data-testid="files-type-continue"]').inner_text()).strip() == "Choose files" and await p.locator('[data-testid="files-type-continue"]').is_disabled())
        await p.keyboard.press("Escape"); await p.wait_for_timeout(400)
        # Escape after drop -> nothing added either
        await drop(p, ["D:\\Drop\\Z (2001).mkv"]); await p.wait_for_timeout(500)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        chk("escape adds nothing", len(await H.read_lib(p)) == 1)
        # drop into folder inside scanned dir: type not overwritten
        await drop(p, ["M:\\Movies\\New (2020).mkv"]); await p.wait_for_timeout(500)
        await p.locator('[data-testid="files-type-tv"]').click(); await p.locator('[data-testid="files-type-continue"]').click(); await p.wait_for_timeout(1500)
        cats = json.loads(await p.evaluate("() => localStorage.getItem('obsidian_cinema_dir_categories')") or "{}")
        chk("scanned dir keeps its type (M:\\Movies stays movies, no new entry)", cats.get("M:\\Movies") == "movies" and "M:\\Movies\\New (2020).mkv" not in cats, cats)
        chk("file inside scanned dir added", any(m["file_path"] == "M:\\Movies\\New (2020).mkv" for m in (await H.read_lib(p)).values()))
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
    # free tier cap: 499 cards + drop 3 -> only 1 added
    lib = [dict(mk("c%d" % i, "M:\\Movies\\TEST_C%03d (2000).mkv" % i, "TEST_C%03d" % i), year=2000) for i in range(499)]
    ctx, p, mock, errs = await open_drop(lib=lib, pro=False)
    try:
        await drop(p, ["D:\\Drop\\F1.mkv", "D:\\Drop\\F2.mkv", "D:\\Drop\\F3.mkv"]); await p.wait_for_timeout(600)
        await p.locator('[data-testid="files-type-movies"]').click(); await p.locator('[data-testid="files-type-continue"]').click(); await p.wait_for_timeout(2000)
        ts = await H.toasts(p)
        n = len(await H.read_lib(p))
        chk("free tier cap: 500 total + warning", n == 500 and any("only adding 1 of 3" in t for t in ts), (n, ts))
        chk("no page errors (free)", not errs, errs)
    finally:
        await ctx.close()


def rcard(id_, title, rating, src, folder="M:\\Movies"):
    d = {"id": id_, "title": title, "file_name": title + ".mkv", "file_path": folder + "\\" + title + ".mkv", "year": 2000, "added_at": 1,
         "tmdb_id": 1000 + len(id_), "poster_path": "/p.jpg", "rating": rating, "metadata_updated_at": 1, "genres": ["Drama"], "media_type": "movie"}
    if src is not False:
        d["rating_source"] = src
    return d


async def run_rating_tag():
    lib = [rcard("i", "TEST_TagImdb", 7.8, "IMDb"), rcard("mc", "TEST_TagMC", 7.3, "Metacritic"), rcard("rt", "TEST_TagRT", 9.1, "Rotten Tomatoes"),
           rcard("wd", "TEST_TagWD", 6.4, "wikidata"), rcard("cr", "TEST_TagCritics", 6.0, "Critics"), rcard("tm", "TEST_TagTmdb", 7.0, None),
           rcard("abs", "TEST_TagAbsent", 7.2, False), rcard("zero", "TEST_TagZero", 0, "IMDb"), rcard("nul", "TEST_TagNull", None, "IMDb")]
    ctx, p, mock, errs = await open4(lib, base_scan(lib), auto="off")
    try:
        await p.wait_for_timeout(800)
        info = await p.evaluate("""() => Object.fromEntries(Array.from(document.querySelectorAll('h3.font-medium.truncate')).map(h => {
            const card = h.parentElement; const t = card.querySelector('[data-testid=rating-source-tag]');
            const r = Array.from(card.querySelectorAll('p')).find(x => x.textContent.includes('★'));
            return [h.innerText, t ? [t.innerText, t.getAttribute('title')] : null, r ? r.innerText : null]; }).map(([a, b, c]) => [a, {tag: b, line: c}]))""")
        for k, v in info.items():
            print(k, v)
        exp = {"TEST_TagImdb": ["IMDb", "IMDb rating via Wikidata"], "TEST_TagMC": ["MC", "Metacritic rating via Wikidata"],
               "TEST_TagRT": ["RT", "Rotten Tomatoes rating via Wikidata"], "TEST_TagWD": ["WD", None]}
        for t, (short, tip) in exp.items():
            tg = (info.get(t) or {}).get("tag")
            chk(f"{t} tag {short}" + (f" / '{tip}'" if tip else ""), tg and tg[0] == short and (tip is None or tg[1] == tip), tg)
        print("legacy wikidata tooltip:", (info.get("TEST_TagWD") or {}).get("tag"), "| Critics:", (info.get("TEST_TagCritics") or {}).get("tag"))
        for t in ("TEST_TagTmdb", "TEST_TagAbsent", "TEST_TagZero", "TEST_TagNull"):
            chk(f"{t} no tag", (info.get(t) or {}).get("tag") is None, info.get(t))
        await p.screenshot(path=".screenshots/iter45_cards.jpg", quality=40, full_page=False)
        tag = p.locator('[data-testid="rating-source-tag"]').first
        bb = await tag.bounding_box()
        print("tag box:", bb, "style:", await tag.evaluate("e => { const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.fontSize]; }"))
        # detail
        await p.get_by_text("TEST_TagImdb", exact=True).first.click(); await p.wait_for_timeout(1200)
        full = p.locator('[data-testid="rating-source-tag-full"]')
        chk("detail full tag 'IMDb via Wikidata'", await full.count() == 1 and (await full.inner_text()).strip() == "IMDb via Wikidata", await full.inner_text() if await full.count() else None)
        await p.screenshot(path=".screenshots/iter45_detail.jpg", quality=40, full_page=False)
        await p.locator('[data-testid="edit-rating-btn"]').click(); await p.wait_for_timeout(300)
        await p.locator('[data-testid="edit-rating-input"]').fill("8.4")
        await p.locator('[data-testid="confirm-rating-btn"]').click(); await p.wait_for_timeout(1500)
        chk("full tag gone after manual edit", await full.count() == 0)
        L = await H.read_lib(p)
        chk("saved rating 8.4 + rating_source null", L["i"]["rating"] == 8.4 and L["i"].get("rating_source") is None, {k: L["i"].get(k) for k in ("rating", "rating_source")})
        await p.keyboard.press("Escape"); await p.wait_for_timeout(600)
        has = await p.evaluate("() => { const h = Array.from(document.querySelectorAll('h3.font-medium.truncate')).find(x => x.innerText === 'TEST_TagImdb'); return !!h.parentElement.querySelector('[data-testid=rating-source-tag]'); }")
        chk("card tag gone after edit", not has)
        # Enter key path on another card
        await p.get_by_text("TEST_TagRT", exact=True).first.click(); await p.wait_for_timeout(1000)
        chk("RT detail 'Rotten Tomatoes via Wikidata'", (await full.inner_text()).strip() == "Rotten Tomatoes via Wikidata" if await full.count() else False)
        await p.locator('[data-testid="edit-rating-btn"]').click(); await p.wait_for_timeout(300)
        await p.locator('[data-testid="edit-rating-input"]').fill("5")
        await p.keyboard.press("Enter"); await p.wait_for_timeout(1200)
        L = await H.read_lib(p)
        chk("Enter edit clears source", L["rt"]["rating"] == 5 and L["rt"].get("rating_source") is None and await full.count() == 0, L["rt"].get("rating_source"))
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        # TMDB card detail: no tag
        await p.get_by_text("TEST_TagTmdb", exact=True).first.click(); await p.wait_for_timeout(1000)
        chk("TMDB detail no full tag", await full.count() == 0)
        await p.keyboard.press("Escape"); await p.wait_for_timeout(500)
        await p.get_by_text("TEST_TagZero", exact=True).first.click(); await p.wait_for_timeout(1000)
        chk("rating 0 detail no full tag", await full.count() == 0)
        chk("no page errors", not errs, errs)
    finally:
        await ctx.close()
