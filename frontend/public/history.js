/* eslint-disable no-unused-vars, no-console */

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

// Dose records persisted by the dashboard page
let localDoses = JSON.parse(localStorage.getItem('pillsync_today_doses')) || [];

// Medicine names from backend (for mapping medicine IDs to names)
let medicineMap = {};

// Final history log built from backend + local data
let historyLog = [];

// ── Load real medicine names from backend ────────────────────────────────────
async function loadMedicines() {
  try {
    const res = await fetch('/api/v1/medicines/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = 'login.html'; return false; }
    if (!res.ok) return false;

    const data = await res.json();
    const medicines = data.results || data;

    // Map id → name for reference
    medicines.forEach((m) => {
      medicineMap[m.id] = m.name;
    });
    return true;
  } catch (err) {
    console.error('Error loading medicines for history:', err);
    return false;
  }
}

// ── Build history from local tracking + real medicine names ───────────────────
function buildHistoryLog() {
  historyLog = [];

  if (localDoses.length === 0) {
    // No local tracking yet — show an encouraging empty state
    return;
  }

  // Group doses by date key stored in localStorage (or show as "Today" if no date)
  // The dashboard stores doses as: { id, time, name, status }
  // We enrich names using medicineMap where possible

  const enrichedDoses = localDoses.map((d) => {
    // Extract medicine id from dose id pattern "dose_<medId>_<idx>"
    const parts = (d.id || '').split('_');
    const medId = parts.length >= 2 ? parts[1] : null;
    const realName = medId && medicineMap[medId] ? medicineMap[medId] : d.name;
    return {
      med: realName,
      time: d.time || '',
      status: d.status === 'pending' ? 'missed' : d.status,
    };
  });

  historyLog.push({
    date: 'Today — ' + new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    doses: enrichedDoses,
  });
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function renderSummary() {
  let totalDoses = 0;
  let totalTaken = 0;

  historyLog.forEach((day) => {
    day.doses.forEach((dose) => {
      totalDoses++;
      if (dose.status === 'taken') totalTaken++;
    });
  });

  const adherenceRate = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;
  const missedCount   = totalDoses - totalTaken;

  const summaryRow = document.getElementById('summaryRow');
  if (!summaryRow) return;
  summaryRow.innerHTML = `
    <div class="summary-card">
      <div class="stat-value">${adherenceRate}%</div>
      <div class="stat-label">Overall adherence</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${totalTaken}</div>
      <div class="stat-label">Doses taken</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${missedCount}</div>
      <div class="stat-label">Doses missed</div>
    </div>
  `;
}

// ── History list ──────────────────────────────────────────────────────────────
function renderHistoryList() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';

  if (historyLog.length === 0) {
    list.innerHTML = `
      <div style="color:#8A8578; font-size:14px; padding:20px 0; text-align:center;">
        No dose history yet. Mark doses as taken or missed on the 
        <a href="dashboard.html" style="color:#7FA98E;">Dashboard</a> to see your history here.
      </div>`;
    return;
  }

  [...historyLog].reverse().forEach((day) => {
    const row = document.createElement('div');
    row.className = 'history-row';

    const doseEntries = day.doses
      .map(
        (dose) => `
      <div class="dose-entry">
        <span class="dose-med">${dose.med}${dose.time ? ` <small style="color:#aaa;">(${dose.time})</small>` : ''}</span>
        <span class="status-pill ${dose.status}">${dose.status === 'taken' ? 'Taken' : 'Missed'}</span>
      </div>
    `
      )
      .join('');

    row.innerHTML = `
      <div class="h-date">${day.date}</div>
      ${doseEntries}
    `;
    list.appendChild(row);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await loadMedicines();
  buildHistoryLog();
  renderSummary();
  renderHistoryList();
}

init();
