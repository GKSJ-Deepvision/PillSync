/**
 * Tests for history.js
 *
 * Verifies:
 * - History is fetched from GET /api/v1/doses/history/?days=14 (not localStorage)
 * - Summary stats populated from real backend data
 * - Daily entries rendered from actual API response
 * - Empty/error states handled correctly
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const HISTORY_14_RESPONSE = {
  start_date: '2026-09-07',
  end_date: '2026-09-20',
  days: [
    {
      date: '2026-09-20',
      total: 2,
      taken: 1,
      missed: 1,
      skipped: 0,
      pending: 0,
      adherence_percent: 50.0,
      doses: [
        { id: 'dose-001', medicine_name: 'Metformin', scheduled_for: '2026-09-20T08:00:00Z', status: 'TAKEN' },
        { id: 'dose-002', medicine_name: 'Lisinopril', scheduled_for: '2026-09-20T09:00:00Z', status: 'MISSED' },
      ],
    },
    {
      date: '2026-09-19',
      total: 2,
      taken: 2,
      missed: 0,
      skipped: 0,
      pending: 0,
      adherence_percent: 100.0,
      doses: [
        { id: 'dose-003', medicine_name: 'Metformin', scheduled_for: '2026-09-19T08:00:00Z', status: 'TAKEN' },
        { id: 'dose-004', medicine_name: 'Lisinopril', scheduled_for: '2026-09-19T09:00:00Z', status: 'TAKEN' },
      ],
    },
  ],
  summary: {
    date: '2026-09-20',
    total: 4,
    taken: 3,
    missed: 1,
    skipped: 0,
    pending: 0,
    adherence_percent: 75.0,
  },
};

const USER_RESPONSE = {
  id: 'user-001',
  email: 'asha@example.com',
  full_name: 'Asha Patel',
  role: 'PATIENT',
  role_display: 'Patient',
};

function buildHistoryDOM() {
  document.body.innerHTML = `
    <div id="sidebarAvatar">U</div>
    <div id="sidebarName">Loading…</div>
    <div id="sidebarEmail"></div>
    <div id="sidebarRole">Patient</div>
    <section id="summaryRow"></section>
    <div id="historyList"></div>
  `;
}

function makeFetch(responses) {
  return vi.fn(async (url) => {
    const match = responses.find((r) => url.includes(r.url));
    if (!match) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: match.ok !== false, status: match.status || 200, json: async () => match.body };
  });
}

describe('history.js — API integration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.setItem('access_token', 'test-jwt-token');
    buildHistoryDOM();
    delete window.location;
    window.location = { href: '', pathname: '/history.html' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('fetches history from GET /api/v1/doses/history/?days=14', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: HISTORY_14_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('/doses/history/?days=14'))).toBe(true);
  });

  it('does NOT read from localStorage.pillsync_today_doses', async () => {
    // Pre-populate localStorage with old-style data — it must be ignored
    localStorage.setItem(
      'pillsync_today_doses',
      JSON.stringify([{ id: 'old-dose', name: 'OldDrug', status: 'taken' }])
    );

    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: HISTORY_14_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const historyList = document.getElementById('historyList');
    // OldDrug from localStorage must not appear
    expect(historyList.textContent).not.toContain('OldDrug');
    // Real medicine name from the backend should appear
    expect(historyList.textContent).toContain('Metformin');
  });

  it('renders the adherence_percent from the backend summary (75%)', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: HISTORY_14_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const summaryRow = document.getElementById('summaryRow');
    expect(summaryRow.textContent).toContain('75');
  });

  it('renders correct taken (3) and missed (1) counts from backend', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: HISTORY_14_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const summaryRow = document.getElementById('summaryRow');
    expect(summaryRow.textContent).toContain('3'); // taken
    expect(summaryRow.textContent).toContain('1'); // missed
  });

  it('renders Taken and Missed labels in the history list', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: HISTORY_14_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const historyList = document.getElementById('historyList');
    expect(historyList.textContent).toContain('Taken');
    expect(historyList.textContent).toContain('Missed');
    expect(historyList.textContent).toContain('Lisinopril');
  });

  it('shows empty state when backend returns no history', async () => {
    const EMPTY = {
      start_date: '2026-09-07',
      end_date: '2026-09-20',
      days: [],
      summary: { total: 0, taken: 0, missed: 0, skipped: 0, pending: 0, adherence_percent: 0 },
    };
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', body: EMPTY },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const historyList = document.getElementById('historyList');
    expect(historyList.textContent.toLowerCase()).toMatch(/no dose history|dashboard/);
  });

  it('shows error state when API returns 500', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/doses/history/?days=14', ok: false, status: 500, body: {} },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/history.js');
    await new Promise((r) => setTimeout(r, 80));

    const historyList = document.getElementById('historyList');
    expect(historyList.textContent.toLowerCase()).toMatch(/failed|error|try again/);
  });
});
