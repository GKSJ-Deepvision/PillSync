/* eslint-disable no-unused-vars */

const token = localStorage.getItem('access_token');
if (!token) window.location.href = 'login.html';

let allUsers = [];
let activeRoleFilter = 'All';
let searchTerm = '';

const BASE = 'http://127.0.0.1:8000';

// ── Sidebar profile (admin-only guard) ────────────────────────────────────────
async function loadAdminSidebar() {
  try {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
      return;
    }
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
    if (el('sidebarName')) el('sidebarName').textContent = user.full_name || 'Admin';
    if (el('sidebarEmail')) el('sidebarEmail').textContent = user.email || '';
  } catch (err) {
    console.error('Admin sidebar error:', err);
  }
}

// ── Load all users from backend ───────────────────────────────────────────────
async function loadUsers() {
  try {
    const res = await fetch(`${BASE}/admin/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 403) {
      document.body.innerHTML = `<div style="padding:40px; color:#c0392b; font-family:sans-serif;">
        <h2>Access Denied</h2><p>You need an Admin account to view this page.</p>
        <a href="login.html">← Back to login</a>
      </div>`;
      return;
    }

    if (!res.ok) {
      console.error('Failed to load users:', res.status);
      return;
    }

    const data = await res.json();
    allUsers = (data.results || data).map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      role: (u.role || 'patient').toLowerCase(),
      status: u.is_active ? 'active' : 'inactive',
      joined: u.date_joined
        ? new Date(u.date_joined).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
    }));

    renderStats();
    renderRoleFilterChips();
    renderUserTable();
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// ── Load activity feed from notification log ──────────────────────────────────
// The /notifications/log/ endpoint is scoped to the logged-in user's own
// received notifications. For an admin user this shows platform notifications
// directed at them (missed-dose alerts, system events, etc.).
async function loadActivityFeed() {
  const list = document.getElementById('activityList');
  if (!list) return;

  list.innerHTML = `<div style="color:#8a8578; font-size:13px;">Loading activity…</div>`;

  try {
    // Request newest-first, cap at 20 entries for the feed.
    const res = await fetch(`${BASE}/notifications/log/?ordering=-created_at`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      list.innerHTML = `<div style="color:#8a8578; font-size:13px;">Could not load activity (${res.status}).</div>`;
      return;
    }

    const data = await res.json();
    const entries = (data.results || data).slice(0, 20);

    if (entries.length === 0) {
      list.innerHTML = `<div style="color:#8a8578; font-size:13px;">No recent activity yet.</div>`;
      return;
    }

    list.innerHTML = '';
    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const when = entry.sent_at || entry.created_at;
      const timeLabel = when ? formatActivityTime(when) : '—';
      // e.g. "Medicine reminder via Email · Sent"
      const text =
        [entry.category_display, entry.channel_display].filter(Boolean).join(' via ') +
        (entry.status_display ? ` · ${entry.status_display}` : '');

      item.innerHTML = `<span>${text}</span><span class="activity-time">${timeLabel}</span>`;
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading activity feed:', err);
    if (list)
      list.innerHTML = `<div style="color:#8a8578; font-size:13px;">Could not load activity.</div>`;
  }
}

function formatActivityTime(isoString) {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch (_) {
    return isoString;
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const totalUsers = allUsers.length;
  const totalPatients = allUsers.filter((u) => u.role === 'patient').length;
  const totalCaregivers = allUsers.filter((u) => u.role === 'caregiver').length;
  const activeUsers = allUsers.filter((u) => u.status === 'active').length;

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

  let filtered =
    activeRoleFilter === 'All' ? allUsers : allUsers.filter((u) => u.role === activeRoleFilter);

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
    const res = await fetch(`${BASE}/admin/users/${userId}/${action}/`, {
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

// ── Search ────────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('userSearch');
if (searchInput) {
  searchInput.addEventListener('input', function () {
    searchTerm = this.value;
    renderUserTable();
  });
}

// ── Init — load users and activity feed in parallel ───────────────────────────
loadAdminSidebar().then(() => {
  Promise.all([loadUsers(), loadActivityFeed()]);
});



