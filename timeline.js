(function () {
  // ===== Timeline window: Jan 1 → mid-June =====
  const START = new Date("2026-01-01T00:00:00");
  const END = new Date("2026-06-15T23:59:59");

  // ===== Events =====
  const EVENTS = [
    {
      id: "irish-double",
      date: "2026-03-15",
      title: "Irish Double",
      emoji: "🍀",
      info: ["8K run at 7:00 AM", "5K run at 8:30 AM"],
    },
    {
      id: "owens-corning",
      date: "2026-04-26",
      title: "Owens Corning Half Marathon",
      emoji: "🏃‍♂️‍➡️",
      info: ["Half marathon run", "Start time: TBD"],
    },
    {
      id: "trifecta-weekend",
      date: "2026-06-06",
      title: "2026 Trifecta Weekend",
      emoji: "🏔️",
      info: ["Beast 21K • Super 10K • Sprint 5K", "Beast start: 10:00 AM (OPEN)"],
    },
  ];

  const msDay = 24 * 60 * 60 * 1000;

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function pctForDate(d) {
    const p = (d.getTime() - START.getTime()) / (END.getTime() - START.getTime());
    return clamp01(p);
  }

  function fmtDate(d) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function daysUntil(eventDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const e = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return Math.round((e.getTime() - today.getTime()) / msDay);
  }

  function setStickyOffset(headerEl) {
    if (!headerEl) return;
    const h = headerEl.offsetHeight || 0;
    document.documentElement.style.setProperty("--sticky-top", h + "px");
  }

  function clearInjected(trackEl) {
    trackEl.querySelectorAll('[data-injected="true"]').forEach((n) => n.remove());
  }

  function leftPxFromPct(trackEl, pct) {
    // keep inside the padded line area (14px on each side)
    const w = trackEl.clientWidth;
    const inner = w - 28;
    return 14 + inner * pct;
  }

  function injectTicks(trackEl) {
    const months = [
      { label: "Jan", date: "2026-01-01" },
      { label: "Feb", date: "2026-02-01" },
      { label: "Mar", date: "2026-03-01" },
      { label: "Apr", date: "2026-04-01" },
      { label: "May", date: "2026-05-01" },
      { label: "Jun", date: "2026-06-01" },
      { label: "mid-Jun", date: "2026-06-15" },
    ];

    months.forEach((m) => {
      const d = new Date(m.date + "T00:00:00");
      const pct = pctForDate(d);
      const left = leftPxFromPct(trackEl, pct);

      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = left + "px";
      tick.setAttribute("data-injected", "true");

      const label = document.createElement("div");
      label.className = "tick-label";
      label.style.left = left + "px";
      label.textContent = m.label;
      label.setAttribute("data-injected", "true");

      trackEl.appendChild(tick);
      trackEl.appendChild(label);
    });
  }

  function wireModal(modalEls) {
    const { modal, closeBtn } = modalEls;

    if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("open")) closeModal(modal);
    });
  }

  function openModal(evt, modalEls) {
    const { modal, emojiEl, titleEl, dateEl, infoEl, countdownEl, countdownSubEl } = modalEls;

    const d = new Date(evt.date + "T00:00:00");
    const delta = daysUntil(d);

    if (emojiEl) emojiEl.textContent = evt.emoji;
    if (titleEl) titleEl.textContent = evt.title;
    if (dateEl) dateEl.textContent = fmtDate(d);

    if (infoEl) {
      infoEl.innerHTML =
        '<ul class="list">' +
        evt.info
          .map((line) => '<li><span class="check">✓</span><span>' + line + "</span></li>")
          .join("") +
        "</ul>";
    }

    if (countdownEl && countdownSubEl) {
      if (delta > 0) {
        countdownEl.textContent = delta + " day" + (delta === 1 ? "" : "s");
        countdownSubEl.textContent = "until " + evt.title;
      } else if (delta === 0) {
        countdownEl.textContent = "Today";
        countdownSubEl.textContent = "it’s go time";
      } else {
        const ago = Math.abs(delta);
        countdownEl.textContent = ago + " day" + (ago === 1 ? "" : "s");
        countdownSubEl.textContent = "since " + evt.title;
      }
    }

    if (modal) modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function injectEvents(trackEl, modalEls) {
    EVENTS.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      const pct = pctForDate(d);
      const left = leftPxFromPct(trackEl, pct);

      const stick = document.createElement("div");
      stick.className = "event-stick";
      stick.style.left = left + "px";
      stick.setAttribute("data-injected", "true");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "event-marker";
      btn.style.left = left + "px";
      btn.textContent = e.emoji;
      btn.setAttribute("aria-label", e.title + " on " + fmtDate(d));
      btn.setAttribute("data-injected", "true");

      btn.addEventListener("click", () => openModal(e, modalEls));

      trackEl.appendChild(stick);
      trackEl.appendChild(btn);
    });
  }

  function positionToday(trackEl, todayMarkerEl) {
    if (!todayMarkerEl) return;

    const now = new Date();
    const pct = pctForDate(now);
    const left = leftPxFromPct(trackEl, pct);

    todayMarkerEl.style.left = left + "px";

    const inRange = now >= START && now <= END;
    todayMarkerEl.style.display = inRange ? "block" : "none";
  }

  function render() {
    const trackEl = document.getElementById("timelineTrack");
    if (!trackEl) return; // no timeline on this page

    // If layout isn't ready yet, wait a frame (prevents 0px widths)
    if (trackEl.clientWidth < 50) {
      requestAnimationFrame(render);
      return;
    }

    const headerEl = document.querySelector(".site-header");
    const todayMarkerEl = document.getElementById("todayMarker");

    const modalEls = {
      modal: document.getElementById("eventModal"),
      closeBtn: document.getElementById("modalClose"),
      titleEl: document.getElementById("eventTitle"),
      dateEl: document.getElementById("eventDate"),
      emojiEl: document.getElementById("eventEmoji"),
      infoEl: document.getElementById("eventInfo"),
      countdownEl: document.getElementById("eventCountdown"),
      countdownSubEl: document.getElementById("eventCountdownSub"),
    };

    setStickyOffset(headerEl);
    clearInjected(trackEl);
    injectTicks(trackEl);
    injectEvents(trackEl, modalEls);
    positionToday(trackEl, todayMarkerEl);
    wireModal(modalEls);
  }

  function init() {
    render();
    window.addEventListener("resize", render);
    window.addEventListener("load", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
