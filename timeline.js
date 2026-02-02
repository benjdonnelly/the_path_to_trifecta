    (function () {
      // Treat all countdown targets as Eastern Time (handles DST correctly).
      // Timeline window: Jan 1 → mid-June
      const START = new Date("2026-01-01T00:00:00");
      const END = new Date("2026-06-15T23:59:59");

      // Events (date + local ET start time)
      const EVENTS = [
        {
          id: "irish-double",
          date: "2026-03-15",
          time: "07:00",
          targetISO: "2026-03-15T07:00:00-06:00",
          title: "Irish Double",
          emoji: "🍀",
          info: [
            "Start: 7:00 AM ET",
            "8K + 5K run",
            "Location:",
            "Bay Area Comm. foundation",
            "1000 Adams ST, Bay City",
          ],
        },
        {
          id: "owens-corning",
          date: "2026-04-26",
          time: "06:30",
          targetISO: "2026-04-26T06:30:00-04:00",
          title: "Owens Corning Half Marathon",
          emoji: "🏃‍♂️‍➡️",
          info: [
            "Start: 6:30 AM ET",
            "Half marathon",
            "Location:",
            "2925 W Bancroft ST, Toledo, OH",
          ],
        },
        {
          id: "trifecta-weekend",
          date: "2026-06-06",
          time: "10:00",
          targetISO: "2026-06-06T10:00:00-04:00",
          title: "2026 Trifecta Weekend",
          emoji: "🏔️",
          info: [
            "Start: 10:00 AM ET",
            "Beast 21K • Super 10K • Sprint 5K",
            "Location:",
            "19074 Perfect Place Lane, Lawrenceburg, IN, 47025",
          ],
        },
      ];

      let countdownInterval = null;

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

      function setStickyOffset(headerEl) {
        if (!headerEl) return;
        const h = headerEl.offsetHeight || 0;
        document.documentElement.style.setProperty("--sticky-top", h + "px");
      }

      function clearInjected(trackEl) {
        trackEl.querySelectorAll('[data-injected="true"]').forEach((n) => n.remove());
      }

      function leftPxFromPct(trackEl, pct) {
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

      // ===== Countdown helpers (DD HH MM SS) =====
      function pad2(n) {
        return String(n).padStart(2, "0");
      }

      function fmtDays(n) {
        if (n >= 100) return String(n);
        return pad2(n);
      }

      function partsUntil(targetDate) {
        const diffMs = targetDate.getTime() - Date.now();
        if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, state: "past" };

        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // If we’re within 1 second of start, call it NOW.
        const state = totalSeconds <= 0 ? "now" : "future";
        return { days, hours, minutes, seconds, state };
      }

      function setCountdownUI(evt, targetDate) {
        const titleEl = document.getElementById("eventCountdownTitle");
        const dEl = document.getElementById("cdDays");
        const hEl = document.getElementById("cdHours");
        const mEl = document.getElementById("cdMinutes");
        const sEl = document.getElementById("cdSeconds");

        const { days, hours, minutes, seconds, state } = partsUntil(targetDate);

        if (state === "future") {
          if (titleEl) titleEl.textContent = "until " + evt.title;
          if (dEl) dEl.textContent = fmtDays(days);
          if (hEl) hEl.textContent = pad2(hours);
          if (mEl) mEl.textContent = pad2(minutes);
          if (sEl) sEl.textContent = pad2(seconds);
          return;
        }

        // Cleaner handling for NOW / already started
        if (titleEl) titleEl.textContent = (state === "now") ? "NOW" : "Started";
        if (dEl) dEl.textContent = "00";
        if (hEl) hEl.textContent = "00";
        if (mEl) mEl.textContent = "00";
        if (sEl) sEl.textContent = "00";
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
        const { modal, emojiEl, titleEl, dateEl, infoEl } = modalEls;
        const target = new Date(evt.targetISO);

        if (emojiEl) emojiEl.textContent = evt.emoji;
        if (titleEl) titleEl.textContent = evt.title;
        if (dateEl) dateEl.textContent = fmtDate(target);

        if (infoEl) {
          const html = evt.info
            .map((line) => {
              const t = String(line || "").trim();
              if (t.toLowerCase() === "location:") {
                return '<li class="no-check"><span class="label-strong">Location:</span></li>';
              }
              return '<li><span class="check">✓</span><span>' + t + "</span></li>";
            })
            .join("");

          infoEl.innerHTML = '<ul class="list">' + html + "</ul>";
        }

        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }

        setCountdownUI(evt, target);
        countdownInterval = setInterval(() => setCountdownUI(evt, target), 1000);

        if (modal) modal.classList.add("open");
        document.body.style.overflow = "hidden";
      }

      function closeModal(modal) {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
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
          btn.setAttribute("aria-label", e.title);
          btn.setAttribute("data-injected", "true");

          btn.addEventListener("click", () => openModal(e, modalEls));

          trackEl.appendChild(stick);
          trackEl.appendChild(btn);
        });
      }

      function positionToday(trackEl, todayMarkerEl) {
        if (!todayMarkerEl) return;

        const now = new Date(Date.now()); // instant is correct regardless of local TZ
        const pct = pctForDate(now);
        const left = leftPxFromPct(trackEl, pct);

        todayMarkerEl.style.left = left + "px";

        const inRange = now >= START && now <= END;
        todayMarkerEl.style.display = inRange ? "block" : "none";
      }

      function render() {
        const trackEl = document.getElementById("timelineTrack");
        if (!trackEl) return;

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
