/* ============================================================
   map-layers-patch.js — Field Journal sepia tile filter
   Load AFTER map-layers.js.

   Overrides App.applyTheme() to apply a sepia or moonlit CSS filter
   to .leaflet-tile-pane (tiles + image overlays) so the entire map
   gets the Field Journal wash. Also syncs with data-theme toggles via
   MutationObserver so the header dark/light button keeps the map in sync.
   ============================================================ */

(function () {
  if (typeof App === 'undefined') return;

  function readVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  const FILTERS = {
    day:   'sepia(.42) saturate(.7) brightness(1.03) contrast(.96) hue-rotate(-6deg)',
    night: 'hue-rotate(20deg) saturate(.4) brightness(.55) contrast(1.05)'
  };

  function paintMap(mode) {
    const css = mode === 'night' ? FILTERS.night : FILTERS.day;

    const panes = document.querySelectorAll(
      '.leaflet-tile-pane, .leaflet-overlay-pane .leaflet-image-layer'
    );
    panes.forEach(p => { p.style.filter = css; });

    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.style.backgroundColor = mode === 'night'
        ? readVar('--bg-primary', '#1a140e')
        : readVar('--bg-primary', '#f1e6cc');
    }

    const target = mode === 'night' ? 'dark' : 'light';
    if (document.documentElement.getAttribute('data-theme') !== target) {
      document.documentElement.setAttribute('data-theme', target);
    }
  }

  App.applyTheme = function (theme) {
    const mode = (theme === 'night' || theme === 'dark') ? 'night' : 'day';
    this.state.isNightMode = (mode === 'night');
    paintMap(mode);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = mode === 'night' ? '☀️ 日间' : '🌙 夜间';
  };

  const _initDayNightMode = App.initDayNightMode;
  App.initDayNightMode = function () {
    _initDayNightMode.call(this);
    setTimeout(() => paintMap(this.state.isNightMode ? 'night' : 'day'), 250);
  };

  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName === 'data-theme') {
        const t = document.documentElement.getAttribute('data-theme');
        paintMap(t === 'dark' ? 'night' : 'day');
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const _initMap = App.initMap;
  App.initMap = function () {
    _initMap.call(this);
    requestAnimationFrame(() => {
      const initial = document.documentElement.getAttribute('data-theme') === 'dark' ? 'night' : 'day';
      paintMap(initial);
    });
  };

  App.fjPaintMap = paintMap;
  App.fjMapFilters = FILTERS;
})();
