/* ============================================================
   asset-diagnostics.js — dev-only asset audit panel.

   Activate via `?debug=assets` in the URL.

   Inventories every Lottie theme and per-building SVG that the
   illustrated-layer / animation-system code expects, fires a
   parallel HEAD request to each, and renders a sticky panel
   listing 200/404/other plus content-length. Use this after an
   art drop to confirm every file landed at the expected path
   without manually clicking through 32 URLs.

   Loaded unconditionally — panel is hidden unless the URL param
   is present, so production users never see it.
   ============================================================ */

(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== 'assets') return;

  // Themes mirror animation-system.js THEME_MAP keys + 'animals' default.
  const LOTTIE_THEMES = ['animals', 'equations', 'marine', 'stars', 'leaves', 'lamps'];

  function buildingIds() {
    if (typeof Data === 'undefined' || !Data.buildings) return [];
    return Object.keys(Data.buildings);
  }

  async function probe(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      const len = res.headers.get('content-length');
      return { status: res.status, ok: res.ok, size: len ? Number(len) : null };
    } catch (e) {
      return { status: 0, ok: false, size: null, err: String(e) };
    }
  }

  function fmtSize(n) {
    if (n == null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function statusIcon(r) {
    if (r.status === 200) return { glyph: '✓', color: '#3a7d4e' };
    if (r.status === 404) return { glyph: '✗', color: '#9c3a2e' };
    if (r.status === 0)   return { glyph: '⚠', color: '#b88a3a' };
    return { glyph: '?', color: '#b88a3a' };
  }

  function panel() {
    let el = document.getElementById('asset-diag-panel');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'asset-diag-panel';
    el.style.cssText = `
      position: fixed; top: 60px; right: 12px; z-index: 9000;
      width: 360px; max-height: 80vh; overflow-y: auto;
      background: #f5e4bd; border: 2px solid #d4af37; border-radius: 6px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      font-family: Georgia, serif; font-size: 12px; color: #1b263b;
      padding: 10px 12px;
    `;
    document.body.appendChild(el);
    return el;
  }

  function row(label, url, r) {
    const { glyph, color } = statusIcon(r);
    return `
      <div style="display:flex; gap:6px; padding:2px 0; border-bottom:1px dashed rgba(0,0,0,0.08)">
        <span style="width:14px; color:${color}; font-weight:700;">${glyph}</span>
        <span style="flex:1; font-family:Consolas,monospace; font-size:11px;">${label}</span>
        <span style="color:#666;">${r.status || 'ERR'}</span>
        <span style="color:#666; width:60px; text-align:right;">${fmtSize(r.size)}</span>
      </div>`;
  }

  async function audit() {
    const root = panel();
    root.innerHTML =
      '<div style="font-weight:700; font-size:13px; margin-bottom:6px;">🔬 Asset Diagnostics</div>'
      + '<div style="color:#666;">probing…</div>';

    const lottieEntries = LOTTIE_THEMES.map(t => ({
      label: t,
      url: 'assets/lottie/' + t + '.json',
    }));
    const ids = buildingIds();
    const svgEntries = ids.map(id => ({
      label: id,
      url: 'assets/illustrated/' + id + '.svg',
    }));
    const all = [...lottieEntries, ...svgEntries];

    const results = await Promise.all(all.map(e => probe(e.url)));
    const lottieResults = results.slice(0, lottieEntries.length);
    const svgResults    = results.slice(lottieEntries.length);

    const lottieOk = lottieResults.filter(r => r.ok).length;
    const svgOk    = svgResults.filter(r => r.ok).length;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:700; font-size:13px;">🔬 Asset Diagnostics</span>
        <button id="asset-diag-refresh"
                style="font-family:Georgia,serif; font-size:11px; background:#d4af37; color:#1b263b;
                       border:none; border-radius:3px; padding:3px 8px; cursor:pointer;">
          Re-check
        </button>
      </div>
      <div style="background:rgba(212,175,55,0.18); padding:6px 8px; border-radius:4px; margin-bottom:8px;">
        Lottie <b>${lottieOk}/${lottieEntries.length}</b>
        &nbsp;·&nbsp;
        SVG <b>${svgOk}/${svgEntries.length}</b>
      </div>
      <div style="font-weight:700; margin:4px 0;">Lottie (assets/lottie/&lt;theme&gt;.json)</div>
    `;
    lottieEntries.forEach((e, i) => { html += row(e.label, e.url, lottieResults[i]); });
    html += '<div style="font-weight:700; margin:10px 0 4px;">SVG (assets/illustrated/&lt;buildingId&gt;.svg)</div>';
    svgEntries.forEach((e, i) => { html += row(e.label, e.url, svgResults[i]); });

    root.innerHTML = html;
    const btn = document.getElementById('asset-diag-refresh');
    if (btn) btn.onclick = audit;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', audit);
  } else {
    audit();
  }
})();
