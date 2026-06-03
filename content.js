(() => {
  'use strict';

  const PROMPT_SELECTOR = '[data-tour-anchor="tour-image-form"]';
  const TOGGLE_ID       = 'hf-prompt-toggle-btn';
  const PANEL_ID        = 'hf-settings-panel';
  const HIDDEN_CLASS    = 'hf-prompt-hidden';
  const STORAGE_KEY     = 'hf_prompt_visible';
  const PREFS_KEY       = 'hf_btn_prefs';

  const DEFAULT_PREFS = {
    color: '#B0D41B', circleSize: 52, iconSize: 22, opacity: 1,
    icon: 'eye', posX: null, posY: null,
  };

  let isVisible  = true;
  let prefs      = { ...DEFAULT_PREFS };
  let observer   = null;
  let debounceTimer = null;
  let pageValid  = false;

  // ─── URL check (only run on /ai/image pages) ──────────────────────────────────
  function isOnImagePage() {
    return /^https:\/\/higgsfield\.ai\/ai\/image/.test(window.location.href);
  }

  // ─── Storage ──────────────────────────────────────────────────────────────────
  function loadState() {
    try { const s = localStorage.getItem(STORAGE_KEY); return s === null ? true : s !== 'false'; }
    catch { return true; }
  }
  function saveState(v) { try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {} }
  function loadPrefs() {
    try {
      const s = localStorage.getItem(PREFS_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.size !== undefined && parsed.circleSize === undefined) {
          parsed.circleSize = parsed.size;
          delete parsed.size;
        }
        return { ...DEFAULT_PREFS, ...parsed };
      }
      return { ...DEFAULT_PREFS };
    }
    catch { return { ...DEFAULT_PREFS }; }
  }
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }

  // ─── SVG Icons ────────────────────────────────────────────────────────────────
  const ICONS = {
    eye: {
      label: 'Eye',
      on:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>`,
      off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    },
    ghost: {
      label: 'Ghost',
      on:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9v10l2.5-2.5L10 19l2-2 2 2 2.5-2.5L19 19V9c0-3.87-3.13-7-7-7z"/><circle cx="9.5" cy="10.5" r="1.5" fill="#1a1a1a"/><circle cx="14.5" cy="10.5" r="1.5" fill="#1a1a1a"/></svg>`,
      off: `<svg viewBox="0 0 24 24" fill="currentColor" opacity=".4"><path d="M12 2C8.13 2 5 5.13 5 9v10l2.5-2.5L10 19l2-2 2 2 2.5-2.5L19 19V9c0-3.87-3.13-7-7-7z"/><line x1="3" y1="3" x2="21" y2="21" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    bulb: {
      label: 'Bulb',
      on:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6m-6-3h6m-5.5-3C8 13.5 6 11.5 6 9a6 6 0 0 1 12 0c0 2.5-2 4.5-3.5 6h-5z"/></svg>`,
      off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".4"><path d="M9 21h6m-6-3h6m-5.5-3C8 13.5 6 11.5 6 9a6 6 0 0 1 12 0c0 2.5-2 4.5-3.5 6h-5z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
    },
    spark: {
      label: 'Spark',
      on:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
      off: `<svg viewBox="0 0 24 24" fill="currentColor" opacity=".35"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
  };

  // ─── Apply prompt bar visibility ──────────────────────────────────────────────
  function applyPromptState() {
    const bar = document.querySelector(PROMPT_SELECTOR);
    if (!bar) return;
    const hasClass = bar.classList.contains(HIDDEN_CLASS);
    if (!isVisible && !hasClass) bar.classList.add(HIDDEN_CLASS);
    if (isVisible  &&  hasClass) bar.classList.remove(HIDDEN_CLASS);
  }

  // ─── Update button appearance only ────────────────────────────────────────────
  function updateButtonAppearance() {
    const btn = document.getElementById(TOGGLE_ID);
    if (!btn) return;

    btn.setAttribute('data-state', isVisible ? 'visible' : 'hidden');

    const iconSet = ICONS[prefs.icon] || ICONS.eye;
    const iconEl  = btn.querySelector('.hf-icon-svg');
    if (iconEl) {
      iconEl.innerHTML = isVisible ? iconSet.on : iconSet.off;
      iconEl.style.width  = prefs.iconSize + 'px';
      iconEl.style.height = prefs.iconSize + 'px';
    }

    btn.style.cssText = `
      width:${prefs.circleSize}px;height:${prefs.circleSize}px;
      background:${prefs.color};
      opacity:${isVisible ? prefs.opacity : Math.min(prefs.opacity, 0.65)};
      box-shadow:0 4px 24px ${prefs.color}55,0 2px 8px rgba(0,0,0,.4);
      ${prefs.posX !== null
        ? `left:${prefs.posX}px;top:${prefs.posY}px;right:auto;bottom:auto;`
        : `right:20px;bottom:112px;`}
    `;
  }

  // ─── Build button ONCE ────────────────────────────────────────────────────────
  function buildButton() {
    const btn = document.createElement('button');
    btn.id = TOGGLE_ID;

    const iconSet = ICONS[prefs.icon] || ICONS.eye;
    btn.innerHTML = `<span class="hf-icon-svg">${isVisible ? iconSet.on : iconSet.off}</span>`;

    let pointerDownX = 0, pointerDownY = 0;
    let moved = false;
    let longPressTimer = null;

    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      moved = false;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;

      longPressTimer = setTimeout(() => {
        if (!moved) openSettings();
      }, 600);

      const startLeft = btn.getBoundingClientRect().left;
      const startTop  = btn.getBoundingClientRect().top;
      const offX = e.clientX - startLeft;
      const offY = e.clientY - startTop;

      const onMove = (ev) => {
        const dx = ev.clientX - pointerDownX;
        const dy = ev.clientY - pointerDownY;
        if (!moved && Math.sqrt(dx*dx + dy*dy) < 5) return;
        moved = true;
        clearTimeout(longPressTimer);
        btn.classList.add('hf-dragging');

        const nx = Math.max(0, Math.min(ev.clientX - offX, window.innerWidth  - btn.offsetWidth));
        const ny = Math.max(0, Math.min(ev.clientY - offY, window.innerHeight - btn.offsetHeight));
        btn.style.left   = nx + 'px';
        btn.style.top    = ny + 'px';
        btn.style.right  = 'auto';
        btn.style.bottom = 'auto';
        prefs.posX = nx;
        prefs.posY = ny;
      };

      const onUp = () => {
        clearTimeout(longPressTimer);
        btn.classList.remove('hf-dragging');
        if (moved) savePrefs();
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup',   onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup',   onUp);
    });

    btn.addEventListener('click', () => {
      if (moved) return;
      toggle();
    });

    pauseObserver();
    document.body.appendChild(btn);
    resumeObserver();

    updateButtonAppearance();
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────────
  function toggle() {
    isVisible = !isVisible;
    saveState(isVisible);
    applyPromptState();
    updateButtonAppearance();

    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      btn.classList.remove('hf-ripple');
      void btn.offsetWidth;
      btn.classList.add('hf-ripple');
    }
  }

  // ─── Observer pause/resume ────────────────────────────────────────────────────
  let observerPaused = false;
  function pauseObserver()  { observerPaused = true; }
  function resumeObserver() {
    setTimeout(() => { observerPaused = false; }, 0);
  }

  // ─── The SAFE sync ───────────────────────────────────────────────────────────
  function safeSync() {
    if (!document.getElementById(TOGGLE_ID)) {
      buildButton();
    }
    applyPromptState();
  }

  // ─── Debounced observer callback ─────────────────────────────────────────────
  function onMutation() {
    if (observerPaused) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!isOnImagePage()) {
        if (pageValid) cleanup();
        return;
      }
      if (!pageValid) {
        init();
        return;
      }
      safeSync();
    }, 150);
  }

  // ─── Settings Panel ───────────────────────────────────────────────────────────
  function openSettings() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;

    panel.innerHTML = `
      <div class="hf-panel-inner">
        <div class="hf-panel-header">
          <span class="hf-panel-title">⚙ Button Settings</span>
          <button class="hf-panel-close" id="hf-close-panel">✕</button>
        </div>

        <div class="hf-panel-section">
          <div class="hf-section-label">Color</div>
          <div class="hf-color-row">
            <input type="color" id="hf-color-pick" value="${prefs.color}"/>
            <div class="hf-presets">
              ${['#B0D41B','#FF4D6D','#00C2FF','#FF9500','#A855F7','#FFFFFF'].map(c =>
                `<button class="hf-swatch" data-color="${c}" style="background:${c}"></button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div class="hf-panel-section">
          <div class="hf-section-label">Circle Size</div>
          <div class="hf-slider-row">
            <input type="range" id="hf-circle-size" min="36" max="80" value="${prefs.circleSize}"/>
            <span class="hf-slider-value" id="hf-circle-size-val">${prefs.circleSize}px</span>
          </div>
        </div>

        <div class="hf-panel-section">
          <div class="hf-section-label">Icon Size</div>
          <div class="hf-slider-row">
            <input type="range" id="hf-icon-size" min="14" max="36" value="${prefs.iconSize}"/>
            <span class="hf-slider-value" id="hf-icon-size-val">${prefs.iconSize}px</span>
          </div>
        </div>

        <div class="hf-panel-section">
          <div class="hf-section-label">Opacity</div>
          <div class="hf-slider-row">
            <input type="range" id="hf-opacity-range" min="20" max="100" value="${Math.round(prefs.opacity*100)}"/>
            <span class="hf-slider-value" id="hf-opacity-val">${Math.round(prefs.opacity*100)}%</span>
          </div>
        </div>

        <div class="hf-panel-section">
          <div class="hf-section-label">Icon Style</div>
          <div class="hf-icon-grid">
            ${Object.entries(ICONS).map(([k,v]) => `
              <button class="hf-icon-choice ${prefs.icon===k?'active':''}" data-icon="${k}">
                <span class="hf-choice-svg">${v.on}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="hf-panel-actions">
          <button id="hf-reset-pos">Reset Position</button>
          <button id="hf-reset-all">Reset All</button>
        </div>

        <p class="hf-panel-hint">Drag the button to move it · Press <kbd>P</kbd> to hide/show · Long-press for settings</p>
      </div>`;

    pauseObserver();
    document.body.appendChild(panel);
    resumeObserver();

    requestAnimationFrame(() => panel.classList.add('hf-panel-visible'));

    const close = () => {
      panel.classList.remove('hf-panel-visible');
      setTimeout(() => {
        pauseObserver();
        panel.remove();
        resumeObserver();
      }, 260);
    };

    document.getElementById('hf-close-panel').addEventListener('click', close);

    document.getElementById('hf-color-pick').addEventListener('input', (e) => {
      prefs.color = e.target.value;
      updateButtonAppearance(); savePrefs();
    });

    panel.querySelectorAll('.hf-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        prefs.color = sw.dataset.color;
        document.getElementById('hf-color-pick').value = prefs.color;
        updateButtonAppearance(); savePrefs();
      });
    });

    document.getElementById('hf-circle-size').addEventListener('input', (e) => {
      prefs.circleSize = parseInt(e.target.value);
      document.getElementById('hf-circle-size-val').textContent = prefs.circleSize + 'px';
      updateButtonAppearance(); savePrefs();
    });

    document.getElementById('hf-icon-size').addEventListener('input', (e) => {
      prefs.iconSize = parseInt(e.target.value);
      document.getElementById('hf-icon-size-val').textContent = prefs.iconSize + 'px';
      updateButtonAppearance(); savePrefs();
    });

    document.getElementById('hf-opacity-range').addEventListener('input', (e) => {
      prefs.opacity = parseInt(e.target.value) / 100;
      document.getElementById('hf-opacity-val').textContent = Math.round(prefs.opacity*100) + '%';
      updateButtonAppearance(); savePrefs();
    });

    panel.querySelectorAll('.hf-icon-choice').forEach(b => {
      b.addEventListener('click', () => {
        panel.querySelectorAll('.hf-icon-choice').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        prefs.icon = b.dataset.icon;
        updateButtonAppearance(); savePrefs();
      });
    });

    document.getElementById('hf-reset-pos').addEventListener('click', () => {
      prefs.posX = null; prefs.posY = null;
      updateButtonAppearance(); savePrefs();
    });

    document.getElementById('hf-reset-all').addEventListener('click', () => {
      prefs = { ...DEFAULT_PREFS }; savePrefs();
      updateButtonAppearance(); close();
    });

    setTimeout(() => {
      document.addEventListener('pointerdown', function outside(e) {
        if (!panel.contains(e.target) && e.target.id !== TOGGLE_ID) {
          close();
          document.removeEventListener('pointerdown', outside);
        }
      });
    }, 100);
  }

  // ─── Keyboard shortcut ────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (!pageValid) return;
    const t = e.target;
    if (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.isContentEditable || t.getAttribute('role')==='textbox') return;
    if (e.key==='p' && !e.ctrlKey && !e.metaKey && !e.altKey) toggle();
  });

  // ─── Cleanup (SPA navigated away from /ai/image) ──────────────────────────────
  function cleanup() {
    pageValid = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
    pauseObserver();
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) btn.remove();
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (!isOnImagePage()) return;

    pageValid = true;
    isVisible = loadState();
    prefs     = loadPrefs();

    buildButton();
    applyPromptState();

    observer = new MutationObserver(onMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    setTimeout(safeSync, 1000);
    setTimeout(safeSync, 3000);
  }

  // ─── SPA navigation detection ─────────────────────────────────────────────────
  function checkPage() {
    const valid = isOnImagePage();
    if (valid && !pageValid) {
      init();
    } else if (!valid && pageValid) {
      cleanup();
    }
  }

  window.addEventListener('popstate', checkPage);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
