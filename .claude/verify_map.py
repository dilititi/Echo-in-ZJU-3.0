"""Headless verification of /map after coord auto-fit + animation + illustrated layer."""
import json, sys, time
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8081/map'
OUT_DIR = r'C:\Users\chen\CascadeProjects\interactive-school-map\.claude'

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page()
        logs = []
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))

        # Dismiss the first-visit welcome overlay before navigating so the map is visible.
        ctx.add_init_script("try { localStorage.setItem('hasVisitedBefore', 'true'); } catch (e) {}")

        page.goto(URL, wait_until='networkidle')
        page.wait_for_timeout(800)

        # Belt-and-suspenders: if the welcome card is still around, click its dismiss button.
        try:
            page.evaluate("""() => {
              const sels = ['.fj-welcome-dismiss', '.welcome-dismiss', '#welcomeDismiss', '[data-action=\"dismiss-welcome\"]'];
              for (const s of sels) {
                const el = document.querySelector(s);
                if (el) { el.click(); return; }
              }
              const card = document.querySelector('.fj-welcome, .welcome-overlay, #welcomeOverlay');
              if (card) card.style.display = 'none';
            }""")
        except Exception:
            pass
        page.wait_for_timeout(300)

        # Step 1 — verify Data.buildings positions are auto-fit (no [220,920] hand-placed leftovers)
        sample = page.evaluate("""() => {
          const ids = ['zju_library','qizhen_hotel','south_gate','qiushi_auditorium','medical_college','zju_gymnasium'];
          const out = {};
          for (const id of ids) {
            const b = Data.buildings[id];
            out[id] = b ? b.position : null;
          }
          return out;
        }""")
        print('=== Building positions after auto-fit ===')
        for k, v in sample.items():
            print(f'  {k:24s} {v}')

        # Step 2 — verify required globals exist
        globals_ok = page.evaluate("""() => ({
          AnimationSystem: !!window.AnimationSystem,
          IllustratedLayer: !!window.IllustratedLayer,
          lottie: typeof lottie !== 'undefined',
          mapReady: !!(App && App.state && App.state.map),
          drawerBtn: !!document.querySelector('.fj-drawer-item.layer-btn[data-layer="illustrated"]'),
        })""")
        print('\n=== Globals ===')
        print(json.dumps(globals_ok, indent=2))

        # Step 3 — screenshot the map area
        page.screenshot(path=OUT_DIR + r'\map_initial.png', full_page=False)

        # Step 4 — simulate solving 2 puzzles by writing solvedBuildings + calling render
        page.evaluate("""() => {
          if (!Storage.userProgress.solvedBuildings) Storage.userProgress.solvedBuildings = [];
          ['qiushi_auditorium','animal_science_college'].forEach(id => {
            if (!Storage.userProgress.solvedBuildings.includes(id)) Storage.userProgress.solvedBuildings.push(id);
          });
          Storage.saveUserProgress();
          IllustratedLayer.render();
          IllustratedLayer.setVisible(true);
        }""")
        page.wait_for_timeout(1200)  # let the SVG overlays attempt-load + fallback
        page.screenshot(path=OUT_DIR + r'\map_illustrated_on.png', full_page=False)

        # Step 5 — fire an emoji burst directly via AnimationSystem
        page.evaluate("""() => {
          AnimationSystem.playAt('animal_science_college', { result: 'correct' });
        }""")
        page.wait_for_timeout(400)  # capture mid-burst
        page.screenshot(path=OUT_DIR + r'\map_emoji_burst.png', full_page=False)
        page.wait_for_timeout(2200)  # let burst clear

        # Step 6 — toggle illustrated layer off
        page.evaluate("IllustratedLayer.setVisible(false)")
        page.wait_for_timeout(300)
        page.screenshot(path=OUT_DIR + r'\map_illustrated_off.png', full_page=False)

        # Step 7 — count overlays present
        overlay_state = page.evaluate("""() => ({
          overlayKeys: Object.keys(App.state.illustratedOverlays || {}),
          groupOnMap: App.state.map.hasLayer(App.state.illustratedGroup),
          imgEls: document.querySelectorAll('.leaflet-image-layer').length,
        })""")
        print('\n=== Illustrated layer state ===')
        print(json.dumps(overlay_state, indent=2))

        print('\n=== Console log tail ===')
        for line in logs[-30:]:
            print(' ', line)

        browser.close()

if __name__ == '__main__':
    main()
