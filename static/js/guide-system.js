/* ============================================================
   guide-system.js — Paper-style 6-step onboarding tour.

   Restores the legacy "Help & Guide" flow that was lost during
   the Field Journal redesign. Six steps mirror Data.levels 1-6
   so the tour and the level system stay in lockstep.

   Wires:
   - #startGuideBtn (welcome overlay) → start tour
   - #helpBtn drawer → start tour
   - #guideNext / #guidePrev / #guideClose
   - #levelBadge stats refresh (levelNum / levelProgressFill /
     recordCount / unlockCount)
   Also makes App.showLevelElements safe in the new layout
   (the old per-feature side panels no longer exist).
   ============================================================ */

(function () {
  if (typeof App === 'undefined') return;

  const GUIDE_STEPS = [
    {
      title: '认识校园 · Recognising the Map',
      body:
        '欢迎来到「紫金港声音地图」。<br>' +
        '<strong>拖拽</strong>地图平移，<strong>滚轮</strong>缩放，<strong>点击</strong>地标查看建筑详情。<br>' +
        '试着移动一下地图，感受这本田野手账的尺度。',
      highlight: '#map'
    },
    {
      title: '放置标记 · Drop a Pin',
      body:
        '在侧栏的 Markers 卡片里选一个类型（Study / Love / Sport / Club / Memory / Sound）；<br>' +
        '然后<strong>点击地图任意位置</strong>，或把鼠标移到目标位置后按 <kbd>N</kbd> 键。',
      highlight: '.fj-markers-grid'
    },
    {
      title: '录制声音 · Capture a Sound',
      body:
        '在 Field Notes 卡片里给声音起个名字，按红色 <strong>●</strong> 开始录音，<br>' +
        '完成后按方形按钮停止。也可以从 ⋯ 菜单 → 创作 → 上传音频谜题。',
      highlight: '.fj-record-strip'
    },
    {
      title: '绑定声音 · Bind Audio to a Pin',
      body:
        '在 Field Notes 列表里点已上传或录制的音频条目把它选中；<br>' +
        '再选 <strong>Sound</strong> 类型，点击地图落点 —— 声音就和位置绑定了。',
      highlight: '.fj-notes-card'
    },
    {
      title: '校园地标 · Listen to Landmarks',
      body:
        '地图上的建筑卡片自带「声音谜题」。<br>' +
        '点开建筑信息卡，按 <strong>▶ 播放</strong> 听一段声音，再尝试猜出它属于哪里。',
      highlight: '#map'
    },
    {
      title: '自由探索 · Open Field',
      body:
        '基础流程到这里。打开右上角 <strong>⋯ 菜单</strong> 可以进入「声音探索 / 图书馆挑战 / 声音游记 / 3D 校园」。<br>' +
        '点击右上角 <strong>关卡</strong> 数字可以随时重看本关说明。',
      highlight: '#moreBtn'
    }
  ];

  function positionPopup(popup) {
    popup.style.left = '50%';
    popup.style.top  = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
  }

  function clearHighlights() {
    document.querySelectorAll('.guide-highlight').forEach(el => {
      el.classList.remove('guide-highlight');
    });
  }

  function applyHighlight(selector) {
    clearHighlights();
    if (!selector) return;
    document.querySelectorAll(selector).forEach(el => el.classList.add('guide-highlight'));
  }

  Object.assign(App, {

    _guideStep: 0,

    startGuide() {
      this._guideStep = 0;
      // Close welcome overlay without triggering showLevelInfo / recommend
      // pulse — the guide tour will introduce the level system itself.
      const welcome = document.getElementById('welcomeOverlay');
      if (welcome) welcome.style.display = 'none';
      localStorage.setItem('hasVisitedBefore', 'true');
      this.state.allowLevel1Trigger = true;
      this.state.allowShowLevelInfo = true;
      this.state.allowCompleteLevel = true;
      const overlay = document.getElementById('guideOverlay');
      const popup   = document.getElementById('guidePopup');
      if (!overlay || !popup) return;
      overlay.style.display = 'block';
      overlay.style.pointerEvents = 'none';
      popup.style.display = 'block';
      positionPopup(popup);
      this._renderGuideStep();
    },

    _renderGuideStep() {
      const step = GUIDE_STEPS[this._guideStep];
      if (!step) return;
      const titleEl = document.getElementById('guideTitle');
      const bodyEl  = document.getElementById('guideContent');
      const indEl   = document.getElementById('guideStepIndicator');
      const prevBtn = document.getElementById('guidePrev');
      const nextBtn = document.getElementById('guideNext');
      if (titleEl) titleEl.textContent = step.title;
      if (bodyEl)  bodyEl.innerHTML    = step.body;
      if (indEl)   indEl.textContent   = `步骤 ${this._guideStep + 1} / ${GUIDE_STEPS.length}`;
      if (prevBtn) prevBtn.style.display = this._guideStep > 0 ? 'inline-block' : 'none';
      if (nextBtn) nextBtn.textContent   = this._guideStep === GUIDE_STEPS.length - 1 ? '完成' : '下一步 →';
      applyHighlight(step.highlight);
    },

    nextGuideStep() {
      if (this._guideStep < GUIDE_STEPS.length - 1) {
        this._guideStep++;
        this._renderGuideStep();
      } else {
        this.closeGuide();
      }
    },

    prevGuideStep() {
      if (this._guideStep > 0) {
        this._guideStep--;
        this._renderGuideStep();
      }
    },

    closeGuide() {
      const overlay = document.getElementById('guideOverlay');
      const popup   = document.getElementById('guidePopup');
      if (overlay) overlay.style.display = 'none';
      if (popup)   popup.style.display   = 'none';
      clearHighlights();
    },

    refreshHeaderStats() {
      try {
        const lvl = Storage.userProgress.currentLevel || 1;
        const totalLevels = Data.levels.length;
        const numEl  = document.getElementById('levelNum');
        const fillEl = document.getElementById('levelProgressFill');
        if (numEl)  numEl.textContent = lvl;
        if (fillEl) fillEl.style.width = Math.min(100, (lvl / totalLevels) * 100) + '%';

        const recordCount = (this.state.markers ? this.state.markers.size : 0)
                          + (this.state.defaultAudioMarkers ? this.state.defaultAudioMarkers.length : 0);
        const recEl = document.getElementById('recordCount');
        if (recEl) recEl.textContent = recordCount;

        const unlocked = (Storage.userProgress.unlockedBuildings || []).length;
        const unEl = document.getElementById('unlockCount');
        if (unEl) unEl.textContent = unlocked;
      } catch (err) { /* non-fatal */ }
    },

    // The pre-redesign layout had separate side panels keyed by
    // `<feature>-panel` IDs. Those nodes are gone — markers/audio/etc
    // now live inside the unified Field Journal sidebar cards which
    // are always visible. Make this a no-op so callers
    // (applyLevelRestrictionsWithoutPopup) don't crash.
    showLevelElements() { /* no-op in Field Journal layout */ }
  });

  // ── Wire DOM after load ────────────────────────────────────
  function wire() {
    const startBtn = document.getElementById('startGuideBtn');
    if (startBtn && !startBtn.dataset.bound) {
      startBtn.dataset.bound = '1';
      startBtn.addEventListener('click', () => App.startGuide());
    }
    const nextBtn = document.getElementById('guideNext');
    const prevBtn = document.getElementById('guidePrev');
    const closeBtn = document.getElementById('guideClose');
    if (nextBtn  && !nextBtn.dataset.bound)  { nextBtn.dataset.bound  = '1'; nextBtn.addEventListener('click', () => App.nextGuideStep()); }
    if (prevBtn  && !prevBtn.dataset.bound)  { prevBtn.dataset.bound  = '1'; prevBtn.addEventListener('click', () => App.prevGuideStep()); }
    if (closeBtn && !closeBtn.dataset.bound) { closeBtn.dataset.bound = '1'; closeBtn.addEventListener('click', () => App.closeGuide()); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
