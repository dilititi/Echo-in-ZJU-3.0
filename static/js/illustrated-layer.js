/* ============================================================
   illustrated-layer.js — progressively-revealed hand-drawn
   overlay. Each solved building reveals a small SVG vignette
   (paths, trees, lamps, themed animals/equations) anchored
   around its centroid. The overlays accumulate into the
   "插画图层" toggle in the ⋯ drawer.

   Per-building assets live at:
       static/assets/illustrated/<buildingId>.svg

   Missing asset → fall back to a soft-circle inline SVG so
   the user still sees something revealed.
   ============================================================ */

(function () {
  const OVERLAY_RADIUS = 150;  // half-extent in CRS.Simple pixel units

  // Once a building's real SVG asset 404s, skip the network round-trip
  // on subsequent toggles and go straight to the themed fallback.
  const missingAssets = new Set();

  function ensureGroup() {
    if (!App || !App.state || !App.state.map) return null;
    if (!App.state.illustratedGroup) {
      App.state.illustratedGroup = L.layerGroup();
      App.state.illustratedOverlays = {};  // buildingId → L.imageOverlay
    }
    return App.state.illustratedGroup;
  }

  // Themed glyphs sprinkled inside the cream circle. Mirrors the theme
  // taxonomy in animation-system.js so a building's burst animation and
  // its illustrated patch share the same visual identity. When real
  // hand-drawn SVGs land at assets/illustrated/<id>.svg they take over.
  const THEME_GLYPHS = {
    animals:   ['🐾', '🐰', '🦌', '🐦'],
    marine:    ['🐬', '🌊', '🐟'],
    equations: ['π', '∫', 'Σ', '√'],
    stars:     ['✦', '★', '✧'],
    leaves:    ['🍃', '🌿', '🌱'],
    lamps:     ['🏮', '✨', '🌙'],
  };

  function fallbackSvgUrl(buildingId) {
    const theme = AnimationSystem.themeForBuilding(buildingId);
    const glyphs = THEME_GLYPHS[theme] || THEME_GLYPHS.animals;
    // Anchor positions inside the 300×300 viewBox (rough circle around center)
    const anchors = [
      [150,  70], [225, 115], [225, 195], [150, 240], [ 75, 195], [ 75, 115],
    ];
    const fontSize = theme === 'equations' ? 36 : 28;
    let glyphsSvg = '';
    for (let i = 0; i < anchors.length; i++) {
      const g = glyphs[i % glyphs.length];
      const [cx, cy] = anchors[i];
      const rot = (i * 13) % 30 - 15;
      glyphsSvg += `<text x="${cx}" y="${cy}" font-size="${fontSize}" `
        + `text-anchor="middle" dominant-baseline="middle" opacity="0.78" `
        + `transform="rotate(${rot} ${cx} ${cy})" `
        + `font-family="Georgia, serif">${g}</text>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">`
      + `<defs><radialGradient id="g" cx="50%" cy="50%" r="50%">`
      + `<stop offset="0%" stop-color="rgba(245,228,189,0.55)"/>`
      + `<stop offset="70%" stop-color="rgba(245,228,189,0.20)"/>`
      + `<stop offset="100%" stop-color="rgba(245,228,189,0)"/>`
      + `</radialGradient></defs>`
      + `<circle cx="150" cy="150" r="140" fill="url(#g)"/>`
      + glyphsSvg
      + `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function boundsForBuilding(b) {
    if (!b || !Array.isArray(b.position)) return null;
    const [y, x] = b.position;
    return [
      [y - OVERLAY_RADIUS, x - OVERLAY_RADIUS],
      [y + OVERLAY_RADIUS, x + OVERLAY_RADIUS],
    ];
  }

  function addOverlayFor(buildingId) {
    const group = ensureGroup();
    if (!group) return;
    if (App.state.illustratedOverlays[buildingId]) return;  // already present
    const b = Data.buildings[buildingId];
    if (!b) return;
    const bounds = boundsForBuilding(b);
    if (!bounds) return;

    const useFallback = missingAssets.has(buildingId);
    const url = useFallback
      ? fallbackSvgUrl(buildingId)
      : 'assets/illustrated/' + buildingId + '.svg';
    const overlay = L.imageOverlay(url, bounds, { opacity: 0.95, interactive: false });
    if (!useFallback) {
      overlay.on('error', () => {
        missingAssets.add(buildingId);
        const el = overlay.getElement();
        if (el && el.tagName === 'IMG' && el.src.indexOf('data:') !== 0) {
          el.src = fallbackSvgUrl(buildingId);
        }
      });
    }
    overlay.addTo(group);
    App.state.illustratedOverlays[buildingId] = overlay;
  }

  function removeOverlayFor(buildingId) {
    const ov = App.state.illustratedOverlays && App.state.illustratedOverlays[buildingId];
    if (!ov) return;
    App.state.illustratedGroup.removeLayer(ov);
    delete App.state.illustratedOverlays[buildingId];
  }

  function solvedSet() {
    const arr = (Storage && Storage.userProgress && Storage.userProgress.solvedBuildings) || [];
    return new Set(arr);
  }

  function init() {
    if (!App || !App.state || !App.state.map) return;
    ensureGroup();
    render();
  }

  function render() {
    if (!App || !App.state || !App.state.map) return;
    ensureGroup();
    const solved = solvedSet();
    // Add new
    solved.forEach(id => addOverlayFor(id));
    // Remove orphans (e.g. after reset)
    Object.keys(App.state.illustratedOverlays || {}).forEach(id => {
      if (!solved.has(id)) removeOverlayFor(id);
    });
  }

  function setVisible(visible) {
    const group = ensureGroup();
    if (!group) return;
    if (visible) {
      if (!App.state.map.hasLayer(group)) group.addTo(App.state.map);
    } else {
      if (App.state.map.hasLayer(group)) App.state.map.removeLayer(group);
    }
  }

  window.IllustratedLayer = { init, render, setVisible };
})();
