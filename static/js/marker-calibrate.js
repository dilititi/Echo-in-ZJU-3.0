/* ============================================================
   marker-calibrate.js — dev-only per-building marker calibration.

   Activate via `?calibrate=markers` in the URL. Drops a 70%-opacity
   satellite overlay as ground truth, makes every building marker
   draggable, and tracks per-marker [y, x] overrides. Click "复制
   overrides" to copy a JSON dict; paste it into
   static/js/marker-position-overrides.js so bootstrap.js applies
   it on every load.

   Drag work-in-progress is persisted to localStorage under
   `markerCalibrateWIP_v1` so refreshes don't lose progress.
   ============================================================ */

(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('calibrate') !== 'markers') return;

  const SAT_URL = 'assets/紫金港卫星地图.png';
  const SAT_BOUNDS = [[0, 0], [1000, 1000]];
  const WIP_KEY = 'markerCalibrateWIP_v1';

  let overrides = {};
  let panelEl = null;
  let satelliteOverlay = null;
  let originalClickHandlers = new Map(); // buildingId -> click fn we removed

  function loadWIP() {
    try {
      const raw = localStorage.getItem(WIP_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') overrides = parsed;
    } catch (e) { /* ignore */ }
  }

  function saveWIP() {
    try { localStorage.setItem(WIP_KEY, JSON.stringify(overrides)); } catch (e) {}
  }

  function clearWIP() {
    try { localStorage.removeItem(WIP_KEY); } catch (e) {}
  }

  function ensureSatellite(map) {
    if (App.state.satelliteOverlay) {
      satelliteOverlay = App.state.satelliteOverlay;
    } else {
      satelliteOverlay = L.imageOverlay(SAT_URL, SAT_BOUNDS, { opacity: 0.7, interactive: false });
      App.state.satelliteOverlay = satelliteOverlay;
    }
    if (!map.hasLayer(satelliteOverlay)) satelliteOverlay.addTo(map);
    // Push markers above the satellite image (default marker z is fine but ensure)
  }

  function applyOverridesToMarkers() {
    const markers = App.state.buildingMarkers || {};
    Object.entries(overrides).forEach(([id, pos]) => {
      const m = markers[id];
      if (m && Array.isArray(pos)) m.setLatLng(L.latLng(pos[0], pos[1]));
    });
  }

  function enableDragging() {
    const markers = App.state.buildingMarkers || {};
    Object.entries(markers).forEach(([id, marker]) => {
      if (!marker.dragging) return;
      marker.dragging.enable();
      // Suppress info-card popup during calibration; we want clicks to do nothing.
      marker.off('click');
      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        overrides[id] = [round1(ll.lat), round1(ll.lng)];
        saveWIP();
        renderPanel();
      });
    });
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  function formatJSON() {
    // Stable key order: by buildingId in Data.buildings order
    const ids = (typeof Data !== 'undefined' && Data.buildings) ? Object.keys(Data.buildings) : Object.keys(overrides);
    const lines = ids
      .filter(id => overrides[id])
      .map(id => `  ${id}: [${overrides[id][0].toFixed(1)}, ${overrides[id][1].toFixed(1)}],`);
    return '{\n' + lines.join('\n') + '\n}';
  }

  function copyOverrides() {
    const text = formatJSON();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash('已复制 ' + Object.keys(overrides).length + ' 条'), () => flash('复制失败'));
    } else {
      flash('剪贴板不可用');
    }
  }

  function resetMarker(id) {
    delete overrides[id];
    saveWIP();
    // Visually restore: need to know the original position before drag.
    // Easiest: reload — but that loses other in-progress drags too.
    // Instead, snap back via Data.buildings[id].position (bootstrap-applied value).
    const m = (App.state.buildingMarkers || {})[id];
    const orig = Data.buildings[id] && Data.buildings[id].position;
    if (m && Array.isArray(orig)) m.setLatLng(L.latLng(orig[0], orig[1]));
    renderPanel();
  }

  function resetAll() {
    Object.keys(overrides).forEach(id => {
      const m = (App.state.buildingMarkers || {})[id];
      const orig = Data.buildings[id] && Data.buildings[id].position;
      if (m && Array.isArray(orig)) m.setLatLng(L.latLng(orig[0], orig[1]));
    });
    overrides = {};
    clearWIP();
    renderPanel();
  }

  function setSatelliteOpacity(v) {
    if (satelliteOverlay) satelliteOverlay.setOpacity(v);
  }

  function flash(msg) {
    const r = panelEl && panelEl.querySelector('#mcalib-flash');
    if (!r) return;
    r.textContent = msg;
    clearTimeout(r._t);
    r._t = setTimeout(() => { r.textContent = ''; }, 1800);
  }

  function buildPanelShell() {
    panelEl = document.createElement('div');
    panelEl.id = 'marker-calib-panel';
    panelEl.style.cssText = `
      position: fixed; top: 60px; left: 12px; z-index: 9000;
      width: 320px; max-height: 80vh; overflow-y: auto;
      background: #f5e4bd; border: 2px solid #d4af37; border-radius: 6px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      font-family: Georgia, serif; font-size: 12px; color: #1b263b;
      padding: 10px 12px;
    `;
    document.body.appendChild(panelEl);
  }

  function renderPanel() {
    if (!panelEl) return;
    const total = (typeof Data !== 'undefined' && Data.buildings) ? Object.keys(Data.buildings).length : 26;
    const moved = Object.keys(overrides).length;

    const movedList = Object.keys(overrides).map(id => {
      const p = overrides[id];
      return `
        <div style="display:flex; align-items:center; gap:4px; padding:2px 0; border-bottom:1px dashed rgba(0,0,0,0.08);">
          <span style="flex:1; font-family:Consolas,monospace; font-size:11px;">${id}</span>
          <span style="color:#666; font-family:Consolas,monospace; font-size:11px;">[${p[0].toFixed(1)}, ${p[1].toFixed(1)}]</span>
          <button data-reset="${id}" title="撤销此项"
                  style="background:none; border:1px solid #9c3a2e; color:#9c3a2e;
                         border-radius:3px; padding:0 5px; cursor:pointer; font-size:11px;">×</button>
        </div>`;
    }).join('');

    panelEl.innerHTML = `
      <div style="font-weight:700; font-size:13px; margin-bottom:6px;">📍 地标坐标校准</div>
      <div style="font-size:11px; color:#555; margin-bottom:8px; line-height:1.45;">
        卫星图为底，直接拖动 marker 到正确位置。已调整的会记到下方列表，
        校准完点「复制 overrides」粘贴到 <code>js/marker-position-overrides.js</code>。
      </div>
      <div style="background:rgba(212,175,55,0.18); padding:6px 8px; border-radius:4px; margin-bottom:8px;">
        已调整 <b>${moved}</b> / ${total}
      </div>
      <div style="display:flex; gap:4px; margin-bottom:8px; flex-wrap:wrap;">
        <button data-act="copy"
                style="font-family:Georgia,serif; font-size:11px; background:#d4af37; color:#1b263b;
                       border:none; border-radius:3px; padding:4px 10px; cursor:pointer;">
          复制 overrides
        </button>
        <button data-act="reset-all"
                style="font-family:Georgia,serif; font-size:11px; background:#9c3a2e; color:#fff;
                       border:none; border-radius:3px; padding:4px 10px; cursor:pointer;">
          全部撤销
        </button>
      </div>
      <label style="display:block; font-size:11px; margin-bottom:8px;">卫星不透明度
        <input id="mcalib-op" type="range" min="0.1" max="1" step="0.05" value="${satelliteOverlay ? satelliteOverlay.options.opacity : 0.7}" style="width:100%;">
      </label>
      ${moved ? `<div style="font-weight:700; margin:6px 0 4px;">已调整列表</div>${movedList}` : `<div style="color:#888; font-style:italic; font-size:11px;">尚未拖动任何 marker</div>`}
      <div id="mcalib-flash" style="margin-top:6px; font-size:11px; color:#3a7d4e; height:14px;"></div>
    `;

    panelEl.querySelector('[data-act="copy"]').onclick = copyOverrides;
    panelEl.querySelector('[data-act="reset-all"]').onclick = resetAll;
    panelEl.querySelectorAll('button[data-reset]').forEach(btn => {
      btn.onclick = () => resetMarker(btn.dataset.reset);
    });
    const op = panelEl.querySelector('#mcalib-op');
    if (op) op.oninput = () => setSatelliteOpacity(parseFloat(op.value));
  }

  function start() {
    const ready = typeof App !== 'undefined'
      && App.state && App.state.map
      && App.state.buildingMarkers
      && Object.keys(App.state.buildingMarkers).length > 0;
    if (!ready) {
      setTimeout(start, 200);
      return;
    }
    loadWIP();
    ensureSatellite(App.state.map);
    enableDragging();
    applyOverridesToMarkers(); // re-apply persisted positions on reload
    buildPanelShell();
    renderPanel();
    console.info('[marker-calibrate] active — drag markers; saved positions in localStorage(' + WIP_KEY + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 500));
  } else {
    setTimeout(start, 500);
  }
})();
