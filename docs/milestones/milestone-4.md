# Milestone 4 — Analytics, Testing & Deployment (Week 7–8)

- **Intern:** Vemula Purna Vijaya Sai Phani Kumar
- **Branch:** intern/22-vemula-purna-vijaya-sai-phani-kumar
- **Submitted on:** 2026-10-15

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Fully deployed frontend and backend | ☑ Done | Frontend: https://pillsync-web-optm.onrender.com; API: https://pillsync-api-free.onrender.com. Both are on Render's $0 Free plan. |
| Analytics dashboards operational | ☑ Done | Frontend adherence analytics in `frontend/src/features/adherence/AdherenceDashboard.jsx`; patient dashboard in `frontend/src/pages/PatientDashboard.jsx`. |
| Refill and adherence visualisations | ☑ Done | `frontend/src/components/dashboard/RefillOutlookCard.jsx`, `frontend/src/features/refills/RefillsPage.jsx`, and adherence dashboard. |
| Testing and validation completed | ☑ Done | 22 backend/ML tests and 25 frontend tests passed; production frontend build succeeded. Live health and browser-to-API CORS checks passed. No full medication end-to-end test was run. |
| End-to-end medication workflow demonstrated | ☐ In progress | No deployed end-to-end demonstration has been recorded. Use synthetic demo data only. |
| Documentation complete | ☑ Done | [Render deployment runbook](../demo/render-deployment.md) records the live services and remaining verification. |

## Deployment

- **Frontend URL:** https://pillsync-web-optm.onrender.com
- **Backend URL:** https://pillsync-api-free.onrender.com
- **Platform:** Render Free plan ($0/month)
- **Deployment steps:** [Render deployment runbook](../demo/render-deployment.md)
- **Builds:** ☑ Backend Docker image built and deployed ☐ Frontend container (static site; no container)

## Performance metrics

| Metric | Measured value | How it was measured |
|---|---|---|
| Medication adherence accuracy | Not measured | Requires a defined labeled evaluation dataset. |
| Reminder delivery success rate | Not measured | Requires deployed notification provider and delivery logs. |
| Missed-dose detection accuracy | Not measured | Requires comparison against a labeled dose-event dataset. |
| Refill prediction accuracy | Not measured | Unit tests verify specified arithmetic; no real-world accuracy evaluation was run. |
| Low-stock alert accuracy | Not measured | Requires an evaluation dataset of stock and schedules. |
| Dashboard response time | Not measured | Measure against a deployed service with representative data. |
| Report generation time | Not measured | No production report-generation benchmark recorded. |
| API response time | Not measured | Measure against the deployed service. |
| Concurrent users handled | Not measured | No load test recorded. |

## Testing summary

- Backend and ML tests: 22 passed (pytest); coverage not measured.
- Frontend tests: 25 passed (Vitest); production Vite build succeeded.
- End-to-end scenarios covered: None recorded.
- Live checks: Backend `/api/health` returned 200; a browser-origin batch refill request returned 200 with CORS enabled. Full sign-in/medication workflow was not exercised.
- Known failing or skipped tests: The release-readiness script reports no blocking gaps. Pytest emitted NumPy/joblib deprecation and scikit-learn model-version warnings; the frontend build emitted a large-chunk warning.

## Demo

- Recording / screenshots: Not recorded.
- Walkthrough script: Not recorded.

## Retrospective

The frontend and FastAPI backend are deployed on Render's free plan. The
frontend includes adherence and refill dashboards, and automated tests cover
core calculations and backend APIs. Live health and cross-origin API checks
passed. A full medication workflow demonstration, notification verification,
and performance measurements remain to be completed. The current backend APIs
are not authenticated, so only synthetic demo data should be used until access
controls are added.
