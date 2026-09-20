/**
 * Tests for dashboard.js
 *
 * Strategy: vi.resetModules() before each test so the module re-executes
 * its top-level side effects with fresh fetch stubs and DOM. The scripts
 * are plain IIFE-style JS (not ES modules with exports), so we test
 * them by inspecting the DOM and captured fetch calls after import.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PENDING_DOSE = {
  id: 'dose-001',
  medicine_name: 'Metformin',
  medicine_strength: '500 mg',
  medicine_category: 'DIABETES',
  scheduled_for: '2026-09-20T08:00:00Z',
  effective_time: '2026-09-20T08:00:00Z',
  slot: 'MORNING',
  status: 'PENDING',
  is_overdue: false,
  can_snooze: true,
  snooze_count: 0,
  patient: 'patient-001',
  patient_name: 'Asha Patel',
};

const TODAY_RESPONSE = {
  date: '2026-09-20',
  slots: {
    MORNING: [PENDING_DOSE],
    AFTERNOON: [],
    EVENING: [],
    NIGHT: [],
  },
  summary: {
    date: '2026-09-20',
    total: 1,
    taken: 0,
    missed: 0,
    skipped: 0,
    pending: 1,
    adherence_percent: 0,
  },
};

const HISTORY_RESPONSE = {
  start_date: '2026-09-14',
  end_date: '2026-09-20',
  days: [
    { date: '2026-09-20', total: 1, taken: 0, missed: 0, skipped: 0, pending: 1, adherence_percent: 0.0, doses: [] },
    { date: '2026-09-19', total: 2, taken: 2, missed: 0, skipped: 0, pending: 0, adherence_percent: 100.0, doses: [] },
    { date: '2026-09-18', total: 2, taken: 1, missed: 1, skipped: 0, pending: 0, adherence_percent: 50.0, doses: [] },
    { date: '2026-09-17', total: 2, taken: 0, missed: 2, skipped: 0, pending: 0, adherence_percent: 0.0, doses: [] },
    { date: '2026-09-16', total: 0, taken: 0, missed: 0, skipped: 0, pending: 0, adherence_percent: 0.0, doses: [] },
    { date: '2026-09-15', total: 2, taken: 2, missed: 0, skipped: 0, pending: 0, adherence_percent: 100.0, doses: [] },
    { date: '2026-09-14', total: 2, taken: 2, missed: 0, skipped: 0, pending: 0, adherence_percent: 100.0, doses: [] },
  ],
  summary: { date: '2026-09-20', total: 11, taken: 7, missed: 3, skipped: 0, pending: 1, adherence_percent: 70.0 },
};

const MEDICINES_RESPONSE = {
  results: [
    {
      id: 'med-001',
      name: 'Metformin',
      category: 'DIABETES',
      category_display: 'Diabetes',
      quantity_remaining: 30,
      schedules: [{ time_of_day: '08:00:00', slot: 'MORNING' }],
    },
  ],
};

const USER_RESPONSE = {
  id: 'user-001',
  email: 'asha@example.com',
  full_name: 'Asha Patel',
  role: 'PATIENT',
  role_display: 'Patient',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDashboardDOM() {
  document.body.innerHTML = `
    <div id="sidebarAvatar">U</div>
    <div id="sidebarName">Loading…</div>
    <div id="sidebarEmail"></div>
    <div id="sidebarRole">Patient</div>
    <div id="topGreeting">Good morning</div>
    <div id="ringFg" style="stroke-dashoffset:213.6"></div>
    <div id="ringText">--</div>
    <div id="alertBanner" style="display:none"></div>
    <div id="weekStrip"></div>
    <div id="timeline"></div>
    <div id="filterChips"></div>
    <div id="medicineList"></div>
    <div id="modalAvatar">U</div>
    <div id="modalName">User</div>
    <div id="modalEmail"></div>
    <div id="modalRole">Patient</div>
  `;
}

function makeFetch(responses) {
  return vi.fn(async (url) => {
    const match = responses.find((r) => url.includes(r.url));
    if (!match) {
      return { ok: false, status: 404, json: async () => ({ detail: 'not found' }) };
    }
    return {
      ok: match.ok !== false,
      status: match.status || 200,
      json: async () => match.body,
    };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('dashboard.js — API integration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.setItem('access_token', 'test-jwt-token');
    buildDashboardDOM();
    // Stub window.location so navigation calls don't throw
    delete window.location;
    window.location = { href: '', pathname: '/dashboard.html' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('calls GET /api/v1/doses/today/ to load dose data (not localStorage)', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('/doses/today/'))).toBe(true);
  });

  it('renders the medicine name from the API in the timeline', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    const timeline = document.getElementById('timeline');
    expect(timeline.textContent).toContain('Metformin');
  });

  it('calls POST /api/v1/doses/{id}/take/ when Taken is clicked', async () => {
    const TAKEN_DOSE = { ...PENDING_DOSE, status: 'TAKEN' };
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
      { url: '/doses/dose-001/take/', body: TAKEN_DOSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    // markDose is defined globally in the module
    await window.markDose('dose-001', 'taken');
    await new Promise((r) => setTimeout(r, 20));

    const calls = fetchMock.mock.calls.map(([url, opts]) => ({ url, method: opts?.method }));
    const takeCall = calls.find(
      (c) => c.url.includes('/doses/dose-001/take/') && c.method === 'POST'
    );
    expect(takeCall).toBeTruthy();
  });

  it('calls POST /api/v1/doses/{id}/miss/ when Missed is clicked', async () => {
    const MISSED_DOSE = { ...PENDING_DOSE, status: 'MISSED' };
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
      { url: '/doses/dose-001/miss/', body: MISSED_DOSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    await window.markDose('dose-001', 'missed');
    await new Promise((r) => setTimeout(r, 20));

    const calls = fetchMock.mock.calls.map(([url, opts]) => ({ url, method: opts?.method }));
    const missCall = calls.find(
      (c) => c.url.includes('/doses/dose-001/miss/') && c.method === 'POST'
    );
    expect(missCall).toBeTruthy();
  });

  it('calls GET /api/v1/doses/history/?days=7 for the weekly strip', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('/doses/history/?days=7'))).toBe(true);

    const weekStrip = document.getElementById('weekStrip');
    expect(weekStrip.children.length).toBeGreaterThan(0);
  });

  it('does NOT write dose state to localStorage', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: TODAY_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    expect(localStorage.getItem('pillsync_today_doses')).toBeNull();
  });

  it('shows empty-state message when API returns no doses', async () => {
    const EMPTY_TODAY = {
      date: '2026-09-20',
      slots: { MORNING: [], AFTERNOON: [], EVENING: [], NIGHT: [] },
      summary: { total: 0, taken: 0, missed: 0, skipped: 0, pending: 0, adherence_percent: 0 },
    };
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', body: EMPTY_TODAY },
      { url: '/api/v1/medicines/', body: { results: [] } },
      { url: '/api/v1/doses/history/?days=7', body: { days: [], summary: {} } },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    const timeline = document.getElementById('timeline');
    expect(timeline.textContent.toLowerCase()).toMatch(/no doses|add a medicine/);
  });

  it('clears access_token and navigates on 401 from /doses/today/', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/today/', ok: false, status: 401, body: { detail: 'Unauthorized' } },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: '/api/v1/doses/history/?days=7', body: HISTORY_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/dashboard.js');
    await new Promise((r) => setTimeout(r, 80));

    // handleAuthError clears the token on 401
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
