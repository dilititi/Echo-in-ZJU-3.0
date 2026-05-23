"""Take BEFORE (?spread=0) and AFTER (default) screenshots of /map."""
from playwright.sync_api import sync_playwright

OUT_BEFORE = '.claude/map_spread_off.png'
OUT_AFTER  = '.claude/map_spread_on.png'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1400, 'height': 900})

    # Dismiss welcome overlay
    ctx.add_init_script("try { localStorage.setItem('hasVisitedBefore', 'true'); } catch (e) {}")

    page = ctx.new_page()
    page.goto('http://127.0.0.1:8081/map?spread=0')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1200)
    pos_off = page.evaluate("""() => {
      const ids = ['agricultural_college','environmental_resource_college','animal_science_college','life_science_college','nano_building','public_administration_college'];
      return ids.map(id => [id, Data.buildings[id] ? Data.buildings[id].position : null]);
    }""")
    print('=== spread=OFF positions (agriculture cluster) ===')
    for id, pos in pos_off:
        print(f'  {id:34s} {pos}')
    page.screenshot(path=OUT_BEFORE, full_page=False)
    print('saved', OUT_BEFORE)

    page2 = ctx.new_page()
    page2.goto('http://127.0.0.1:8081/map')
    page2.wait_for_load_state('networkidle')
    page2.wait_for_timeout(1200)
    pos_on = page2.evaluate("""() => {
      const ids = ['agricultural_college','environmental_resource_college','animal_science_college','life_science_college','nano_building','public_administration_college'];
      return ids.map(id => [id, Data.buildings[id] ? Data.buildings[id].position : null]);
    }""")
    print('=== spread=ON positions (agriculture cluster) ===')
    for id, pos in pos_on:
        print(f'  {id:34s} {pos}')
    page2.screenshot(path=OUT_AFTER, full_page=False)
    print('saved', OUT_AFTER)

    browser.close()
