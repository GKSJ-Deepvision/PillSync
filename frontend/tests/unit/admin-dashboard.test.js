/**
 * Tests for admin-dashboard.js
 *
 * Verifies:
 * - Users loaded from GET /api/v1/admin/users/
 * - Activity feed loaded from GET /api/v1/notifications/log/
 * - Real notification entries rendered (no hardcoded static text)
 * - Stats computed from live user data
 * - Empty activity state handled
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ADMIN_USER = {
  id: 'user-admin',
  email: 'admin@pillsync.com',
  full_name: 'Admin User',
  role: 'ADMIN',
  role_display: 'Admin',
};

const ALL_USERS_RESPONSE = {
  results: [
    { id: 'u1', full_name: 'Asha Patel', email: 'asha@example.com', role: 'PATIENT', is_active: true, date_joined: '2026-09-01T00:00:00Z' },
    { id: 'u2', full_name: 'Ravi Kumar', email: 'ravi@example.com', role: 'CAREGIVER', is_active: true, date_joined: '2026-09-02T00:00:00Z' },
    { id: 'u3', full_name: 'Priya Sharma', email: 'priya@example.com', role: 'PATIENT', is_active: false, date_joined: '2026-09-03T00:00:00Z' },
  ],
};

const NOTIFICATIONS_LOG_RESPONSE = {
  results: [
    {
      id: 'notif-001',
      category: 'DOSE_REMINDER',
      category_display: 'Medicine reminder',
      channel: 'EMAIL',
      channel_display: 'Email',
      status: 'SENT',
      status_display: 'Sent',
      subject: 'Time to take Metformin',
      body: 'Please take your Metformin dose.',
      payload: {},
      dose_event: 'dose-001',
      error: '',
      sent_at: '2026-09-20T08:05:00Z',
      created_at: '2026-09-20T08:00:00Z',
    },
    {
      id: 'notif-002',
      category: 'DOSE_MISSED',
      category_display: 'Missed dose',
      channel: 'PUSH',
      channel_display: 'Push notification',
      status: 'SENT',
      status_display: 'Sent',
      subject: '',
      body: 'Missed Lisinopril dose.',
      payload: {},
      dose_event: 'dose-002',
      error: '',
      sent_at: '2026-09-20T09:30:00Z',
      created_at: '2026-09-20T09:30:00Z',
    },
  ],
};

function buildAdminDOM() {
  document.body.innerHTML = `
    <div id="sidebarAvatar">A</div>
    <div id="sidebarName">Loading…</div>
    <div id="sidebarEmail"></div>
    <section id="statGrid"></section>
    <input id="userSearch" type="text" />
    <div id="roleFilterChips"></div>
    <table><tbody id="userTableBody"></tbody></table>
    <div id="activityList"></div>
  `;
}

function makeFetch(responses) {
  return vi.fn(async (url) => {
    const match = responses.find((r) => url.includes(r.url));
    if (!match) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: match.ok !== false, status: match.status || 200, json: async () => match.body };
  });
}

describe('admin-dashboard.js — API integration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.setItem('access_token', 'test-jwt-token');
    buildAdminDOM();
    delete window.location;
    window.location = { href: '', pathname: '/admin-dashboard.html' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('fetches users from GET /api/v1/admin/users/', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('/admin/users/'))).toBe(true);
  });

  it('renders correct stats: 3 total, 2 patients, 1 caregiver', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const statGrid = document.getElementById('statGrid');
    expect(statGrid.textContent).toContain('3'); // total
    expect(statGrid.textContent).toContain('2'); // patients + active
    expect(statGrid.textContent).toContain('1'); // caregivers
  });

  it('calls GET /api/v1/notifications/log/ for the activity feed', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('/notifications/log/'))).toBe(true);
  });

  it('renders real notification category_display and channel_display in the feed', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const activityList = document.getElementById('activityList');
    expect(activityList.textContent).toContain('Medicine reminder');
    expect(activityList.textContent).toContain('Email');
    expect(activityList.textContent).toContain('Sent');
    expect(activityList.textContent).toContain('Missed dose');
  });

  it('does NOT show the old static text "Admin dashboard connected to live backend"', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const activityList = document.getElementById('activityList');
    expect(activityList.textContent).not.toContain('Admin dashboard connected to live backend');
  });

  it('shows "No recent activity" when notifications log is empty', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: { results: [] } },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const activityList = document.getElementById('activityList');
    expect(activityList.textContent.toLowerCase()).toContain('no recent activity');
  });

  it('renders all 3 users in the user table', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: ADMIN_USER },
      { url: '/api/v1/admin/users/', body: ALL_USERS_RESPONSE },
      { url: '/api/v1/notifications/log/', body: NOTIFICATIONS_LOG_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/admin-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const tbody = document.getElementById('userTableBody');
    expect(tbody.textContent).toContain('Asha Patel');
    expect(tbody.textContent).toContain('Ravi Kumar');
    expect(tbody.textContent).toContain('Priya Sharma');
  });
});
