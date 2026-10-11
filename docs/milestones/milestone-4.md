# Milestone 4 — Analytics, Testing & Deployment (Week 7–8)

- **Intern:** Advala Indhu
- **Branch:** intern/01-advala-indhu
- **Submitted on:** 11 October 2026

## Evaluation criteria

| Criterion | Status | Evidence |
|---|---|---|
| Fully deployed frontend and backend | ☑ Done | Both run on Render; the backend uses Supabase PostgreSQL and runs migrations on every start. See `deployment/README.md`. |
| Analytics dashboards operational | ☑ Done | Patient: `frontend/src/features/adherence/AdherenceReportPage.jsx`. Admin: `frontend/src/features/admin/AdminOCRMonitoringPage.jsx`, backed by `GET /api/ocr/admin-monitoring/` (`backend/apps/ocr/views.py`). |
| Refill and adherence visualisations | ☑ Done | `frontend/src/features/refills/RefillsPage.jsx`, `AdherenceReportPage.jsx`, `HistoryPage.jsx`, `frontend/src/pages/PatientDashboard.jsx` |
| Testing and validation completed | ☑ Done | 57 backend tests (90% coverage) and 57 frontend tests, all passing. See Testing summary. |
| End-to-end medication workflow demonstrated | ☑ Done | Screenshots in `docs/demo/screenshots/`, demo flow for patient, caregiver and admin in `docs/demo/README.md`, and a live demonstration of the deployed app: https://pillsync-frontend-cltn.onrender.com |
| Documentation complete | ☑ Done | This report, `deployment/README.md`, `docs/demo/README.md` |

## Deployment

- **Live URL:** https://pillsync-frontend-cltn.onrender.com
- **Platform:** Render (backend: Docker web service on the free plan; frontend: Render service). Database and authentication: Supabase. Vision OCR: Gemini API.
- **Steps and environment variables:** `deployment/README.md`
- **Release readiness:** run the **CD (release readiness)** workflow from the Actions tab to build both container images and record the result here.

### Problems found and fixed during deployment

| Problem | Cause | Fix |
|---|---|---|
| HTTP 500 on OCR monitoring | `SUPABASE_DB_HOST` held `host:port/dbname` instead of only the hostname; the OCR tables had never been created on the Supabase database | Set host, port, name, user and password as separate variables; run `python manage.py migrate --noinput` on container start (commit `41ddb26`) |
| Monitoring page ignored the local backend | API URL was hardcoded to the Render backend | Use `VITE_API_BASE_URL` (commit `db5016c`) |
| HTTP 502 on scan | Gunicorn's 30-second default timeout killed slow OCR requests (`WORKER TIMEOUT`) | `--timeout 180 --workers 1 --threads 2` (commit `461f7b2`) |

## Performance metrics

| Metric | Result | How it was measured |
|---|---|---|
| Medication adherence accuracy | Covered by unit tests (16 tests on week ranges, totals, streaks, insights) | `frontend/tests/unit/adherence.test.js` |
| Refill prediction accuracy | Covered by unit tests (11 frontend, backend refill service and view tests) | `frontend/tests/unit/refill.test.js`, `backend/apps/refills/tests/` |
| Low-stock alert accuracy | Urgency levels (empty, low, soon, ok) covered by tests | `frontend/tests/unit/refill.test.js` |
| OCR result handling | 17 tests on category guess, reminder times, validation and database row building | `frontend/tests/unit/ocrMapping.test.js` |
| Reminder delivery success rate | Not measured | |
| Missed-dose detection accuracy | Not measured | |
| Dashboard / API response time | Not measured. On the free plan the first request after inactivity can take 50 seconds or more. | |
| Concurrent users handled | Not measured. The backend runs 1 worker with 2 threads on the free plan. | |

## Testing summary

- **Backend:** 57 tests passed. Coverage 90% overall (1006 statements, 101 missed); about 86% when the test files themselves are left out. Weakest areas: `ocr/engine/vision.py` 56% (the Gemini calls), `ocr/views.py` 76%, `ocr/services.py` 82%.
- **Frontend:** 57 tests passed in 6 files: `DoseRing`, `greeting`, `scheduling` (13 from earlier milestones) plus `refill`, `adherence` and `ocrMapping` (44 added in this milestone).
- **CI:** `.github/workflows/ci.yml` runs linting and both test suites on every push.
- **Failing or skipped tests:** none.

## Demo

- Demo flow: `docs/demo/README.md`
- Evidence: screenshots in `docs/demo/screenshots/` (dashboard, medicines, scan a label, notifications, weekly adherence report) and a live demonstration to the mentor on the deployed app

## Known limitations

- **The admin monitoring endpoint only checks that the user is logged in.** The frontend shows the page to admins only, but the backend does not check the admin role, so any signed-in user could call the endpoint directly. Planned fix: check the role on the server and add a test.
- The OCR monitoring endpoint has no automated tests yet.
- Performance and load metrics were not measured.
- On free hosting the backend sleeps when idle and has limited memory, so OCR can be slow.

## Retrospective

**What worked:** reading the deploy logs for each failure gave the real cause every time: a bad database host, missing migrations, and a worker timeout.

**What I would do differently:** keep the API base URL in one place from the start, run migrations as part of container start from day one, and test against the hosted database before deploying.

**Still incomplete:** performance and load measurements, the admin role check on the monitoring endpoint, and deployed-site screenshots of the OCR scan result, refill page, caregiver view and admin OCR monitoring page.
