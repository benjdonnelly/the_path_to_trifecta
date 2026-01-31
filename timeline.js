/* timeline.js
   - Renders month ticks, event markers, and a "Today" marker
   - Opens a modal with event details + countdown
*/

(() => {
  // -----------------------------
  // Config
  // -----------------------------
  const CONFIG = {
    start: '2026-01-01T00:00:00',
    end:   '2026-06-15T23:59:59',
    linePaddingPx: 14, // must match CSS line padding (left/right)
    ticks: [
      { label: 'Jan',    date: '2026-01-01' },
      { label: 'Feb',    date: '2026-02-01' },
      { label: 'Mar',    date: '2026-03-01' },
      { label: 'Apr',    date: '2026-04-01' },
      { label: 'May',    date: '2026-05-01' },
      { label: 'Jun',    date: '2026-06-01' },
      { label: 'mid-Jun',date: '2026-06-15' }
    ],
    events: [
      {
        id: 'irish-double',
        date: '2026-03-15',
        title: 'Irish Double',
        emoji: '🍀',
        info: ['8K run at 7:00 AM', '5K run at 8:30 AM']
      },
      {
        id: 'owens-corning',
        date: '2026-04-26',
        title: 'Owens Corning Half Marathon',
        emoji: '🏃‍♂️‍➡️',
        info: ['Half marathon run', 'Start time: TBD']
      },
      {
        id: 'trifecta-weekend',
        date: '2026-06-06',
        title: '2026 Trifecta Weekend',
        emoji: '🏔️',
        info: ['Beast 21K • Super 10K • Sprint 5K', 'Beast start: 10:00 AM (OPEN)']
      }
    ]
  };

  // -----------------------------
  // DOM cache (expects these IDs)
  // -----------------------------
  const dom = {
    header: document.querySelector('.site-header'),
    track: document.getElementById('timelineTrack'),
    todayMarker: document.getElementById('todayMarker'),

    modal: document.getElementById('eventModal'),
    modalClose: document.getElementById('modalClose'),
    modalTitle: document.getElementById('eventTitle'),
    modalDate: document.getElementById('eventDate'),
    modalEmoji: document.getElementById('eventEmoji'),
    modalInfo: document.getElementById('eventInfo'),
    modalCountdown: document.getElementById('eventCountdown'),
    modalCountdownSub: document.getElementById('eventCountdownSub'),
  };

  if (!dom.track) return; // nothing to render

  // -----------------------------
  // State
  // -----------------------------
  const state = {
    START: new Date(CONFIG.start),
    END: new Date(CONFIG.end),
    msDay: 24 * 60 * 60 * 1000,
    lastFocusEl: null,
    renderRaf: 0,
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const parseYmdLocal = (ymd) => new Date(`${ymd}T00:00:00`);

  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const pctForDate = (d) => {
    const p = (d.getTime() - state.START.getTime()) / (state.END.getTime() - state.START.getTime());
    return clamp01(p);
  };

  const leftPxFromPct = (pct) => {
    const w = dom.track.clientWidth;
    const pad = CONFIG.linePaddingPx;
    const inner = Math.max(0, w - pad * 2);
    return pad + inner * pct;
  };

  const daysUntil = (eventDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const e = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return Math.round((e.getTime() - today.getTime()) / state.msDay);
  };

  const setStickyOffset = () => {
    if (!dom.header) return;
    const h = dom.header.offsetHeight || 0;
    document.documentElement.style.setProperty('--sticky-top', `${h}px`);
  };

  const clearInjected = () => {
    dom.track.querySelectorAll('[data-injected="true"]').forEach((n) => n.remove());
  };

  const el = (tag, className, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  // -----------------------------
  // Modal control (safe DOM building, no innerHTML)
  // -----------------------------
  const openModal = (evt, triggerEl) => {
    if (!dom.modal) return;

    state.lastFocusEl = triggerEl || document.activeElement;

    const d = parseYmdLocal(evt.date);
    const delta = daysUntil(d);

    dom.modalEmoji.textContent = evt.emoji;
    dom.modalTitle.textContent = evt.title;
    dom.modalDate.textContent = fmtDate(d);

    // Build list safely
    dom.modalInfo.textContent = '';
    const ul = el('ul', 'list');
    evt.info.forEach((line) => {
      const li = el('li', '');
      const check = el('span', 'check');
      check.textContent = '✓';
      const text = el('span', '');
      text.textContent = line;
      li.appendChild(check);
      li.appendChild(text);
      ul.appendChild(li);
    });
    dom.modalInfo.appendChild(ul);

    if (delta > 0) {
      dom.modalCountdown.textContent = `${delta} day${delta === 1 ? '' : 's'}`;
      dom.modalCountdownSub.textContent = `until ${evt.title}`;
    } else if (delta === 0) {
      dom.modalCountdown.textContent = 'Today';
      dom.modalCountdownSub.textContent = "it's go time";
    } else {
      const ago = Math.abs(delta);
      dom.modalCountdown.textContent = `${ago} day${ago === 1 ? '' : 's'}`;
      dom.modalCountdownSub.textContent = `since ${evt.title}`;
    }

    dom.modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // focus close button for accessibility
    if (dom.modalClose) dom.modalClose.focus();
  };

  const closeModal = () => {
    if (!dom.modal) return;
    dom.modal.classList.remove('open');
    document.body.style.overflow = '';

    // return focus
    if (state.lastFocusEl && typeof state.lastFocusEl.focus === 'function') {
      state.lastFocusEl.focus();
    }
    state.lastFocusEl = null;
  };

  // -----------------------------
  // Render: ticks, events, today
  // -----------------------------
  const injectTicks = () => {
    const frag = document.createDocumentFragment();

    CONFIG.ticks.forEach((t) => {
      const d = parseYmdLocal(t.date);
      const pct = pctForDate(d);
      const left = leftPxFromPct(pct);

      const tick = el('div', 'tick', { 'data-injected': 'true' });
      tick.style.left = `${left}px`;

      const label = el('div', 'tick-label', { 'data-injected': 'true' });
      label.style.left = `${left}px`;
      label.textContent = t.label;

      frag.appendChild(tick);
      frag.appendChild(label);
    });

    dom.track.appendChild(frag);
  };

  const injectEvents = () => {
    const frag = document.createDocumentFragment();

    CONFIG.events.forEach((evt) => {
      const d = parseYmdLocal(evt.date);
      const pct = pctForDate(d);
      const left = leftPxFromPct(pct);

      const stick = el('div', 'event-stick', { 'data-injected': 'true' });
      stick.style.left = `${left}px`;

      const btn = el('button', 'event-marker', {
        type: 'button',
        'data-injected': 'true',
        'data-event-id': evt.id,
        'aria-label': `${evt.title} on ${fmtDate(d)}`
      });
      btn.style.left = `${left}px`;
      btn.textContent = evt.emoji;

      frag.appendChild(stick);
      frag.appendChild(btn);
    });

    dom.track.appendChild(frag);
  };

  const positionToday = () => {
    if (!dom.todayMarker) return;
    const now = new Date();
    const pct = pctForDate(now);
    const left = leftPxFromPct(pct);
    dom.todayMarker.style.left = `${left}px`;

    const inRange = now >= state.START && now <= state.END;
    dom.todayMarker.style.display = inRange ? 'block' : 'none';
  };

  const renderTimeline = () => {
    setStickyOffset();
    clearInjected();
    injectTicks();
    injectEvents();
    positionToday();
  };

  // Debounced/RAF render to avoid resize spam
  const scheduleRender = () => {
    cancelAnimationFrame(state.renderRaf);
    state.renderRaf = requestAnimationFrame(renderTimeline);
  };

  // -----------------------------
  // Events wiring
  // -----------------------------
  // Event delegation for markers (less listeners, cleaner)
  dom.track.addEventListener('click', (e) => {
    const btn = e.target.closest('.event-marker');
    if (!btn) return;
    const id = btn.getAttribute('data-event-id');
    const evt = CONFIG.events.find((x) => x.id === id);
    if (evt) openModal(evt, btn);
  });

  // Modal controls
  if (dom.modalClose) dom.modalClose.addEventListener('click', closeModal);

  if (dom.modal) {
    dom.modal.addEventListener('click', (e) => {
      if (e.target === dom.modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.modal && dom.modal.classList.contains('open')) closeModal();
  });

  // Resize handling
  window.addEventListener('resize', scheduleRender);
  window.addEventListener('load', () => {
    setStickyOffset();
    scheduleRender();
  });

  // Initial render
  renderTimeline();
})();
