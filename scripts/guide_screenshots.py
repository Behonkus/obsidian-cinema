# Captures real app screenshots for the User Guide (run inside the screenshot tool with `page`).
import sys, json, importlib
sys.path.insert(0, '/app/tests')
import auto_match_harness as H
importlib.reload(H)

URL = "https://obsidian-preview.preview.emergentagent.com/#/"
OUT = "/app/docs/guide_screenshots/"
DATA = json.load(open('/app/docs/guide_sample_library.json'))
LIB, CATS = DATA['lib'], DATA['cats']
DIRS = tuple(CATS.keys())
FAKE_KEY = "3f9c2a7e5b1d4c8a9e6f0b2d7a4c1e85"

EXTRA = """
  localStorage.setItem('obsidian_cinema_dir_categories', %s);
  localStorage.setItem('obsidian_cinema_last_seen_version', '99.0.0');
  localStorage.setItem('obsidian_cinema_effects', 'full');
  localStorage.setItem('obsidian_cinema_drive_names', JSON.stringify({'D:\\\\': 'Main 8TB drive', 'E:\\\\': 'Blue USB'}));
  if (!localStorage.getItem('obsidian_cinema_favorites')) localStorage.setItem('obsidian_cinema_favorites', JSON.stringify(['g27205', 'g129', 'g1396']));
  const FS = {
    'D:\\\\': [{name: 'Movies', path: 'D:\\\\Movies', isDirectory: true}, {name: 'TV Shows', path: 'D:\\\\TV Shows', isDirectory: true}],
    'E:\\\\': [{name: 'Animation', path: 'E:\\\\Animation', isDirectory: true}, {name: 'Documentaries', path: 'E:\\\\Documentaries', isDirectory: true}, {name: 'New Shows', path: 'E:\\\\New Shows', isDirectory: true}],
    'E:\\\\New Shows': [{name: 'Severance', path: 'E:\\\\New Shows\\\\Severance', isDirectory: true}, {name: 'The Bear', path: 'E:\\\\New Shows\\\\The Bear', isDirectory: true}, {name: 'Shogun', path: 'E:\\\\New Shows\\\\Shogun', isDirectory: true}],
  };
  const patch = () => { if (!window.electronAPI) return setTimeout(patch, 5);
    window.electronAPI.getDrives = () => Promise.resolve([{name: 'C:', path: 'C:\\\\'}, {name: 'D:', path: 'D:\\\\'}, {name: 'E:', path: 'E:\\\\'}, {name: 'F:', path: 'F:\\\\'}, {name: 'Z:', path: 'Z:\\\\'}]);
    window.electronAPI.listDirectory = (p) => Promise.resolve(FS[p] || []);
    window.electronAPI.checkRoots = (roots) => { const o = {}; roots.forEach(r => o[r] = !(window.__offline || []).includes(r)); return Promise.resolve(o); };
  }; patch();
""" % json.dumps(json.dumps(CATS))


async def ctx_for(browser, offline=None, lib=None, w=1440, h=900):
    lib = LIB if lib is None else lib
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1.5)
    await ctx.add_init_script(H.init_script(lib=lib, key=False, auto="off", scan=[], dirs=DIRS if lib else ()))
    await ctx.add_init_script((EXTRA if lib else EXTRA.replace(json.dumps(json.dumps(CATS)), "'{}'")) + ("window.__offline = %s;" % json.dumps(offline or [])) + ("localStorage.setItem('obsidian_cinema_tmdb_key', '%s');" % FAKE_KEY if lib else ""))
    p = await ctx.new_page()
    return ctx, p


async def settle(p, ms=2500):
    await p.wait_for_timeout(ms)
    await p.evaluate("document.querySelectorAll('[data-sonner-toaster]').forEach(e => e.style.display = 'none')")
    await p.mouse.move(5, 5)
    await p.wait_for_timeout(400)


async def run(page):
    browser = page.context.browser
    done = []

    # 01 first launch: welcome guide on an empty library
    ctx, p = await ctx_for(browser, lib=[])
    await p.goto(URL); await settle(p, 3000)
    await p.screenshot(path=OUT + "01-installer.png"); done.append("01")
    await ctx.close()

    ctx, p = await ctx_for(browser)
    await p.goto(URL); await settle(p, 4500)
    # 04 library
    await p.screenshot(path=OUT + "04-library.png"); done.append("04")
    # 03 add folder window
    await p.click('[data-testid=browse-local-drives-btn]'); await p.wait_for_timeout(600)
    await p.click('[data-testid=scan-type-tv]')
    await p.fill('[data-testid=browse-path-input]', 'E:\\New Shows'); await p.keyboard.press('Enter'); await p.wait_for_timeout(500)
    await p.locator('[role=dialog]').last.screenshot(path=OUT + "03-add-folder.png"); done.append("03")
    await p.keyboard.press('Escape'); await p.wait_for_timeout(500)
    # 05 details
    await p.click('[data-testid=movie-card-g27205]', position={"x": 40, "y": 60}); await p.wait_for_timeout(2500)
    await p.mouse.move(5, 5); await p.wait_for_timeout(300)
    await p.screenshot(path=OUT + "05-details.png"); done.append("05")
    await p.click('[data-testid=detail-close-x]'); await p.wait_for_timeout(500)
    # 06 tv show
    await p.click('[data-testid=movie-card-g1396]', position={"x": 40, "y": 60}); await p.wait_for_timeout(2500)
    await p.mouse.move(5, 5)
    await p.evaluate("""() => { const c = document.querySelector('[data-testid=movie-detail-card]'); const t = [...c.querySelectorAll('*')].find(e => /^\\d+ Parts$/.test(e.textContent.trim())); if (t) c.scrollTop = t.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 140; }""")
    await p.wait_for_timeout(500)
    await p.screenshot(path=OUT + "06-tv-show.png"); done.append("06")
    await p.click('[data-testid=detail-close-x]'); await p.wait_for_timeout(500)
    # 08 stats
    await p.goto(URL.replace('#/', '#/stats')); await settle(p, 3500)
    await p.screenshot(path=OUT + "08-stats.png"); done.append("08")
    # 02 settings TMDB card
    await p.goto(URL.replace('#/', '#/settings')); await settle(p, 3000)
    card = p.locator('text=TMDB API Key').first.locator('xpath=ancestor::div[contains(@class,"bg-card")][1]')
    await card.scroll_into_view_if_needed(); await p.wait_for_timeout(300)
    await card.screenshot(path=OUT + "02-tmdb-key.png"); done.append("02")
    await ctx.close()

    # 07 drives with E: offline
    ctx, p = await ctx_for(browser, offline=['E:\\'])
    await p.goto(URL); await settle(p, 4000)
    await p.click('[data-testid=manage-dirs-btn]'); await p.wait_for_timeout(800)
    await p.locator('[role=alertdialog]').last.screenshot(path=OUT + "07-drives.png"); done.append("07")
    await ctx.close()
    return done
