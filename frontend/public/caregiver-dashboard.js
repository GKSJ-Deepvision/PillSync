 

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

const BASE = '/api/v1';

// ── Sidebar profile ───────────────────────────────────────────────────────────
async function loadSidebarProfile() {
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
    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Caregiver';

    const el = (id) => document.getElementById(id);
    if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initial;
    if (el('sidebarName')) el('sidebarName').textContent = user.full_name || '';
    if (el('sidebarEmail')) el('sidebarEmail').textContent = user.email || '';
    if (el('topGreeting')) el('topGreeting').textContent = `${greeting}, ${firstName}`;
  } catch (err) {
    console.error('Error loading sidebar profile:', err);
  }
}

// ── Main data load ────────────────────────────────────────────────────────────
let patients = [];

async function loadCaregiverDashboard() {
  await loadSidebarProfile();

  try {
    // 1. Get caregiver → patient assignments
    const assignRes = await fetch(`${BASE}/caregiver-assignments/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!assignRes.ok) {
      renderEmpty();
      return;
    }

    const assignData = await assignRes.json();
    const assignments = assignData.results || assignData;
    const active = assignments.filter(
      (a) => (a.status || '').toUpperCase() === 'ACTIVE'
    );

    if (active.length === 0) {
      renderEmpty();
      return;
    }

    // 2. Get accessible patient profiles (backend already filters to assigned patients)
    const profileRes = await fetch(`${BASE}/profiles/patients/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = profileRes.ok ? await profileRes.json() : { results: [] };
    const profiles = profileData.results || profileData;

    if (profiles.length === 0) {
      renderEmpty();
      return;
    }

    // 3. Get medicine list (backend returns only medicines for accessible patients)
    const medRes = await fetch(`${BASE}/medicines/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const medData = medRes.ok ? await medRes.json() : { results: [] };
    const medicines = medData.results || medData;

    // 4. For each patient, fetch today's dose summary to get real adherence and missed info.
    //    Requests run in parallel for efficiency.
    const todaySummaries = await Promise.allSettled(
      profiles.map((profile) =>
        fetch(`${BASE}/doses/today/?patient=${profile.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null))
      )
    );

    // 5. Build enriched patient list
    patients = profiles.map((profile, idx) => {
      const patientMeds = medicines.filter(
        (m) => m.patient === profile.id || m.patient?.id === profile.id
      );
      const lowStock = patientMeds
        .filter((m) => m.quantity_remaining != null && m.quantity_remaining <= 5)
        .map((m) => `${m.name} (${m.quantity_remaining} left)`);

      const conditions = (profile.patient_conditions || [])
        .map((c) => c.condition?.name || c.condition_display || '')
        .filter(Boolean)
        .join(', ') || 'No conditions listed';

      // Today's dose summary from the backend
      const todayResult = todaySummaries[idx];
      let adherence = null;
      let missedToday = false;
      let pendingCount = 0;

      if (todayResult.status === 'fulfilled' && todayResult.value) {
        const summary = todayResult.value.summary || {};
        adherence = summary.adherence_percent ?? null;
        missedToday = (summary.missed || 0) > 0;
        pendingCount = summary.pending || 0;
      }

      return {
        id: profile.id,
        name: profile.full_name || 'Unknown Patient',
        condition: conditions,
        adherence,
        missedToday,
        pendingCount,
        lowStock,
      };
    });

    renderAlerts();
    renderPatients();
  } catch (err) {
    console.error('Error loading caregiver dashboard:', err);
    renderEmpty();
  }
}

function renderEmpty() {
  const grid = document.getElementById('patientGrid');
  const section = document.getElementById('alertsSection');
  if (section) section.innerHTML = '';
  if (grid) {
    grid.innerHTML = `
      <div style="color:#8A8578; font-size:14px; padding:20px 0; grid-column:1/-1;">
        You have no linked patients yet. A patient needs to invite you as their caregiver.
      </div>`;
  }
}

function renderAlerts() {
  const section = document.getElementById('alertsSection');
  if (!section) return;
  section.innerHTML = '';

  patients.forEach((p) => {
    if (p.missedToday) {
      const alert = document.createElement('div');
      alert.className = 'alert-item';
      alert.textContent = `⚠ ${p.name} missed a dose today`;
      section.appendChild(alert);
    }
    if (p.lowStock.length > 0) {
      const alert = document.createElement('div');
      alert.className = 'alert-item';
      alert.textContent = `⚠ ${p.name} is low on: ${p.lowStock.join(', ')}`;
      section.appendChild(alert);
    }
  });

  if (section.children.length === 0) {
    section.innerHTML = `<div style="color:#7FA98E; font-size:14px;">✅ No alerts right now — all patients are on track.</div>`;
  }
}

function renderPatients() {
  const grid = document.getElementById('patientGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (patients.length === 0) {
    renderEmpty();
    return;
  }

  patients.forEach((p) => {
    const initial = p.name.charAt(0).toUpperCase();

    let adherenceDisplay, badgeClass, badgeText;
    if (p.adherence === null) {
      adherenceDisplay = 'N/A';
      badgeClass = 'badge-neutral';
      badgeText = 'No data yet';
    } else {
      adherenceDisplay = `${p.adherence}%`;
      if (p.adherence >= 80) {
        badgeClass = 'badge-good';
        badgeText = 'On track';
      } else if (p.adherence >= 50) {
        badgeClass = 'badge-warning';
        badgeText = 'Needs attention';
      } else {
        badgeClass = 'badge-warning';
        badgeText = 'Low adherence';
      }
    }

    const pendingNote =
      p.pendingCount > 0
        ? `<div class="patient-pending">${p.pendingCount} dose${p.pendingCount > 1 ? 's' : ''} still pending today</div>`
        : '';

    const card = document.createElement('div');
    card.className = 'patient-card';
    card.innerHTML = `
      <div class="patient-card-top">
        <div class="patient-avatar">${initial}</div>
        <div>
          <div class="patient-name">${p.name}</div>
          <div class="patient-condition">${p.condition}</div>
        </div>
      </div>
      <div class="patient-stats">
        <div>
          <div class="patient-adherence">${adherenceDisplay}</div>
          <div class="patient-adherence-label">Adherence today</div>
        </div>
        <span class="patient-status-badge ${badgeClass}">${badgeText}</span>
      </div>
      ${pendingNote}
    `;
    grid.appendChild(card);
  });
}

// ── Kick off ──────────────────────────────────────────────────────────────────
loadCaregiverDashboard();
