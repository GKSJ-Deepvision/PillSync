# Milestone 4 — Analytics, Testing & Deployment (Week 7–8)

- **Intern:** Reference implementation (mentor-maintained, on `main`)
- **Branch:** `main`
- **Submitted on:** 2026-09-30

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Fully deployed frontend and backend | **Partly — packaged and verified, not hosted** | Both images build; the full production stack (Postgres, Redis, gunicorn, nginx, Celery worker and beat) runs from [`docker-compose.prod.yml`](../../docker-compose.prod.yml) and passes a 20-check smoke test, which CI now runs on every push. **There is no live URL**: no cloud account was used. [`render.yaml`](../../render.yaml) and AWS/Azure guides are written and unexercised. See [`deployment.md`](../deployment.md) |
| Analytics dashboards operational | Done | Patient dashboard, caregiver monitoring, administrator analytics with API latency — [`apps/analytics/`](../../backend/apps/analytics), [`features/analytics/`](../../frontend/src/features/analytics) |
| Refill and adherence visualisations | Done | Hand-written SVG charts: stock projection, daily doses, adherence rings, breakdown bars — [`components/charts/`](../../frontend/src/components/charts) |
| Testing and validation completed | Done | 628 backend, 142 frontend, 31 ML tests, an end-to-end walk through the API, 20 production-stack checks — [`testing-report.md`](../reports/testing-report.md) |
| End-to-end medication workflow demonstrated | Done | [`tests/integration/test_end_to_end.py`](../../backend/tests/integration/test_end_to_end.py) and the [demo script](../demo/demo-script.md) with `seed_demo` data |
| Documentation complete | Done | [`docs/`](..): architecture, database, API, deployment, reports, demo, presentation |

## Deployment

- **Live URL:** none. Deploying needs a hosting account and payment method that
  belong to a person, so it was not done on anyone's behalf. Everything up to that
  step was built and checked; the remaining step is applying the blueprint.
- **Platform:** targets Render (`render.yaml`), with AWS and Azure reference
  architectures; runs today on any Docker host.
- **Deployment steps:** [`docs/deployment.md`](../deployment.md).
- **Container images built:** ☑ backend (production stage: gunicorn, Tesseract,
  collected static files, non-root) ☑ frontend (nginx). Both build in CI.

What was verified about the deployment, from outside, with `scripts/smoke_test.py`:
the app is served and client-side routes work; liveness and readiness probes;
anonymous requests are refused; the admin is reachable through the proxy; a new
account registers and signs in; a typed prescription is parsed, matched and
confirmed into reminders; **an image upload passes the proxy and is read by the
real OCR engine**; forecast, adherence and dashboard answer.

That smoke test found two bugs a green unit-test run could not: the production
password hasher (Argon2) was configured but not installed, so every registration in
production would have returned a 500; and nginx's default 1 MB limit would have
rejected every prescription photo. Both fixed and pinned.

## Performance metrics

Measured on the production topology on one laptop, database of 305 users and about
54,000 dose events. Full method, tables and caveats:
[`performance.md`](../reports/performance.md).

| Metric | Measured value | How it was measured |
|---|---|---|
| Medication adherence accuracy | 300/300 random histories match an independent calculation | Cross-check against a naive re-implementation; checks the arithmetic, not clinical suitability |
| Reminder delivery success rate | 120/120 dispatched and logged (100%) | Real dispatch task on the stack; **console provider** — real device/inbox delivery untested |
| Missed-dose detection accuracy | precision 100%, recall 100% | 300 doses around the four-hour boundary, incl. snoozed and the exact minute |
| Refill prediction accuracy | Run-out date: 5.3 days mean error, 57% within ±2 days, 78% within ±5; weekly consumption within 20% in 6 of 9 checks on demo data | 1,000 *simulated* patients; not real-world accuracy |
| Low-stock alert accuracy | 100% warned before running out, median 6 days' notice, 0% too early | Same simulation |
| Dashboard response time | median 43 ms, p95 77 ms | Load test, one client |
| Report generation time | weekly 16 ms, monthly 21 ms, CSV 28 ms | Medians of 15 requests |
| API response time | median 33 ms, p95 61 ms, p99 79 ms | Load test, one client, mixed endpoints |
| Concurrent users handled | 100 continuously-active clients, 0 errors (p95 2.0 s on 2 workers; 0.89 s on 6). Comfortable: 10 clients at p95 189 ms (2 workers) | Load test; clients have no think time, so each is far busier than a person |

The load test also found and fixed real problems: the dashboard was six times
slower than needed (269 → 43 ms), administrator analytics issued about 1,400
queries (5.7 s → 0.3 s), and the first load run was **invalid** — a per-user rate
limit answered most requests with instant `429`s, which the script had counted as
successes. It now fails such a run. Details in the performance report.

## Testing summary

- **Backend tests:** 628 (624 locally, 4 more with Tesseract, which pass in the
  backend image). Line coverage **89.7%**; the new apps 96–98%.
- **Frontend tests:** 142; ESLint and Prettier clean; production build 131 kB gzipped.
- **ML tests:** 31, including regression gates that fail CI if OCR parsing or the
  refill predictor gets worse.
- **End-to-end scenarios covered:** registration → caregiver invitation and consent
  → prescription upload → OCR → review → confirm → reminders → take one dose, miss
  another → caregiver alerted → stock counted down → forecast and refill alert to
  patient and caregiver (once) → refill clears it → adherence report and CSV →
  dashboards → administrator analytics → boundaries (another patient's 404s,
  role 403s).
- **Known failing or skipped tests:** none failing. Four Tesseract tests skip on a
  machine without the binary and pass in the image and in CI.
- **Clock independence.** The suite was run with the wall clock fixed at each hour of
  the day and at the minutes either side of midnight. That exposed ten tests (eight
  from Milestone 2) that failed for most of the day on a UTC server because they
  assumed a fixed 08:00 or "a few minutes from now" stays today; they now pin "now".
  The suite passes at every hour and at 23:50–00:03.
- **Gaps** (stated in full in the testing report): no automated browser tests, no
  real notification delivery, OCR measured on synthetic text only, writes not
  load-tested, no accessibility audit.

## Demo

- **Recording / screenshots:** [`docs/demo/screenshots/`](../demo/screenshots). No
  video was recorded; the script below can be recorded in about ten minutes.
- **Walkthrough script:** [`docs/demo/demo-script.md`](../demo/demo-script.md), and
  [`docs/demo/presentation.md`](../demo/presentation.md) for the slides.
- `python backend/scripts/run_demo.py` starts a self-contained demo with a month of
  seeded history in one command.

## Retrospective

**What worked.** Making every uncertain step visible — a confidence, a reason, a
suggestion instead of a guess — turned out to be both the safest design and the one
that was easiest to test. Building the evaluation harnesses before trusting the
parser paid for itself: they found a bug that silently dropped reminders for one
prescribing style in six. Smoke-testing the deployed stack found a bug that would
have broken every real deployment, and a green suite had hidden it since Milestone 1.

**What I would do differently.** Run the production stack in CI from Milestone 2, not
Milestone 4 — three of this milestone's worst defects were deployment-shaped. Pin the
clock in tests from the start. Read a load test's status codes before its latencies.

**What is still incomplete.**

- **No live deployment** — the one criterion not fully met. It needs a hosting account.
- **Handwriting** is unsupported; a hosted OCR engine behind the existing seam is the fix.
- **Real notification delivery** (FCM, Twilio, SendGrid) is wired but untried.
- **The refill forecast has no trend term**: patients whose adherence is falling are
  still predicted about 13 days late.
- **Prescription photos** are on local disk; object storage is documented, not built.
- **Reports bucket doses by the server's day**, so a patient in another timezone can
  see a dose on a neighbouring date.
- **Latency figures shown to administrators** are per process, in memory; a real
  deployment needs an APM.
