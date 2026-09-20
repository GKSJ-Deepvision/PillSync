/* eslint-disable no-unused-vars */

// ── State ─────────────────────────────────────────────────────────────────────
// todayData holds the full /doses/today/ response so we can re-render without
// refetching on every button press.
let todayData = { slots: {}, summary: {} };
let myMedicines = [];
let activeCategory = 'All';

const BASE = '/api/v1';

const categoryColors = {
  BLOOD_PRESSURE: '#D97B5B',
  DIABETES: '#7FA98E',
  THYROID: '#C9A96E',
  ANTIBIOTICS: '#8E7CC3',
  VITAMINS: '#C9A96E',
  HEART: '#D97B5B',
  OTHER: '#8A8578',
};

// ── Auth helper ───────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('access_token');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

function handleAuthError(status) {
  if (status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

// ── Modal helpers (referenced from HTML) ─────────────────────────────────────
function openProfileModal() {
  document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

// ── Main data load ────────────────────────────────────────────────────────────
async function loadDashboardData() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // All three requests in parallel — user profile, today's doses, medicine list.
  const [userRes, dosesRes, medRes, weekRes] = await Promise.allSettled([
    fetch(`${BASE}/users/me/`, { headers: authHeaders() }),
    fetch(`${BASE}/doses/today/`, { headers: authHeaders() }),
    fetch(`${BASE}/medicines/`, { headers: authHeaders() }),
    fetch(`${BASE}/doses/history/?days=7`, { headers: authHeaders() }),
  ]);

  // ── User profile ───────────────────────────────────────────────────────────
  if (userRes.status === 'fulfilled' && userRes.value.ok) {
    const user = await userRes.value.json();
    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
    const role =
      user.role_display ||
      (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Patient');
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'User';
    const hour = new Date().getHours();
    const greeting =
      hour >= 5 && hour < 12
        ? 'Good morning'
        : hour >= 12 && hour < 17
          ? 'Good afternoon'
          : hour >= 17 && hour < 22
            ? 'Good evening'
            : 'Good night';

    const el = (id) => document.getElementById(id);
    if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initial;
    if (el('sidebarName')) el('sidebarName').textContent = user.full_name;
    if (el('sidebarEmail')) el('sidebarEmail').textContent = user.email;
    if (el('sidebarRole')) el('sidebarRole').textContent = role;
    if (el('topGreeting')) el('topGreeting').textContent = `${greeting}, ${firstName}`;
    if (el('modalAvatar')) el('modalAvatar').textContent = initial;
    if (el('modalName')) el('modalName').textContent = user.full_name;
    if (el('modalEmail')) el('modalEmail').textContent = user.email;
    if (el('modalRole')) el('modalRole').textContent = role;
  } else if (userRes.status === 'fulfilled') {
    handleAuthError(userRes.value.status);
  }

  // ── Today's doses — the backend is the authoritative source ───────────────
  if (dosesRes.status === 'fulfilled' && dosesRes.value.ok) {
    todayData = await dosesRes.value.json();
  } else if (dosesRes.status === 'fulfilled') {
    handleAuthError(dosesRes.value.status);
    todayData = { slots: {}, summary: {} };
  } else {
    todayData = { slots: {}, summary: {} };
  }

  // ── Medicine list (bottom section) ─────────────────────────────────────────
  if (medRes.status === 'fulfilled' && medRes.value.ok) {
    const data = await medRes.value.json();
    const medicines = data.results || data;
    myMedicines = medicines.map((med) => ({
      id: med.id,
      name: med.name,
      category: med.category || 'OTHER',
      categoryDisplay: med.category_display || 'Other',
      freq:
        med.schedules && med.schedules.length > 0 ? `${med.schedules.length} time(s)/day` : '—',
      stock: med.quantity_remaining,
      color: categoryColors[med.category] || '#8A8578',
    }));
  }

  // ── Weekly history strip ───────────────────────────────────────────────────
  let weekHistory = null;
  if (weekRes.status === 'fulfilled' && weekRes.value.ok) {
    weekHistory = await weekRes.value.json();
  }

  renderAll(weekHistory);
}

// ── Render everything ─────────────────────────────────────────────────────────
function renderAll(weekHistory) {
  renderAdherenceRing();
  renderAlertBanner();
  renderWeekStrip(weekHistory);
  renderTimeline();
  renderFilterChips();
  renderMedicineList();
}

// ── Adherence ring — from today's summary ─────────────────────────────────────
function renderAdherenceRing() {
  const pct = todayData.summary?.adherence_percent ?? 0;
  const circumference = 213.6;
  const offset = circumference - (pct / 100) * circumference;
  const fg = document.getElementById('ringFg');
  const txt = document.getElementById('ringText');
  if (fg) fg.style.strokeDashoffset = offset;
  if (txt) txt.textContent = pct + '%';
}

// ── Low-stock alert banner — from medicine list ───────────────────────────────
function renderAlertBanner() {
  const lowStockMeds = myMedicines.filter((m) => m.stock != null && m.stock <= 5);
  const banner = document.getElementById('alertBanner');
  if (!banner) return;
  if (lowStockMeds.length === 0) {
    banner.style.display = 'none';
    return;
  }
  const names = lowStockMeds.map((m) => `${m.name} (${m.stock} left)`).join(', ');
  banner.textContent = `⚠ Refill needed soon: ${names}`;
  banner.style.display = 'block';
}

// ── Weekly strip — from /doses/history/?days=7 ────────────────────────────────
function renderWeekStrip(weekHistory) {
  const strip = document.getElementById('weekStrip');
  if (!strip) return;
  strip.innerHTML = '';

  if (!weekHistory || !weekHistory.days || weekHistory.days.length === 0) {
    // No history yet — show today only as placeholder
    const today = new Date();
    const dayName = today.toLocaleDateString('en-GB', { weekday: 'short' });
    const box = document.createElement('div');
    box.className = 'day-box day-future';
    box.innerHTML = `<span class="day-label">${dayName}</span>`;
    strip.appendChild(box);
    return;
  }

  // The history endpoint returns days newest-first (ordered by -scheduled_for in view).
  // We want to display Mon→Sun (oldest→newest), so reverse the array.
  const days = [...weekHistory.days].reverse();

  const today = new Date().toISOString().slice(0, 10);

  days.forEach((entry) => {
    const box = document.createElement('div');
    const dateStr = entry.date; // "2026-09-14" etc.
    const d = new Date(dateStr + 'T00:00:00');
    const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' });

    let statusClass;
    if (dateStr > today) {
      // Future day
      statusClass = 'day-future';
    } else if (entry.total === 0) {
      // No doses scheduled on that day
      statusClass = 'day-future';
    } else if (entry.adherence_percent >= 80) {
      statusClass = 'day-full';
    } else if (entry.adherence_percent > 0) {
      statusClass = 'day-partial';
    } else {
      statusClass = 'day-missed';
    }

    box.className = `day-box ${statusClass}`;
    box.title = `${entry.taken}/${entry.total} taken (${entry.adherence_percent}%)`;
    box.innerHTML = `<span class="day-label">${dayLabel}</span>`;
    strip.appendChild(box);
  });
}

// ── Today's doses timeline — from /doses/today/ ───────────────────────────────
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  timeline.innerHTML = '';

  // Flatten all slots into a single ordered list
  const SLOT_ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  const allDoses = [];
  SLOT_ORDER.forEach((slot) => {
    const doses = todayData.slots?.[slot] || [];
    doses.forEach((d) => allDoses.push(d));
  });

  if (allDoses.length === 0) {
    timeline.innerHTML = `<p style="font-size:14px;color:#8A8578;padding:12px 0;">
      No doses scheduled for today. <a href="add-medicine.html" style="color:var(--sage-soft);">Add a medicine</a> to get started.
    </p>`;
    return;
  }

  allDoses.forEach((dose) => {
    renderDoseChip(dose, timeline);
  });
}

function renderDoseChip(dose, container) {
  const chip = document.createElement('div');
  const resolved = dose.status === 'TAKEN' || dose.status === 'MISSED' || dose.status === 'SKIPPED';
  const snoozed = dose.status === 'SNOOZED';

  let statusClass = '';
  if (dose.status === 'TAKEN') statusClass = 'status-taken';
  else if (dose.status === 'MISSED') statusClass = 'status-missed';

  chip.className = `dose-chip${statusClass ? ' ' + statusClass : ''}`;
  chip.dataset.doseId = dose.id;

  // Format display time from scheduled_for or effective_time (snooze uses effective_time)
  const displayTime = formatTime(dose.effective_time || dose.scheduled_for);

  // Status label
  let statusLabel = '';
  if (dose.status === 'TAKEN') statusLabel = '<div class="dose-status-label taken-label">✓ Taken</div>';
  else if (dose.status === 'MISSED') statusLabel = '<div class="dose-status-label missed-label">✗ Missed</div>';
  else if (dose.status === 'SKIPPED') statusLabel = '<div class="dose-status-label skipped-label">— Skipped</div>';
  else if (snoozed) statusLabel = '<div class="dose-status-label snoozed-label">⏱ Snoozed</div>';

  const overdueFlag = dose.is_overdue ? '<span class="overdue-tag">Overdue</span>' : '';

  chip.innerHTML = `
    <div class="time">${displayTime}${overdueFlag}</div>
    <div class="med-name">${dose.medicine_name}</div>
    ${dose.medicine_strength ? `<div class="med-strength">${dose.medicine_strength}</div>` : ''}
    ${statusLabel}
    ${!resolved ? `
    <div class="actions">
      <button class="btn-taken" id="btn-taken-${dose.id}" onclick="markDose('${dose.id}', 'taken')" ${snoozed ? '' : ''}>Taken</button>
      <button class="btn-missed" id="btn-missed-${dose.id}" onclick="markDose('${dose.id}', 'missed')">Missed</button>
    </div>` : ''}
  `;

  container.appendChild(chip);
}

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (_) {
    return isoString.slice(11, 16);
  }
}

// ── Dose action — POST to backend ──────────────────────────────────────────────
window.markDose = async function markDose(doseId, action) {
  const btnTaken = document.getElementById(`btn-taken-${doseId}`);
  const btnMissed = document.getElementById(`btn-missed-${doseId}`);

  // Disable buttons while the request is in flight
  if (btnTaken) btnTaken.disabled = true;
  if (btnMissed) btnMissed.disabled = true;

  const endpoint = action === 'taken' ? 'take' : 'miss';

  try {
    const res = await fetch(`${BASE}/doses/${doseId}/${endpoint}/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });

    if (res.status === 401) {
      handleAuthError(401);
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || err?.detail || `Action failed (${res.status}).`;
      // Re-enable buttons so user can retry
      if (btnTaken) btnTaken.disabled = false;
      if (btnMissed) btnMissed.disabled = false;
      showToast(msg, 'error');
      return;
    }

    // Backend returns the updated DoseEvent — update our local state and re-render.
    const updatedDose = await res.json();
    updateDoseInState(updatedDose);
    renderAdherenceRing();
    renderTimeline();
  } catch (err) {
    console.error('markDose error:', err);
    if (btnTaken) btnTaken.disabled = false;
    if (btnMissed) btnMissed.disabled = false;
    showToast('Network error. Please try again.', 'error');
  }
}

function updateDoseInState(updatedDose) {
  const SLOT_ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  SLOT_ORDER.forEach((slot) => {
    if (!todayData.slots?.[slot]) return;
    const idx = todayData.slots[slot].findIndex((d) => d.id === updatedDose.id);
    if (idx !== -1) {
      todayData.slots[slot][idx] = updatedDose;
    }
  });

  // Recompute summary from updated local state
  const allDoses = SLOT_ORDER.flatMap((s) => todayData.slots?.[s] || []);
  const taken = allDoses.filter((d) => d.status === 'TAKEN').length;
  const missed = allDoses.filter((d) => d.status === 'MISSED').length;
  const skipped = allDoses.filter((d) => d.status === 'SKIPPED').length;
  const pending = allDoses.filter((d) => d.status === 'PENDING' || d.status === 'SNOOZED').length;
  const total = allDoses.length;
  const resolved = taken + missed;
  const adherence_percent = resolved > 0 ? Math.round((taken / resolved) * 100) : 0;
  todayData.summary = { total, taken, missed, skipped, pending, adherence_percent };
}

// ── Simple toast notification ──────────────────────────────────────────────────
function showToast(message, type = 'info') {
  let toast = document.getElementById('pillsync-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pillsync-toast';
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;background:#2b2b28;color:white;padding:12px 20px;' +
      'border-radius:10px;font-size:13px;font-weight:600;z-index:9999;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#d97b5b' : '#3d5a4c';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

// ── Filter chips ──────────────────────────────────────────────────────────────
function renderFilterChips() {
  const categories = ['All', ...new Set(myMedicines.map((m) => m.categoryDisplay))];
  const chipsContainer = document.getElementById('filterChips');
  if (!chipsContainer) return;
  chipsContainer.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategory = cat;
      renderFilterChips();
      renderMedicineList();
    };
    chipsContainer.appendChild(chip);
  });
}

// ── Medicine list (bottom of dashboard) ───────────────────────────────────────
function renderMedicineList() {
  const list = document.getElementById('medicineList');
  if (!list) return;
  list.innerHTML = '';

  if (myMedicines.length === 0) {
    list.innerHTML = `<p style="font-size:14px;color:#8A8578;padding:12px 0;">
      No medicines yet. <a href="add-medicine.html" style="color:var(--sage-soft);">Add one</a>.
    </p>`;
    return;
  }

  const filtered =
    activeCategory === 'All'
      ? myMedicines
      : myMedicines.filter((m) => m.categoryDisplay === activeCategory);

  filtered.forEach((med) => {
    const row = document.createElement('div');
    row.className = 'medicine-row';
    const stockLow = med.stock != null && med.stock <= 5;
    const stockClass = stockLow ? 'stock-low' : 'stock-ok';
    const stockText =
      med.stock == null ? '—' : stockLow ? `Only ${med.stock} left` : `${med.stock} in stock`;
    row.innerHTML = `
      <div class="category-dot" style="background:${med.color}"></div>
      <div class="medicine-info">
        <div class="m-name">${med.name}</div>
        <div class="m-detail">${med.categoryDisplay} · ${med.freq}</div>
      </div>
      <div class="stock-tag ${stockClass}">${stockText}</div>
    `;
    list.appendChild(row);
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
loadDashboardData();
