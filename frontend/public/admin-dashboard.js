/* eslint-disable no-unused-vars, no-console */

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

let allUsers = [];
let activeRoleFilter = 'All';
let searchTerm = '';

// Static activity log — no backend endpoint exists yet
const activityLog = [
  { text: 'Admin dashboard connected to live backend', time: 'Just now' },
];

// ── Sidebar profile ──────────────────────────────────────────────────────────
async function loadAdminSidebar() {
  try {
    const res = await fetch('/api/v1/users/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = 'login.html'; return; }
    if (!res.ok) return;
    const user = await res.json();

    // Redirect away if not admin
    if ((user.role || '').toUpperCase() !== 'ADMIN') {
      window.location.href = 'dashboard.html';
      return;
    }

    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';
    const el = (id) => document.getElementById(id);
    if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initial;
    if (el('sidebarName'))   el('sidebarName').textContent   = user.full_name || 'Admin';
    if (el('sidebarEmail'))  el('sidebarEmail').textContent  = user.email || '';
  } catch (err) {
    console.error('Admin sidebar error:', err);
  }
}

// ── Load all users from backend ───────────────────────────────────────────────
async function loadUsers() {
  try {
    const res = await fetch('/api/v1/admin/users/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 403) {
      document.body.innerHTML = `<div style="padding:40px; color:#c0392b; font-family:sans-serif;">
        <h2>Access Denied</h2><p>You need an Admin account to view this page.</p>
        <a href="login.html">← Back to login</a>
      </div>`;
      return;
    }

    if (!res.ok) { console.error('Failed to load users:', res.status); return; }

    const data = await res.json();
    allUsers = (data.results || data).map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      role: (u.role || 'patient').toLowerCase(),
      status: u.is_active ? 'active' : 'inactive',
      joined: u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    }));

    renderStats();
    renderRoleFilterChips();
    renderUserTable();
    renderActivity();
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const totalUsers      = allUsers.length;
  const totalPatients   = allUsers.filter((u) => u.role === 'patient').length;
  const totalCaregivers = allUsers.filter((u) => u.role === 'caregiver').length;
  const activeUsers     = allUsers.filter((u) => u.status === 'active').length;

  const statGrid = document.getElementById('statGrid');
  if (!statGrid) return;
  statGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${totalUsers}</div>
      <div class="stat-label">Total users</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🧑‍⚕️</div>
      <div class="stat-value">${totalPatients}</div>
      <div class="stat-label">Patients</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🤝</div>
      <div class="stat-value">${totalCaregivers}</div>
      <div class="stat-label">Caregivers</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${activeUsers}</div>
      <div class="stat-label">Active accounts</div>
    </div>
  `;
}

// ── Role filter chips ─────────────────────────────────────────────────────────
function renderRoleFilterChips() {
  const roles = ['All', 'patient', 'caregiver', 'admin'];
  const container = document.getElementById('roleFilterChips');
  if (!container) return;
  container.innerHTML = '';

  roles.forEach((role) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (role === activeRoleFilter ? ' active' : '');
    chip.textContent = role === 'All' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1);
    chip.onclick = () => {
      activeRoleFilter = role;
      renderRoleFilterChips();
      renderUserTable();
    };
    container.appendChild(chip);
  });
}

// ── User table ────────────────────────────────────────────────────────────────
function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let filtered = activeRoleFilter === 'All' ? allUsers : allUsers.filter((u) => u.role === activeRoleFilter);

  if (searchTerm) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#8A8578; padding:20px;">No users found.</td></tr>`;
    return;
  }

  filtered.forEach((user) => {
    const row = document.createElement('tr');
    const btnLabel = user.status === 'active' ? 'Deactivate' : 'Activate';
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="role-pill role-${user.role}">${user.role}</span></td>
      <td><span class="status-dot ${user.status === 'inactive' ? 'inactive' : ''}">${user.status}</span></td>
      <td>${user.joined}</td>
      <td><button class="table-action" onclick="toggleUserStatus('${user.id}', '${user.status}')">${btnLabel}</button></td>
    `;
    tbody.appendChild(row);
  });
}

// ── Activate / Deactivate ─────────────────────────────────────────────────────
async function toggleUserStatus(userId, currentStatus) {
  const action = currentStatus === 'active' ? 'deactivate' : 'activate';
  try {
    const res = await fetch(`/api/v1/admin/users/${userId}/${action}/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Action failed.');
      return;
    }
    // Refresh users list
    await loadUsers();
  } catch (err) {
    console.error('Toggle status error:', err);
    alert('Network error. Please try again.');
  }
}

// ── Activity log ──────────────────────────────────────────────────────────────
function renderActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;
  list.innerHTML = '';
  activityLog.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `<span>${entry.text}</span><span class="activity-time">${entry.time}</span>`;
    list.appendChild(item);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('userSearch');
if (searchInput) {
  searchInput.addEventListener('input', function () {
    searchTerm = this.value;
    renderUserTable();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadAdminSidebar().then(() => loadUsers());
