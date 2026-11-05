# v1.7.0 UpdatePrompt + WhatsNewDialog simulated-Electron UI tests
# Usage in browser_automation: g={'page':page}; exec(open(this).read(), g); await g['run_all']()
import json

BASE = "https://obsidian-preview.preview.emergentagent.com"
for _l in open('/app/frontend/.env'):
    if _l.startswith('REACT_APP_BACKEND_URL='):
        BASE = _l.split('=', 1)[1].strip().rstrip('/')


def init_script(eula=None, seen=None, app_version="1.7.0", status=None):
    seed = "localStorage.clear();"
    if eula:
        seed += "localStorage.setItem('obsidian_cinema_eula_accepted', %s);" % json.dumps(eula)
    if seen:
        seed += "localStorage.setItem('obsidian_cinema_last_seen_version', %s);" % json.dumps(seen)
    seed += "localStorage.setItem('obsidian_cinema_skip_poster_tip','true');localStorage.setItem('obsidian_cinema_skip_naming_tip','true');"
    return """
(() => {
  if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded','1'); %s }
  window.__calls = {checkForUpdates: [], downloadUpdate: 0, installUpdate: 0, unsub: 0};
  window.__t0 = Date.now();
  const STATUS = %s;
  const impl = {
    isElectron: () => true,
    getAppVersion: () => Promise.resolve(%s),
    getMachineId: () => Promise.resolve('test-machine'),
    getLicense: () => Promise.resolve({subscription_tier: 'free', activated_at: '2026-01-01T00:00:00Z'}),
    setLicense: () => Promise.resolve(true),
    libraryReadSync: () => sessionStorage.getItem('fakeLib') || '[]',
    libraryWriteSync: (v) => { sessionStorage.setItem('fakeLib', v); return true; },
    libraryWrite: (v) => { sessionStorage.setItem('fakeLib', v); return Promise.resolve(true); },
    getDrives: () => Promise.resolve([]),
    listDirectory: () => Promise.resolve([]),
    scanForVideos: () => Promise.resolve([]),
    pathExists: () => Promise.resolve(true),
    getUpdateStatus: () => Promise.resolve(STATUS),
    onUpdateStatus: (cb) => { (window.__cbs = window.__cbs || []).push(cb); return () => { window.__calls.unsub++; window.__cbs = window.__cbs.filter(c => c !== cb); }; },
    removeUpdateListener: () => { window.__cbs = []; },
    checkForUpdates: () => { window.__calls.checkForUpdates.push(Date.now() - window.__t0); return Promise.resolve({}); },
    downloadUpdate: () => { window.__calls.downloadUpdate++; return Promise.resolve(true); },
    installUpdate: () => { window.__calls.installUpdate++; return Promise.resolve(true); },
    openExternal: () => Promise.resolve(true),
    openPath: () => Promise.resolve(''),
  };
  window.__emit = (msg) => (window.__cbs || []).forEach(cb => cb(msg));
  window.electronAPI = new Proxy(impl, { get(t,k){ if (k in t) return t[k]; if (typeof k==='symbol') return undefined; return () => Promise.resolve([]); } });
})();
""" % (seed, json.dumps(status), json.dumps(app_version))


async def new_page(page, **kw):
    browser = page.context.browser
    ctx = await browser.new_context(viewport={"width": 1920, "height": 1080})
    await ctx.add_init_script(init_script(**kw))
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    p.__errs = errs
    return ctx, p


async def accept_eula(p):
    await p.wait_for_selector('[data-testid="eula-page"]', timeout=15000)
    ver = await p.text_content('[data-testid="eula-page"]')
    await p.evaluate("""() => { const v = document.querySelector('[data-testid="eula-scroll-area"] [data-radix-scroll-area-viewport]'); v.scrollTop = v.scrollHeight; v.dispatchEvent(new Event('scroll', {bubbles:true})); }""")
    await p.wait_for_timeout(300)
    await p.click('[data-testid="eula-accept-btn"]')
    return ver


def R(name, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + name + (" :: " + str(extra) if extra else ""))


async def ls(p, k):
    return await p.evaluate("(k) => localStorage.getItem(k)", k)


async def run_whats_new(page):
    ctx, p = await new_page(page, eula="1.6.9")
    await p.goto(BASE + "/#/stats")
    ver = await accept_eula(p)
    R("EULA shows v1.7.0", "Obsidian Cinema v1.7.0" in ver)
    try:
        await p.wait_for_selector('[data-testid="whats-new-dialog"]', timeout=10000)
        title = await p.text_content('[data-testid="whats-new-title"]')
        items = await p.locator('[data-testid="whats-new-highlights"] li').count()
        R("WhatsNew shown after upgrade", True, f"title={title!r} items={items}")
        R("WhatsNew lists 10 highlights", items == 10)
        await p.screenshot(path=".screenshots/iter33_whats_new.jpg", quality=40, full_page=False)
        R("seen key not set before close", await ls(p, 'obsidian_cinema_last_seen_version') is None)
        await p.click('[data-testid="whats-new-close-btn"]')
        await p.wait_for_timeout(500)
        R("closed", await p.locator('[data-testid="whats-new-dialog"]').count() == 0)
        R("seen key = 1.7.0", await ls(p, 'obsidian_cinema_last_seen_version') == '1.7.0')
        await p.reload()
        await p.wait_for_timeout(4000)
        R("no reappear after reload", await p.locator('[data-testid="whats-new-dialog"]').count() == 0)
        R("no eula after reload", await p.locator('[data-testid="eula-page"]').count() == 0)
    except Exception as e:
        R("WhatsNew flow", False, e)
    R("no page errors", not p.__errs, p.__errs)
    await ctx.close()

    # Fresh install
    ctx, p = await new_page(page)
    await p.goto(BASE + "/#/stats")
    await accept_eula(p)
    await p.wait_for_timeout(4000)
    R("fresh: no WhatsNew", await p.locator('[data-testid="whats-new-dialog"]').count() == 0)
    R("fresh: seen key set silently", await ls(p, 'obsidian_cinema_last_seen_version') == '1.7.0')
    await ctx.close()

    # Escape close also marks seen
    ctx, p = await new_page(page, eula="1.6.9")
    await p.goto(BASE + "/#/settings")
    await accept_eula(p)
    try:
        await p.wait_for_selector('[data-testid="whats-new-dialog"]', timeout=10000)
        await p.keyboard.press("Escape")
        await p.wait_for_timeout(500)
        R("escape closes + seen set", await ls(p, 'obsidian_cinema_last_seen_version') == '1.7.0')
    except Exception as e:
        R("WhatsNew on settings", False, e)
    R("settings no page errors", not p.__errs, p.__errs)
    await ctx.close()


async def run_update_prompt(page):
    # A: getUpdateStatus returns 1.7.0 available while running 1.6.9
    st = {"updateAvailable": {"version": "1.7.0", "releaseNotes": "<ul><li>ignored</li></ul>"}, "isDownloading": False, "isDownloaded": False, "downloadProgress": 0}
    ctx, p = await new_page(page, eula="1.7.0", seen="1.7.0", app_version="1.6.9", status=st)
    await p.goto(BASE + "/#/stats")
    try:
        await p.wait_for_selector('[data-testid="update-prompt-dialog"]', timeout=10000)
        vers = await p.text_content('[data-testid="update-prompt-versions"]')
        items = await p.locator('[data-testid="update-prompt-highlights"] li').all_text_contents()
        R("prompt shown via getUpdateStatus", True, vers)
        R("versions text", "v1.7.0" in vers and "v1.6.9" in vers)
        R("server highlights listed (10)", len(items) == 10 and "ignored" not in items, items[:2])
        await p.screenshot(path=".screenshots/iter33_update_prompt.jpg", quality=40, full_page=False)
        await p.click('[data-testid="update-prompt-download-btn"]')
        await p.wait_for_timeout(300)
        R("downloadUpdate called", await p.evaluate("window.__calls.downloadUpdate") == 1)
        R("downloading btn shown", await p.locator('[data-testid="update-prompt-downloading-btn"]').is_visible())
        R("progress shown", await p.locator('[data-testid="update-prompt-progress"]').is_visible())
        await p.evaluate("window.__emit({status:'downloading', data:{percent:42.4}})")
        await p.wait_for_timeout(200)
        R("progress 42%", "42%" in (await p.text_content('[data-testid="update-prompt-progress"]')))
        await p.evaluate("window.__emit({status:'downloaded', data:{version:'1.7.0'}})")
        await p.wait_for_timeout(200)
        R("install btn shown", await p.locator('[data-testid="update-prompt-install-btn"]').is_visible())
        await p.click('[data-testid="update-prompt-install-btn"]')
        R("installUpdate called", await p.evaluate("window.__calls.installUpdate") == 1)
        await p.wait_for_timeout(5500)
        calls = await p.evaluate("window.__calls.checkForUpdates")
        R("checkForUpdates once ~5s", len(calls) == 1 and 4500 < calls[0] < 9000, calls)
        R("no WhatsNew when seen=current", await p.locator('[data-testid="whats-new-dialog"]').count() == 0)
    except Exception as e:
        R("prompt A", False, e)
    R("A no page errors", not p.__errs, p.__errs)
    await ctx.close()

    # B: onUpdateStatus emits 1.7.1 (not in changelog) -> releaseNotes parsed; Later behaviour
    ctx, p = await new_page(page, eula="1.7.0", seen="1.7.0", app_version="1.7.0", status=None)
    await p.goto(BASE + "/#/stats")
    await p.wait_for_timeout(3000)
    R("B: no prompt initially", await p.locator('[data-testid="update-prompt-dialog"]').count() == 0)
    notes = "<h2>Release</h2><ul><li>Fixed crash on scan</li><li>Faster posters</li></ul><p>* Tweaked themes</p>"
    await p.evaluate("(n) => window.__emit({status:'available', data:{version:'1.7.1', releaseNotes:n}})", notes)
    try:
        await p.wait_for_selector('[data-testid="update-prompt-dialog"]', timeout=5000)
        await p.wait_for_timeout(1500)
        items = await p.locator('[data-testid="update-prompt-highlights"] li').all_text_contents()
        R("B: fallback parse of releaseNotes", items[:2] == ["Fixed crash on scan", "Faster posters"], items)
        await p.click('[data-testid="update-prompt-later-btn"]')
        await p.wait_for_timeout(400)
        R("B: later closes", await p.locator('[data-testid="update-prompt-dialog"]').count() == 0)
        R("B: dismiss key", await p.evaluate("sessionStorage.getItem('obsidian_cinema_update_prompt_dismissed')") == '1.7.1')
        await p.evaluate("(n) => window.__emit({status:'available', data:{version:'1.7.1', releaseNotes:n}})", notes)
        await p.wait_for_timeout(800)
        R("B: not reopened same session (emit)", await p.locator('[data-testid="update-prompt-dialog"]').count() == 0)
        # navigate to another route (remount) - same session
        await p.goto(BASE + "/#/settings")
        await p.wait_for_timeout(2500)
        await p.evaluate("(n) => window.__emit({status:'available', data:{version:'1.7.1', releaseNotes:n}})", notes)
        await p.wait_for_timeout(800)
        R("B: not reopened after nav", await p.locator('[data-testid="update-prompt-dialog"]').count() == 0)
        # A newer version should reopen
        await p.evaluate("window.__emit({status:'available', data:{version:'1.7.2', releaseNotes:'<li>Another</li>'}})")
        await p.wait_for_timeout(1500)
        R("B: newer version 1.7.2 reopens", await p.locator('[data-testid="update-prompt-dialog"]').count() == 1)
        items = await p.locator('[data-testid="update-prompt-highlights"] li').all_text_contents()
        print("B 1.7.2 items:", items)
    except Exception as e:
        R("prompt B", False, e)
    R("B no page errors", not p.__errs, p.__errs)
    await ctx.close()

    # C: no releaseNotes for unknown version -> 'Bug fixes and improvements'
    st = {"updateAvailable": {"version": "1.8.0"}, "isDownloading": True, "isDownloaded": False, "downloadProgress": 10}
    ctx, p = await new_page(page, eula="1.7.0", seen="1.7.0", app_version="1.7.0", status=st)
    await p.goto(BASE + "/#/stats")
    try:
        await p.wait_for_selector('[data-testid="update-prompt-dialog"]', timeout=10000)
        await p.wait_for_timeout(1500)
        items = await p.locator('[data-testid="update-prompt-highlights"] li').all_text_contents()
        R("C: default highlight", items == ["Bug fixes and improvements"], items)
        R("C: downloading state from status", await p.locator('[data-testid="update-prompt-downloading-btn"]').is_visible())
    except Exception as e:
        R("prompt C", False, e)
    await ctx.close()


async def run_web(page):
    ctx = await page.context.browser.new_context(viewport={"width": 1920, "height": 1080})
    p = await ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    await p.goto(BASE + "/")
    await p.wait_for_timeout(5000)
    R("web: no whats-new", await p.locator('[data-testid="whats-new-dialog"]').count() == 0)
    R("web: no update prompt", await p.locator('[data-testid="update-prompt-dialog"]').count() == 0)
    R("web: no eula", await p.locator('[data-testid="eula-page"]').count() == 0)
    print("web url:", p.url, "title:", await p.title())
    await p.screenshot(path=".screenshots/iter33_web.jpg", quality=40, full_page=False)
    R("web no page errors", not errs, errs)
    await ctx.close()


async def run_all():
    await run_whats_new(page)
    await run_update_prompt(page)
    await run_web(page)
