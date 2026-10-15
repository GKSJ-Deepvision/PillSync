# Milestone 4 — Analytics, Testing & Deployment (Week 7–8)

- **Intern:** Vemula Purna Vijaya Sai Phani Kumar
- **Branch:** intern/22-vemula-purna-vijaya-sai-phani-kumar
- **Submitted on:** 2026-10-15

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Fully deployed frontend and backend | ☐ In progress | Render Blueprint is ready in [`render.yaml`](../../render.yaml); no Render services have been provisioned yet. |
| Analytics dashboards operational | ☑ Done | Frontend adherence analytics in `frontend/src/features/adherence/AdherenceDashboard.jsx`; patient dashboard in `frontend/src/pages/PatientDashboard.jsx`. |
| Refill and adherence visualisations | ☑ Done | `frontend/src/components/dashboard/RefillOutlookCard.jsx`, `frontend/src/features/refills/RefillsPage.jsx`, and adherence dashboard. |
| Testing and validation completed | ☑ Done | 21 backend/ML tests and 25 frontend tests passed; production frontend build succeeded. No coverage or live end-to-end deployment test was run. |
| End-to-end medication workflow demonstrated | ☐ In progress | No deployed end-to-end demonstration has been recorded. Use synthetic demo data only. |
| Documentation complete | ☐ In progress | [Render deployment runbook](../demo/render-deployment.md); live URLs and runtime evidence remain to be added after deployment. |

## Deployment

- **Live URL:** Not deployed
- **Platform:** Render (configured, not yet deployed)
- **Deployment steps:** [Render deployment runbook](../demo/render-deployment.md)
- **Container images built:** ☐ backend ☐ frontend (CI build not yet run)

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

- Backend and ML tests: 21 passed (pytest); coverage not measured.
- Frontend tests: 25 passed (Vitest); production Vite build succeeded.
- End-to-end scenarios covered: None recorded.
- Known failing or skipped tests: The release-readiness script reports no blocking gaps. Docker/Render deployment and live smoke tests remain unrun. Pytest emitted NumPy/joblib deprecation and scikit-learn model-version warnings; the frontend build emitted a large-chunk warning.

## Demo

- Recording / screenshots: Not recorded.
- Walkthrough script: Not recorded.

## Retrospective

The frontend already includes adherence and refill dashboards, and the project
has unit tests for core calculations and backend APIs. The Render Blueprint and
deployment runbook make the frontend/backend setup reproducible. The milestone
is still in progress: Render provisioning, live smoke tests, end-to-end
demonstration, notification verification, and performance measurements remain
to be completed. The current backend APIs are not authenticated, so only
synthetic demo data should be used until access controls are added.
