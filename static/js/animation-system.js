/* ============================================================
   animation-system.js — Lottie burst on puzzle submission.

   Plays a hand-drawn themed flourish at a building's screen
   position whenever a puzzle is answered (correct or wrong).
   Themes are static per building; assets live at
   `static/assets/lottie/{theme}.json`. Missing asset → silent
   no-op (so the system can ship before art is delivered).
   ============================================================ */

(function () {
  const THEME_MAP = {
    equations: ['qiushi_auditorium', 'old_management_building', 'zju_library', 'nano_building'],
    marine:    ['qizhen_lake'],
    leaves:    ['nanhua_garden', 'qizhen_hotel', 'environmental_resource_college'],
    stars:     ['zju_gymnasium'],
    lamps:     ['old_zju_gate', 'south_gate', 'qiushi_plaque'],
  };
  // Build reverse lookup once at load
  const BUILDING_THEME = {};
  for (const [theme, ids] of Object.entries(THEME_MAP)) {
    ids.forEach(id => { BUILDING_THEME[id] = theme; });
  }

  // Cache 404 results — once we know an asset is missing we don't
  // re-fetch it on every puzzle submission. Cleared on reload.
  const missingAssets = new Set();

  // Themed emoji set used when no Lottie asset is available. Each puzzle
  // submission spawns a small flurry of glyphs that float up and fade —
  // enough to read as "something themed happened here" while real art is
  // being produced.
  const EMOJI_BANK = {
    animals:   ['🐾', '🐰', '🦌', '🐦', '🐱'],
    marine:    ['🐬', '🌊', '🐟', '💧', '🫧'],
    equations: ['π', '∫', 'Σ', '√', 'φ'],
    stars:     ['⭐', '✨', '🌟', '☄️', '✦'],
    leaves:    ['🍃', '🌿', '🍂', '🌸', '🌱'],
    lamps:     ['🏮', '💡', '✨', '🕯️', '🌙'],
  };

  function themeForBuilding(buildingId) {
    return BUILDING_THEME[buildingId] || 'animals';
  }

  function screenPointForBuilding(buildingId) {
    if (typeof App === 'undefined' || !App.state || !App.state.map) return null;
    const b = (typeof Data !== 'undefined') && Data.buildings && Data.buildings[buildingId];
    if (!b || !Array.isArray(b.position)) return null;
    // position = [y, x] in CRS.Simple latLng convention
    const pt = App.state.map.latLngToContainerPoint(L.latLng(b.position[0], b.position[1]));
    // latLngToContainerPoint returns relative to map container; we render
    // the burst as a fixed-position div whose anchor is the map element.
    const mapEl = App.state.map.getContainer();
    const rect = mapEl.getBoundingClientRect();
    return { x: rect.left + pt.x, y: rect.top + pt.y };
  }

  function playEmojiFallback(screen, theme, opts) {
    const bank = EMOJI_BANK[theme] || EMOJI_BANK.animals;
    const wrap = document.createElement('div');
    wrap.className = 'fj-emoji-burst';
    if (opts && opts.result === 'wrong') wrap.classList.add('fj-emoji-burst-wrong');
    wrap.style.left = screen.x + 'px';
    wrap.style.top  = screen.y + 'px';

    const count = 7;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'fj-emoji-particle';
      span.textContent = bank[Math.floor(Math.random() * bank.length)];
      // Spread emojis around a small circle and drift them outward.
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist  = 40 + Math.random() * 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;  // bias upward
      span.style.setProperty('--dx', dx.toFixed(1) + 'px');
      span.style.setProperty('--dy', dy.toFixed(1) + 'px');
      span.style.animationDelay = (i * 40) + 'ms';
      wrap.appendChild(span);
    }
    document.body.appendChild(wrap);
    setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 2400);
  }

  function playAt(buildingId, opts) {
    const theme = themeForBuilding(buildingId);
    const screen = screenPointForBuilding(buildingId);
    if (!screen) return;

    // Prefer Lottie if both the lib and the asset are present; otherwise
    // fall back to the emoji burst so the user always gets visual feedback.
    const lottieReady = typeof lottie !== 'undefined' && !missingAssets.has(theme);
    if (!lottieReady) {
      playEmojiFallback(screen, theme, opts);
      return;
    }

    const container = document.createElement('div');
    container.className = 'lottie-burst';
    container.style.left = screen.x + 'px';
    container.style.top  = screen.y + 'px';
    if (opts && opts.result === 'wrong') container.classList.add('lottie-burst-wrong');
    document.body.appendChild(container);

    let anim = null;
    let cleared = false;
    const cleanup = () => {
      if (cleared) return;
      cleared = true;
      if (anim && anim.destroy) anim.destroy();
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    try {
      anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'assets/lottie/' + theme + '.json',
      });
    } catch (err) {
      console.info('lottie: load failed for ' + theme, err);
      cleanup();
      playEmojiFallback(screen, theme, opts);
      return;
    }

    anim.addEventListener('complete', cleanup);
    anim.addEventListener('data_failed', () => {
      missingAssets.add(theme);
      console.info('lottie: asset missing for ' + theme + ', using emoji fallback');
      cleanup();
      playEmojiFallback(screen, theme, opts);
    });
    // Hard fallback: tear down after 5s even if events never fire
    setTimeout(cleanup, 5000);
  }

  window.AnimationSystem = { themeForBuilding, playAt };
})();
