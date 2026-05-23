"""Verify marker-calibrate: panel renders, drag updates overrides, copy/reset work."""
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8081/map?calibrate=markers'
OUT = r'C:\Users\chen\CascadeProjects\interactive-school-map\.claude\marker_calib.png'

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1400, 'height': 900},
                              permissions=['clipboard-read', 'clipboard-write'])
    ctx.add_init_script("try { localStorage.setItem('hasVisitedBefore', 'true'); localStorage.removeItem('markerCalibrateWIP_v1'); } catch (e) {}")
    page = ctx.new_page()
    logs = []
    page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
    page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(2500)

    init = page.evaluate("""() => {
      const p = document.getElementById('marker-calib-panel');
      const sat = App.state.satelliteOverlay;
      const markers = App.state.buildingMarkers || {};
      const ids = Object.keys(markers);
      return {
        panelPresent: !!p,
        satellitePresent: !!sat && App.state.map.hasLayer(sat),
        markerCount: ids.length,
        firstId: ids[0] || null,
        firstDraggable: ids[0] && markers[ids[0]].dragging && markers[ids[0]].dragging.enabled(),
        firstPos: ids[0] ? [markers[ids[0]].getLatLng().lat, markers[ids[0]].getLatLng().lng] : null,
      };
    }""")
    print('init:', init)

    # Programmatically simulate a drag by calling setLatLng then firing dragend
    drag_result = page.evaluate("""() => {
      const markers = App.state.buildingMarkers || {};
      const ids = Object.keys(markers);
      if (ids.length < 2) return null;
      // Drag first two markers to fake positions
      const m1 = markers[ids[0]], m2 = markers[ids[1]];
      m1.setLatLng(L.latLng(123.4, 567.8));
      m1.fire('dragend');
      m2.setLatLng(L.latLng(200.0, 300.5));
      m2.fire('dragend');
      return {
        ids: [ids[0], ids[1]],
        finalPos1: [m1.getLatLng().lat, m1.getLatLng().lng],
        finalPos2: [m2.getLatLng().lat, m2.getLatLng().lng],
      };
    }""")
    print('after drag fire:', drag_result)

    page.wait_for_timeout(300)
    state = page.evaluate("""() => {
      const p = document.getElementById('marker-calib-panel');
      const counter = p.querySelector('div[style*="rgba(212,175,55"]');
      const wip = localStorage.getItem('markerCalibrateWIP_v1');
      return {
        counterText: counter ? counter.textContent.trim() : null,
        wipStored: wip ? JSON.parse(wip) : null,
      };
    }""")
    print('panel state:', state)

    page.screenshot(path=OUT, full_page=False)
    print('saved', OUT)

    # Test copy button copies JSON
    page.evaluate("""() => {
      const btn = document.querySelector('#marker-calib-panel button[data-act="copy"]');
      btn && btn.click();
    }""")
    page.wait_for_timeout(300)
    clip = page.evaluate("() => navigator.clipboard.readText()")
    print('clipboard:', clip)

    # Test reset-all
    page.evaluate("""() => {
      const btn = document.querySelector('#marker-calib-panel button[data-act="reset-all"]');
      btn && btn.click();
    }""")
    page.wait_for_timeout(200)
    after_reset = page.evaluate("""() => {
      const p = document.getElementById('marker-calib-panel');
      const counter = p.querySelector('div[style*="rgba(212,175,55"]');
      return counter ? counter.textContent.trim() : null;
    }""")
    print('after reset-all:', after_reset)

    print('\nrelevant logs:')
    for l in logs:
        if 'marker-calibrate' in l or '[error]' in l or '[pageerror]' in l:
            try: print(' ', l)
            except UnicodeEncodeError: print(' ', l.encode('ascii', 'replace').decode())

    browser.close()
