# Performance report

**Milestone 4 deliverable — system performance metrics.**

Every figure here was measured, and the method is given next to it. Where a
metric could only be measured on simulated or synthetic data, or through a stand-in
provider, that is said in the same row. Raw output: [`performance-results.txt`](performance-results.txt),
[`refill-evaluation.md`](refill-evaluation.md), [`ocr-evaluation.md`](ocr-evaluation.md).

## The metrics the specification asks for

| Metric | Measured | How it was measured, and what it does not show |
|---|---|---|
| **Medication adherence accuracy** | **300 of 300** random dose histories agree exactly with an independent calculation (adherence rate, current and longest streak, consistency) | `TestAgainstAnIndependentCalculation`: a deliberately naive re-implementation that shares no code with the engine. This proves the arithmetic matches its written definitions ([engine.py](../../backend/apps/adherence/engine.py)); it cannot prove the definitions suit every clinical purpose |
| **Reminder delivery success rate** | **120 of 120 (100%)** reminders dispatched and logged | Made 120 doses due in the production stack and ran the real `dispatch_due_reminders` task. **The push provider was the console fallback** (no Firebase credentials), so this shows the pipeline is complete and logs every attempt. Delivery to a real phone or inbox was **not** tested |
| **Missed-dose detection accuracy** | **precision 100%, recall 100%** on 300 doses | `TestMissedDoseDetectionAccuracy`: doses scattered from an hour inside to eight hours past the four-hour window, a fifth of them snoozed, plus the exact boundary. A rule-based check, so exactness is expected; the test guards against a regression |
| **Refill prediction accuracy** | Run-out date: **mean error 5.3 days; 57% within ±2 days; 78% within ±5 days** (schedule-only: 8.9 days, 31%, 55%). Weekly consumption forecast on the demo data: **within 20% in 6 of 9 checks**, mean error 16.1% | 1,000 *simulated* patients over five behaviours ([`refill-evaluation.md`](refill-evaluation.md)). The behaviours are invented, so this shows the method and how estimators rank, **not** the accuracy real patients would see. The demo-data check has only 9 samples across 3 medicines |
| **Low-stock alert accuracy** | **100%** of simulated patients warned before running out; **median 6 days'** notice; **0%** warned more than 12 days early | Same simulation. Alerts are also tested to fire once per level and to reset after a refill (`TestStatusesAndAlerts`) |
| **Dashboard response time** | **median 43 ms, p95 77 ms** (one client); p95 189 ms with 10 clients | Load test below, 305 users / ~54,000 dose events in the database |
| **Report generation time** | weekly **16 ms**, monthly **21 ms**, monthly CSV **28 ms** (medians; p95 29–42 ms) | 15 requests each against the demo patient's data |
| **API response time** | **median 33 ms, p95 61 ms, p99 79 ms** (one client, mixed read endpoints). Administrator analytics: median 300 ms, p95 366 ms | Load test below |
| **Concurrent users handled** | **100 continuously-active clients, 0 errors** (2 workers: p95 2.0 s; 6 workers: p95 0.89 s). Comfortable range: ≤ 10 clients at p95 189 ms (2 workers), ≤ 50 at p95 376 ms (6 workers) | Load test below. Clients send requests back-to-back with no think time, so each one is far busier than a person; 100 such clients stand in for many hundreds of real users |
| **OCR field accuracy** | Clean rendered text **100%** on every field; a page skewed by up to ±2.5° 88–100% depending on the field; a badly degraded image finds only 22.5% of medicines | [`ocr-evaluation.md`](ocr-evaluation.md). Synthetic prescriptions, one typeface, no handwriting, no real photographs — an upper bound, not a promise |

## Load test

`scripts/perf_test.py` signs in as the demo patient and has *N* threads request a
weighted mix of the dashboard, today's doses, the refill forecast, 30-day
adherence, the medicine list and the weekly report for 20 seconds. Latency is
end to end, through nginx.

**Setup.** The production topology from `docker-compose.prod.yml` — nginx,
gunicorn, PostgreSQL 16, Redis, a Celery worker and beat — on one Windows laptop
under Docker Desktop, with the load generator on the same machine (so the two
compete for CPU and network time is understated). Database: 305 users, about
54,000 dose events, 840 medicines.

**Two gunicorn workers**

| Clients | Requests/s | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|
| 1 | 28 | 33 ms | 61 ms | 79 ms | 0% |
| 5 | 86 | 54 ms | 98 ms | 129 ms | 0% |
| 10 | 78 | 123 ms | 189 ms | 236 ms | 0% |
| 25 | 77 | 318 ms | 456 ms | 547 ms | 0% |
| 50 | 88 | 528 ms | 846 ms | 1.28 s | 0% |
| 100 | 73 | 1.33 s | 2.01 s | 2.23 s | 0% |

**Six gunicorn workers** (`WEB_CONCURRENCY=6`)

| Clients | Requests/s | p50 | p95 | p99 | Errors |
|---:|---:|---:|---:|---:|---:|
| 10 | 180 | 53 ms | 84 ms | 103 ms | 0% |
| 25 | 176 | 138 ms | 190 ms | 216 ms | 0% |
| 50 | 185 | 261 ms | 376 ms | 409 ms | 0% |
| 100 | 168 | 588 ms | 889 ms | 975 ms | 0% |

**Reading it.** Throughput saturates at about 80 requests/s on two workers and
about 180 on six; past that, extra clients only queue, so latency grows in
proportion — the signature of a CPU-bound service, not one that is failing (there
are no errors even at 100 clients). More workers help, but 6 workers gave 2.3×,
not 3×: the load generator and PostgreSQL share the same laptop. Real capacity
planning needs a separate load generator and the target hardware.

**Per endpoint, one client**

| Endpoint | p50 | p95 |
|---|---:|---:|
| Dashboard | 43 ms | 77 ms |
| Today's doses | 36 ms | 61 ms |
| Medicine list | 32 ms | 56 ms |
| Refill forecast | 24 ms | 52 ms |
| Adherence, 30 days | 23 ms | 44 ms |
| Adherence report (weekly) | 22 ms | 42 ms |
| Platform analytics (admin) | 301 ms | 366 ms |

Sign-in takes 85–265 ms (median about 115 ms). That is the Argon2 password hash,
deliberately slow, and is rate-limited to 10 a minute.

## What the measurements found and fixed

Measuring changed the code. In the order they were found:

1. **A first load run was invalid, and was thrown away.** The API limits each
   signed-in user to a fixed number of requests a day; the load test used one user
   and sent tens of thousands, so almost every request was answered with an instant
   `429`. Those fast rejections made the server look several times faster than it
   is, and the script only counted 5xx as errors, so it reported "0% errors". Two
   fixes: the script now counts every non-2xx response and marks a run **INVALID**
   if any request was throttled; and the limit is now configurable
   (`THROTTLE_USER_RATE`, default raised from 1,000 to 5,000 a day, since 1,000 is
   tight for a caregiver following several patients). Every number in this report
   comes from runs with the limiter raised and zero throttled responses.
2. **The dashboard was 6× slower than it needed to be** (median 269 ms → 43 ms).
   It computed the 7-day and 30-day adherence separately, each reading 180 days
   of history through a heavy access-control subquery and building a model object
   per dose. It now reads the history once, as plain column values, and derives
   both windows.
3. **Administrator analytics took 5.7 seconds** (now 0.3 s). The forecast-accuracy
   check issued about 1,400 queries for 200 medicines (a few per medicine per
   week). It now reads everything in two queries and does the arithmetic in
   memory. A regression test pins the query count.
4. **Two bugs the unit tests could not see**, found by smoke-testing the deployed
   stack: the production password hasher (Argon2) was configured but not installed,
   so every registration and login returned 500; and nginx's default 1 MB body limit
   would have rejected every prescription photo. Both are fixed and covered
   (`test_password_hashing.py`; the smoke test uploads an image through the proxy).

## Limits of these measurements

- One machine, client and server together. Numbers show relative behaviour and
  find slow code; they do not size a production deployment.
- A database of 305 users and 54,000 dose events. A larger one would slow the
  platform-wide administrator queries first.
- Read-heavy traffic. Writes (taking a dose, confirming a scan) are exercised in
  the end-to-end test but not load-tested.
- Latency percentiles shown in the app are per server process, in memory.
- Accuracy of prediction and OCR is on synthetic data; real-world accuracy needs
  real, consented data over months.
