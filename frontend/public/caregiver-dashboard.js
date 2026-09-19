/* eslint-disable no-unused-vars, no-console */

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

// ── Sidebar profile ──────────────────────────────────────────────────────────
async function loadSidebarProfile() {
  try {
    const res = await fetch('/api/v1/users/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = 'login.html'; return; }
    if (!res.ok) return;
    const user = await res.json();
    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Caregiver';

    const el = (id) => document.getElementById(id);
    if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initial;
    if (el('sidebarName'))   el('sidebarName').textContent   = user.full_name || '';
    if (el('sidebarEmail'))  el('sidebarEmail').textContent  = user.email || '';
    if (el('topGreeting'))   el('topGreeting').textContent   = `${greeting}, ${firstName}`;
  } catch (err) {
    console.error('Error loading sidebar profile:', err);
  }
}

// ── Main data load ────────────────────────────────────────────────────────────
let patients = [];

async function loadCaregiverDashboard() {
  await loadSidebarProfile();

  try {
    // 1. Get accepted caregiver → patient assignments
    const assignRes = await fetch('/api/v1/caregiver-assignments/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!assignRes.ok) { renderEmpty(); return; }

    const assignData = await assignRes.json();
    const assignments = assignData.results || assignData;

    // Only ACTIVE assignments
    const active = assignments.filter((a) => a.status === 'ACTIVE' || a.status === 'active');

    if (active.length === 0) { renderEmpty(); return; }

    // 2. Get accessible patient profiles (the backend already filters to assigned patients)
    const profileRes = await fetch('/api/v1/profiles/patients/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = profileRes.ok ? await profileRes.json() : { results: [] };
    const profiles = profileData.results || profileData;

    // 3. Get accessible medicines (backend returns only medicines for assigned patients)
    const medRes = await fetch('/api/v1/medicines/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const medData = medRes.ok ? await medRes.json() : { results: [] };
    const medicines = medData.results || medData;

    // Build patient list from profiles, enriched with medicine data
    patients = profiles.map((profile) => {
      const patientMeds = medicines.filter(
        (m) => m.patient === profile.id || m.patient?.id === profile.id
      );
      const lowStock = patientMeds
        .filter((m) => m.quantity_remaining != null && m.quantity_remaining <= 5)
        .map((m) => `${m.name} (${m.quantity_remaining} left)`);

      // Build conditions string from patient_conditions if available
      const conditions = (profile.patient_conditions || [])
        .map((c) => c.condition?.name || c.condition_display || '')
        .filter(Boolean)
        .join(', ') || 'No conditions listed';

      return {
        id: profile.id,
        name: profile.full_name || profile.user?.full_name || 'Unknown Patient',
        condition: conditions,
        adherence: null, // adherence API not yet available
        lowStock,
        missedToday: false, // no adherence endpoint yet
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

  if (patients.length === 0) { renderEmpty(); return; }

  patients.forEach((p) => {
    const initial = p.name.charAt(0).toUpperCase();
    // Show adherence as N/A until adherence API is available
    const adherenceDisplay = p.adherence !== null ? `${p.adherence}%` : 'N/A';
    const badgeClass = p.adherence === null ? 'badge-neutral' : (p.adherence >= 75 ? 'badge-good' : 'badge-warning');
    const badgeText  = p.adherence === null ? 'Monitoring' : (p.adherence >= 75 ? 'On track' : 'Needs attention');

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
          <div class="patient-adherence-label">Adherence this week</div>
        </div>
        <span class="patient-status-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Kick off
loadCaregiverDashboard();
