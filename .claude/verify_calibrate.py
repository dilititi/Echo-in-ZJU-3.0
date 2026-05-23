"""Verify the satellite-calibrate panel renders, responds to keyboard, and updates overlay bounds."""
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8081/map?calibrate=satellite'
OUT_INIT = r'C:\Users\chen\CascadeProjects\interactive-school-map\.claude\calib_initial.png'
OUT_NUDGED = r'C:\Users\chen\CascadeProjects\interactive-school-map\.claude\calib_nudged.png'

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    ctx.add_init_script("try { localStorage.setItem('hasVisitedBefore', 'true'); } catch (e) {}")
    page = ctx.new_page()
    logs = []
    page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
    page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(2000)

    info0 = page.evaluate("""() => {
      const p = document.getElementById('sat-calib-panel');
      const ov = (typeof App !== 'undefined' && App.state) ? App.state.satelliteOverlay : null;
      const b = ov && ov.getBounds && ov.getBounds();
      return {
        panelPresent: !!p,
        readout: p ? (p.querySelector('#calib-readout').textContent) : null,
        overlayBounds: b ? [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]] : null,
      };
    }""")
    print('initial:', info0)
    page.screenshot(path=OUT_INIT, full_page=False)
    print('saved', OUT_INIT)

    # Click on map background to ensure focus is not on inputs
    page.click('#map')
    page.wait_for_timeout(200)

    for _ in range(5):
        page.keyboard.press('ArrowRight')
    page.keyboard.press('+')
    page.keyboard.press('+')
    page.wait_for_timeout(400)

    info1 = page.evaluate("""() => {
      const p = document.getElementById('sat-calib-panel');
      const ov = (typeof App !== 'undefined' && App.state) ? App.state.satelliteOverlay : null;
      const b = ov && ov.getBounds && ov.getBounds();
      return {
        readout: p ? p.querySelector('#calib-readout').textContent : null,
        overlayBounds: b ? [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]] : null,
      };
    }""")
    print('after 5x ArrowRight + 2x +:', info1)
    page.screenshot(path=OUT_NUDGED, full_page=False)
    print('saved', OUT_NUDGED)

    page.keyboard.press('R')
    page.wait_for_timeout(300)
    info2 = page.evaluate("""() => {
      const p = document.getElementById('sat-calib-panel');
      return p ? p.querySelector('#calib-readout').textContent : null;
    }""")
    print('after R:', info2)

    print('\nrelevant logs:')
    for l in logs:
        if 'satellite-calibrate' in l or '[error]' in l or '[pageerror]' in l:
            try: print(' ', l)
            except UnicodeEncodeError: print(' ', l.encode('ascii', 'replace').decode())

    browser.close()
