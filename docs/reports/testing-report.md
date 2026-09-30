# Testing and validation report

**Milestone 4 deliverable — testing and validation.**

## Summary

| Layer | Tests | Result | Notes |
|---|---:|---|---|
| Backend (pytest) | **628** | 624 pass, 4 skipped locally, **all 628 pass in the Docker image** | The 4 need the Tesseract binary; they run against the real engine in the backend image and in CI |
| Frontend (Vitest + Testing Library) | **142** | all pass | 14 files; ESLint and Prettier clean; production build succeeds (131 kB gzipped) |
| ML / evaluation (pytest) | **31** | all pass | Includes regression gates on OCR parsing and refill prediction |
| Production stack smoke test | **20 checks** | 20/20 pass | Postgres, Redis, gunicorn, nginx, Celery, real Tesseract; runs in CI |
| **Total automated** | **801 tests + 20 smoke checks** | | |

**Backend line coverage: 89.7%** (4,915 statements). By app: adherence 98.5%,
analytics 96.6%, refills 96.4%, reminders 95.9%, prescriptions 93.8%, common
93.2%, medications 92.6%, accounts 92.0%, profiles 91.3%, ocr 89.2%,
notifications 85.7%. Coverage measures which lines ran, not whether the
assertions were good; the section on defects below is the better evidence.

Everything runs on every push in [CI](../../.github/workflows/ci.yml): Ruff, Black
and isort; Django system checks; pytest with coverage against PostgreSQL;
ESLint, Prettier, Vitest and a production build; the ML tests; both Docker builds;
the production-stack smoke test; and a secret scan.

## What is tested, by area

| Area | Tests | What they establish |
|---|---:|---|
| **OCR** (`apps/ocr`) | 222 | 134 parser tests over the layouts real prescriptions use (1-0-1, BD/TDS/OD, "twice daily", weekly and alternate-day, numbered lists, run-together lines, OCR digit confusions). Matcher tested against the real 3,111-row catalogue: confident matches apply, doubtful ones are only suggested, and known look-alikes (rosiglitazone / pioglitazone) are **never** auto-matched. API: upload validation (size, format, pixel count, corrupt file), access control, review, confirm, reject, purge. Real Tesseract on rendered prescriptions |
| **Refills** (`apps/refills`) | 66 | Engine against the specification's own example (60 tablets at 2 a day = 30 days), fractional rates, course-end coverage. Stock ledger, alert de-duplication (once per level, reset by a refill), caregiver notification, nightly recompute, backtest, and a query-count guard |
| **Adherence** (`apps/adherence`) | 46 | Definitions pinned (skipped is neither success nor failure; streaks ignore days with no doses; a trend needs at least 6 doses in each half); **300 random histories checked against an independent calculation**; reports, CSV, access control |
| **Analytics** (`apps/analytics`) | 20 | Patient, caregiver and administrator dashboards; delivery-rate maths; latency percentiles; middleware records route templates, not raw URLs |
| **Reminders** (`apps/reminders`) | 51 | Taken / missed / snooze / skip, the overdue sweep, **missed-dose precision and recall at the exact time boundary** |
| Medications, prescriptions, profiles, notifications, accounts, common | 210 | Carried from Milestones 1 and 2, updated where Milestone 3 changed behaviour (stock can no longer be silently overwritten by a PATCH; low-stock warnings now come from the forecast) |
| **Production settings** (`tests/unit`) | 12 | Startup refuses a missing secret, empty hosts or SQLite; HTTPS, mail and SendGrid switches; **the production password hasher actually works** |
| **End to end** (`tests/integration`) | 1 | The whole product through the public API only (see below) |

**The end-to-end scenario.** No shortcuts: real registration and JWT login, no
`force_authenticate`, no model writes. A patient registers and invites a
caregiver, who is accepted. The patient uploads a prescription image; it is read,
parsed and matched; she confirms it and gets medicines, schedules and reminders.
She takes one dose and misses another: stock falls, the caregiver is alerted,
adherence reads 50%. She counts her stock down to 3: a forecast and a refill
alert reach both her and the caregiver, once. The caregiver's overview ranks her
first. A refill clears the alert, and the ledger shows `INITIAL → ADJUSTMENT →
REFILL`. An administrator sees the platform figures and latency. Throughout,
another patient gets a 404 on her scan and its image, and a patient or caregiver
gets a 403 on administrator endpoints.

**Access control** is tested endpoint by endpoint rather than once: for each new
API, another patient sees nothing and gets 404 (never 403, which would confirm the
record exists); an assigned caregiver can read, an unassigned one cannot; the
administrator endpoints refuse everyone else; prescription photos are served only
through an authenticated endpoint and never from a public path.

## Defects that testing found

Each is fixed, with a test that fails without the fix.

| # | Defect | Found by | Consequence if shipped | Pinned by |
|---|---|---|---|---|
| 1 | **The production password hasher (Argon2) was configured but its library was not installed** | Smoke test on the deployed stack — unit tests use a different hasher and cannot see it | Every registration and login returns 500 in production. Present since Milestone 1 | `tests/unit/test_password_hashing.py` |
| 2 | nginx's default 1 MB body limit | Designing the smoke test's image upload | Every prescription photo rejected before reaching the API | Smoke test uploads an image through the proxy |
| 3 | The parser split "Metformin 500mg **tablet** twice daily" at the word *tablet*, dropping the frequency | The OCR evaluation (12 of 120 medicines, one whole style) | Medicines added with no dose times, so **no reminders** — silently | `TestFormAfterTheStrength` (12 cases) |
| 4 | On badly read pages one misread name was **auto-matched to the wrong catalogue drug** | The OCR evaluation, degraded condition | The wrong drug's strength and category attached without asking | `TestPoorReadsAreNeverAutoMatched` — on a poor read, matches are suggested, never applied |
| 5 | Misspelt drug names ("Metformn") were saved verbatim | Trying a real scan in the browser | A misspelt medicine on every reminder | `TestNameCorrection` — fixes near-misses, never rewrites a synonym ("Paracetamol" stays) |
| 6 | Adding a medicine by scan skipped the stock ledger and the forecast | The OCR API tests | Scanned medicines would have no refill tracking | `test_confirming_records_starting_stock_and_a_forecast` |
| 7 | A malformed `?patient=` id on the dashboard raised a 500 | Analytics tests | An avoidable server error from a bad URL | `test_a_malformed_id_is_a_404_not_a_500` |
| 8 | Email could not be configured for production: SMTP settings were not read from the environment | Preparing the deployment guide | Real deployments could not send email | `test_prod_settings.py` (three cases) |
| 9 | The dashboard and administrator analytics were slow (269 ms and 5.7 s) | Load test | See [performance.md](performance.md) | `test_the_number_of_queries_does_not_grow_with_the_number_of_medicines` |
| 10 | The load test itself was wrong: throttled responses counted as success | Reviewing the first results | Every performance figure inflated | The script now fails a run with any 429 |
| 11 | **Ten tests depended on the time of day** (eight from Milestone 2): they assumed a fixed 08:00, or that "five minutes from now" is still today | Running the suite with the clock frozen at each hour and at the minutes around midnight | Would fail CI for any push between 09:00 and midnight UTC. Unnoticed because every Milestone 2 run on `main` happened before 08:00 UTC | The `pinned_now` fixture; suite passes at every hour tested |
| 12 | A trend was claimed from a handful of doses: a caregiver saw a patient labelled "Slipping" over 7 days (3–4 days per half) while her 30-day trend was "Improving" | Looking at the caregiver screen with seeded data in a browser | A caregiver alarmed, or reassured, by noise | `TestTrendNeedsEnoughDoses`: a trend needs at least 6 resolved doses in each half; the caregiver view trends over 14 days |

Defects 1, 3, 4, 9, 11 and 12 were invisible to a green test suite; they were found by
running the real thing in the real topology and by measuring accuracy on data the
code had not been tuned on. That is the case for the smoke test in CI and the
evaluation harnesses.

## Validation against the specification

| Requirement | Evidence |
|---|---|
| OCR extracts name, dosage, quantity, frequency, prescription details | Parser and evaluation; header (doctor, clinic, dates, reference) parsed; [`ocr-evaluation.md`](ocr-evaluation.md) |
| Human review before anything is saved | Nothing is added until the patient confirms; unsaved edits and missing stock block the confirm button (frontend tests) |
| Refill prediction from quantity, frequency, dose, missed doses, manual updates | Engine tests; missed doses via observed consumption; manual updates via the stock ledger |
| Spec example: 60 tablets at 2 a day = 30 days | `test_engine.py` and the API test for depletion date |
| Refill and low-stock notifications, including caregiver alerts | `TestStatusesAndAlerts` |
| Adherence: daily history, percentage, trends | Engine and API tests; Adherence page |
| Analytics dashboards; refill and adherence visualisations | Analytics tests; charts tests; viewed in a browser against seeded data |
| Deployment | Production images and stack build and pass the smoke test; **no live cloud deployment was made** ([deployment.md](../deployment.md)) |

## Known gaps

Stated plainly, because they bound what "tested" means here:

- **No automated browser tests.** Component tests cover the frontend logic (142),
  and the pages were exercised by hand in a browser against seeded data, but there
  is no Playwright/Cypress suite driving the real UI. Camera capture on a real
  phone was not tested (the `capture` attribute is set; jsdom cannot open a camera).
- **No real notification delivery.** Push, SMS and email providers fall back to the
  console without credentials. The pipeline and its logging are tested; delivery to
  a device or inbox is not.
- **OCR is measured on synthetic text**, in one typeface. Real phone photographs
  (glare, shadow, curvature) and handwriting are untested; handwriting is outside
  what Tesseract reads reliably.
- **Refill accuracy is measured on simulated patients.** It shows the method and
  ranks the estimators; it is not real-world accuracy, which needs months of data.
- **Writes are not load-tested**; only read-heavy traffic was.
- **No accessibility audit** with a tool or a screen reader. Charts carry text
  alternatives and controls are labelled, but this is unverified by an expert.
- **No cross-browser or mobile-device testing** of the new pages.
- Reports bucket doses by the server's day; a patient in another timezone can see
  a dose fall on a neighbouring day. Reminders themselves are scheduled in the
  patient's own timezone.

## Reproducing

```bash
cd backend  && pytest --cov=apps            # 624 pass; +4 with Tesseract installed
cd frontend && npm test                     # 142
cd ml       && pytest                       # 31
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --wait
python scripts/smoke_test.py http://localhost:8088
```

Tesseract tests, inside the backend image:

```bash
docker build --target dev -t pillsync-backend-dev backend
docker run --rm pillsync-backend-dev sh -c "pip install -q pytest pytest-django && pytest apps/ocr"
```
