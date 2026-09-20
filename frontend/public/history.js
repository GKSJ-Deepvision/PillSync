/* eslint-disable no-unused-vars */

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

const BASE = '/api/v1';

// ── Load sidebar user profile ─────────────────────────────────────────────────
async function loadHistorySidebar() {
  try {
    const res = await fetch(`${BASE}/users/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) return;
    const user = await res.json();
    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
    const role =
      user.role_display ||
      (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Patient');
    const el = (id) => document.getElementById(id);
    if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initial;
    if (el('sidebarName')) el('sidebarName').textContent = user.full_name;
    if (el('sidebarEmail')) el('sidebarEmail').textContent = user.email;
    if (el('sidebarRole')) el('sidebarRole').textContent = role;
  } catch (err) {
    console.error('Error loading sidebar profile:', err);
  }
}

// ── Fetch 14-day history from backend ─────────────────────────────────────────
async function loadHistory() {
  showLoading(true);
  try {
    const res = await fetch(`${BASE}/doses/history/?days=14`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      showError(`Failed to load history (${res.status}). Please try again.`);
      return;
    }

    const data = await res.json();
    // data.days is an array of daily summaries, newest-first from the backend.
    // data.summary is the aggregate over the whole period.
    renderSummary(data.summary);
    renderHistoryList(data.days);
  } catch (err) {
    console.error('Error loading history:', err);
    showError('Network error. Please check your connection and try again.');
  } finally {
    showLoading(false);
  }
}

// ── Summary stats row ─────────────────────────────────────────────────────────
function renderSummary(summary) {
  const summaryRow = document.getElementById('summaryRow');
  if (!summaryRow) return;

  if (!summary || summary.total === 0) {
    summaryRow.innerHTML = `<div class="summary-card" style="grid-column:1/-1; text-align:center;">
      <div class="stat-label" style="color:#8A8578;">No medication history yet.</div>
    </div>`;
    return;
  }

  const adh = summary.adherence_percent ?? 0;
  const missed = summary.missed ?? 0;
  const taken = summary.taken ?? 0;

  summaryRow.innerHTML = `
    <div class="summary-card">
      <div class="stat-value">${adh}%</div>
      <div class="stat-label">Overall adherence</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${taken}</div>
      <div class="stat-label">Doses taken</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${missed}</div>
      <div class="stat-label">Doses missed</div>
    </div>
  `;
}

// ── Daily history list ────────────────────────────────────────────────────────
function renderHistoryList(days) {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';

  // Filter to days that actually had doses
  const activeDays = (days || []).filter((d) => d.total > 0);

  if (activeDays.length === 0) {
    list.innerHTML = `
      <div style="color:#8A8578; font-size:14px; padding:20px 0; text-align:center;">
        No dose history yet. Mark doses as taken or missed on the
        <a href="dashboard.html" style="color:#7FA98E;">Dashboard</a> to see your history here.
      </div>`;
    return;
  }

  // Days come newest-first from the backend — display that way (most recent at top).
  activeDays.forEach((day) => {
    const row = document.createElement('div');
    row.className = 'history-row';

    const dateLabel = formatHistoryDate(day.date);

    // Build individual dose entries if the API included them, otherwise show counts only.
    let doseEntries = '';
    if (Array.isArray(day.doses) && day.doses.length > 0) {
      doseEntries = day.doses
        .map((dose) => {
          const statusClass =
            dose.status === 'TAKEN'
              ? 'taken'
              : dose.status === 'MISSED'
                ? 'missed'
                : dose.status === 'SKIPPED'
                  ? 'skipped'
                  : 'pending';
          const statusText =
            dose.status === 'TAKEN'
              ? 'Taken'
              : dose.status === 'MISSED'
                ? 'Missed'
                : dose.status === 'SKIPPED'
                  ? 'Skipped'
                  : 'Pending';
          const timeStr = dose.scheduled_for
            ? new Date(dose.scheduled_for).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : '';

          return `
          <div class="dose-entry">
            <span class="dose-med">${dose.medicine_name}${timeStr ? ` <small style="color:#aaa;">(${timeStr})</small>` : ''}</span>
            <span class="status-pill ${statusClass}">${statusText}</span>
          </div>`;
        })
        .join('');
    } else {
      // No per-dose breakdown — show counts
      doseEntries = `
        <div class="dose-entry">
          <span class="dose-med">${day.taken} taken · ${day.missed} missed · ${day.skipped} skipped</span>
          <span class="status-pill ${day.adherence_percent >= 80 ? 'taken' : day.adherence_percent > 0 ? 'partial' : 'missed'}">
            ${day.adherence_percent}%
          </span>
        </div>`;
    }

    row.innerHTML = `
      <div class="h-date">${dateLabel}</div>
      ${doseEntries}
    `;
    list.appendChild(row);
  });
}

function formatHistoryDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (_) {
    return dateStr;
  }
}

// ── Loading / error states ────────────────────────────────────────────────────
function showLoading(on) {
  const list = document.getElementById('historyList');
  if (!list) return;
  if (on) {
    list.innerHTML = `<div style="color:#8A8578; font-size:14px; padding:20px 0; text-align:center;">
      Loading history…
    </div>`;
  }
}

function showError(msg) {
  const list = document.getElementById('historyList');
  if (list) {
    list.innerHTML = `<div style="color:#d97b5b; font-size:14px; padding:20px 0; text-align:center;">${msg}</div>`;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await loadHistorySidebar();
  await loadHistory();
}

init();
