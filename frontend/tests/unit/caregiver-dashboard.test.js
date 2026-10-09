/**
 * Tests for caregiver-dashboard.js
 *
 * Verifies:
 * - Patient list loaded from GET /api/v1/profiles/patients/
 * - Per-patient dose summary fetched from GET /api/v1/doses/today/?patient={id}
 * - Real adherence_percent displayed (not null/N/A)
 * - Missed dose alerts shown correctly
 * - Low stock alerts shown
 * - Empty state when no active assignments
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const USER_RESPONSE = {
  id: 'user-cg',
  email: 'caregiver@example.com',
  full_name: 'Ravi Kumar',
  role: 'CAREGIVER',
  role_display: 'Caregiver',
};

const ASSIGNMENTS_RESPONSE = {
  results: [{ id: 'assign-001', status: 'ACTIVE', patient: 'patient-001' }],
};

const PROFILES_RESPONSE = {
  results: [
    {
      id: 'patient-001',
      full_name: 'Asha Patel',
      patient_conditions: [{ condition: { name: 'Diabetes' } }],
    },
  ],
};

const MEDICINES_RESPONSE = {
  results: [
    {
      id: 'med-001',
      name: 'Metformin',
      patient: 'patient-001',
      quantity_remaining: 3, // low stock (≤5)
    },
  ],
};

const TODAY_PATIENT_RESPONSE = {
  date: '2026-09-20',
  slots: { MORNING: [], AFTERNOON: [], EVENING: [], NIGHT: [] },
  summary: {
    date: '2026-09-20',
    total: 3,
    taken: 2,
    missed: 1,
    skipped: 0,
    pending: 0,
    adherence_percent: 66.7,
  },
};

function buildCaregiverDOM() {
  document.body.innerHTML = `
    <div id="sidebarAvatar">C</div>
    <div id="sidebarName">Loading…</div>
    <div id="sidebarEmail"></div>
    <div id="topGreeting">Good morning, Caregiver</div>
    <section id="alertsSection"></section>
    <div id="patientGrid"></div>
  `;
}

function makeFetch(responses) {
  return vi.fn(async (url) => {
    const match = responses.find((r) => url.includes(r.url));
    if (!match) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: match.ok !== false, status: match.status || 200, json: async () => match.body };
  });
}

describe('caregiver-dashboard.js — API integration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.setItem('access_token', 'test-jwt-token');
    buildCaregiverDOM();
    delete window.location;
    window.location = { href: '', pathname: '/caregiver-dashboard.html' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('fetches today doses per patient from /doses/today/?patient={id}', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: ASSIGNMENTS_RESPONSE },
      { url: '/api/v1/profiles/patients/', body: PROFILES_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: 'doses/today/?patient=patient-001', body: TODAY_PATIENT_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const calls = fetchMock.mock.calls.map(([url]) => url);
    expect(calls.some((u) => u.includes('doses/today/?patient=patient-001'))).toBe(true);
  });

  it('displays real adherence_percent (66.7%) instead of N/A', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: ASSIGNMENTS_RESPONSE },
      { url: '/api/v1/profiles/patients/', body: PROFILES_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: 'doses/today/?patient=patient-001', body: TODAY_PATIENT_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const grid = document.getElementById('patientGrid');
    expect(grid.textContent).toContain('66.7');
    expect(grid.textContent).not.toContain('N/A');
  });

  it('shows missed dose alert when summary.missed > 0', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: ASSIGNMENTS_RESPONSE },
      { url: '/api/v1/profiles/patients/', body: PROFILES_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: 'doses/today/?patient=patient-001', body: TODAY_PATIENT_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const alerts = document.getElementById('alertsSection');
    expect(alerts.textContent).toContain('Asha Patel');
    expect(alerts.textContent.toLowerCase()).toContain('missed');
  });

  it('shows low stock alert for medicines with quantity_remaining ≤ 5', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: ASSIGNMENTS_RESPONSE },
      { url: '/api/v1/profiles/patients/', body: PROFILES_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: 'doses/today/?patient=patient-001', body: TODAY_PATIENT_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const alerts = document.getElementById('alertsSection');
    expect(alerts.textContent).toContain('Metformin');
    expect(alerts.textContent.toLowerCase()).toContain('low');
  });

  it('shows empty state when no active caregiver assignments exist', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: { results: [] } },
      { url: '/api/v1/profiles/patients/', body: { results: [] } },
      { url: '/api/v1/medicines/', body: { results: [] } },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const grid = document.getElementById('patientGrid');
    expect(grid.textContent.toLowerCase()).toMatch(/no linked patients|invite/);
  });

  it('renders the patient name in the patient grid', async () => {
    const fetchMock = makeFetch([
      { url: '/api/v1/users/me/', body: USER_RESPONSE },
      { url: '/api/v1/caregiver-assignments/', body: ASSIGNMENTS_RESPONSE },
      { url: '/api/v1/profiles/patients/', body: PROFILES_RESPONSE },
      { url: '/api/v1/medicines/', body: MEDICINES_RESPONSE },
      { url: 'doses/today/?patient=patient-001', body: TODAY_PATIENT_RESPONSE },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await import('../../public/caregiver-dashboard.js');
    await new Promise((r) => setTimeout(r, 120));

    const grid = document.getElementById('patientGrid');
    expect(grid.textContent).toContain('Asha Patel');
    expect(grid.textContent).toContain('Diabetes');
  });
});
