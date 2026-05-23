"""Verify asset-diagnostics panel renders with correct status counts."""
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8081/map?debug=assets'
OUT = r'C:\Users\chen\CascadeProjects\interactive-school-map\.claude\asset_diag.png'

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    ctx.add_init_script("try { localStorage.setItem('hasVisitedBefore', 'true'); } catch (e) {}")
    page = ctx.new_page()
    logs = []
    page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
    page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(2500)  # panel does parallel HEAD requests

    info = page.evaluate("""() => {
      const root = document.getElementById('asset-diag-panel');
      if (!root) return { present: false };
      // Extract the summary line
      const summary = root.querySelector('div[style*="rgba(212,175,55"]');
      return {
        present: true,
        summary: summary ? summary.textContent.trim() : null,
        rowCount: root.querySelectorAll('div[style*="display:flex; gap:6px"]').length,
        innerLen: root.innerHTML.length,
      };
    }""")
    print('panel info:', info)

    page.screenshot(path=OUT, full_page=False)
    print('saved', OUT)

    if logs:
        print('\nconsole logs:')
        for l in logs[-30:]:
            print(' ', l)

    browser.close()
