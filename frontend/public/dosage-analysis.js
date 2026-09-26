const medicines = [
  { id: 1, name: "Amlodipine 5mg", times: ["07:00"], color: "#FF6B6B" },
  { id: 2, name: "Metformin 500mg", times: ["08:00"], color: "#00C2A8" },
  { id: 3, name: "Vitamin D3", times: ["08:00"], color: "#E9C46A" },
  { id: 4, name: "Azithromycin 500mg", times: ["13:00"], color: "#7C6AF5" },
  { id: 5, name: "Levothyroxine 50mcg", times: ["21:00"], color: "#4ECDC4" },
];

function timeToAngle(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m;
  return (totalMinutes / (24 * 60)) * 360 - 90;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function showDoseDetail(med, time) {
  const panel = document.getElementById("doseDetailPanel");
  panel.classList.add("active");
  panel.innerHTML = `
    <div class="dd-name">${med.name}</div>
    <div class="dd-time">Scheduled at ${time}</div>
  `;
}

function renderDoseClock() {
  const cx = 130, cy = 130, r = 100;
  let svg = `<svg viewBox="0 0 260 260">
    <circle class="clock-face" cx="${cx}" cy="${cy}" r="${r}" />`;

  for (let h = 0; h < 24; h++) {
    const angle = (h / 24) * 360 - 90;
    const isMajor = h % 6 === 0;
    const outer = polarToCartesian(cx, cy, r, angle);
    const inner = polarToCartesian(cx, cy, r - (isMajor ? 12 : 6), angle);
    svg += `<line class="${isMajor ? 'clock-tick-major' : 'clock-tick'}" x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" />`;
    if (isMajor) {
      const labelPos = polarToCartesian(cx, cy, r + 14, angle);
      const label = h === 0 ? "12am" : h === 6 ? "6am" : h === 12 ? "12pm" : "6pm";
      svg += `<text class="clock-hour-label" x="${labelPos.x}" y="${labelPos.y + 3}">${label}</text>`;
    }
  }

  let doseIndex = 0;
  medicines.forEach((med) => {
    med.times.forEach((time) => {
      const angle = timeToAngle(time);
      const pos = polarToCartesian(cx, cy, r, angle);
      svg += `<g class="dose-dot" data-med-index="${doseIndex}" onclick="handleDotClick(${med.id}, '${time}')">
        <circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${med.color}" stroke="white" stroke-width="2" />
      </g>`;
      doseIndex++;
    });
  });

  svg += `<text class="clock-center-label" x="${cx}" y="${cy - 4}">${medicines.reduce((s, m) => s + m.times.length, 0)} doses</text>
    <text class="clock-hour-label" x="${cx}" y="${cy + 12}">today</text>`;
  svg += `</svg>`;

  document.getElementById("clockWrap").innerHTML = svg;

  document.getElementById("clockLegend").innerHTML = medicines
    .map((m) => `<div class="legend-chip"><div class="legend-dot" style="background:${m.color}"></div>${m.name}</div>`)
    .join("");
}

function handleDotClick(medId, time) {
  const med = medicines.find((m) => m.id === medId);
  if (med) showDoseDetail(med, time);
}

// ===== NEXT DOSE COUNTDOWN =====
function getNextDose() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const allDoses = [];
  medicines.forEach((med) => {
    med.times.forEach((time) => {
      const [h, m] = time.split(":").map(Number);
      allDoses.push({ med, time, minutes: h * 60 + m });
    });
  });

  const upcoming = allDoses
    .filter((d) => d.minutes > nowMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  if (upcoming.length > 0) return upcoming[0];

  // No more doses today — return the earliest one tomorrow
  const sorted = allDoses.sort((a, b) => a.minutes - b.minutes);
  return sorted.length > 0 ? { ...sorted[0], tomorrow: true } : null;
}

function updateCountdown() {
  const next = getNextDose();
  const display = document.getElementById("countdownDisplay");

  if (!next) {
    display.innerHTML = `<div class="countdown-sub">No doses scheduled</div>`;
    return;
  }

  const now = new Date();
  const target = new Date();
  const [h, m] = next.time.split(":").map(Number);
  target.setHours(h, m, 0, 0);
  if (next.tomorrow || target < now) target.setDate(target.getDate() + 1);

  const diffMs = target - now;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  display.innerHTML = `
    <div class="countdown-time">${diffH}h ${diffM}m</div>
    <div class="countdown-med">${next.med.name}</div>
    <div class="countdown-sub">at ${next.time}${next.tomorrow ? ' tomorrow' : ''}</div>
  `;
}

// ===== SMART SUGGESTIONS =====
function renderSuggestions() {
  const timeMap = {};
  medicines.forEach((med) => {
    med.times.forEach((time) => {
      if (!timeMap[time]) timeMap[time] = [];
      timeMap[time].push(med);
    });
  });

  const conflicts = Object.entries(timeMap).filter(([time, meds]) => meds.length > 1);
  const container = document.getElementById("suggestionsList");

  if (conflicts.length === 0) {
    container.innerHTML = `<div class="no-suggestions">No suggestions right now — your schedule looks well-spaced.</div>`;
    return;
  }

  container.innerHTML = conflicts
    .map(([time, meds]) => {
      const [h, m] = time.split(":").map(Number);
      const suggestedH = m + 30 >= 60 ? h + 1 : h;
      const suggestedM = (m + 30) % 60;
      const suggestedTime = `${String(suggestedH).padStart(2, "0")}:${String(suggestedM).padStart(2, "0")}`;
      const keepMed = meds[0].name;
      const moveMed = meds[1].name;

      return `
        <div class="suggestion-item">
          <strong>Space out ${time} doses</strong>
          Consider moving ${moveMed} to ${suggestedTime} to avoid taking it alongside ${keepMed}.
        </div>
      `;
    })
    .join("");
}

function renderConflicts() {
  const timeMap = {};
  medicines.forEach((med) => {
    med.times.forEach((time) => {
      if (!timeMap[time]) timeMap[time] = [];
      timeMap[time].push(med.name);
    });
  });

  const conflicts = Object.entries(timeMap).filter(([time, meds]) => meds.length > 1);
  const section = document.getElementById("conflictsSection");

  if (conflicts.length === 0) {
    section.innerHTML = `
      <h2 class="section-title">Schedule conflicts</h2>
      <div class="no-conflicts">✓ No overlapping dose times found.</div>
    `;
  } else {
    section.innerHTML =
      `<h2 class="section-title">Schedule conflicts</h2>` +
      conflicts
        .map(
          ([time, meds]) =>
            `<div class="conflict-item">⚠ ${meds.join(" and ")} are both scheduled at ${time} — consider spacing them apart.</div>`
        )
        .join("");
  }
}

function renderFullSchedule() {
  const timeMap = {};
  medicines.forEach((med) => {
    med.times.forEach((time) => {
      if (!timeMap[time]) timeMap[time] = [];
      timeMap[time].push(med.name);
    });
  });

  const sortedTimes = Object.keys(timeMap).sort();
  const list = document.getElementById("scheduleList");
  list.innerHTML = sortedTimes
    .map(
      (time) => `
      <div class="schedule-row">
        <div class="schedule-time">${time}</div>
        <div class="schedule-meds">${timeMap[time].join(", ")}</div>
      </div>
    `
    )
    .join("");
}

renderDoseClock();
updateCountdown();
setInterval(updateCountdown, 60000); // refresh every minute
renderSuggestions();
renderConflicts();
renderFullSchedule();