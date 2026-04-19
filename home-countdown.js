(function () {
  const TARGET = new Date("2026-06-06T10:00:00-04:00");

  const els = {
    days: document.getElementById("hmCdDays"),
    hours: document.getElementById("hmCdHours"),
    minutes: document.getElementById("hmCdMinutes"),
    seconds: document.getElementById("hmCdSeconds"),
    status: document.getElementById("hmCdStatus"),
  };

  if (!els.days || !els.hours || !els.minutes || !els.seconds || !els.status) return;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function getPartsUntil(target) {
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, finished: false };
  }

  function renderCountdown() {
    const { days, hours, minutes, seconds, finished } = getPartsUntil(TARGET);

    els.days.textContent = days >= 100 ? String(days) : pad2(days);
    els.hours.textContent = pad2(hours);
    els.minutes.textContent = pad2(minutes);
    els.seconds.textContent = pad2(seconds);

    if (finished) {
      els.status.textContent = "Race day is here. Trust your training and run strong.";
      return true;
    }

    els.status.textContent = "Locked on June 6, 2026 at 10:00 AM ET.";
    return false;
  }

  renderCountdown();
  const intervalId = setInterval(function () {
    const done = renderCountdown();
    if (done) clearInterval(intervalId);
  }, 1000);
})();
