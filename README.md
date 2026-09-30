# PillSync

**Intelligent Medicine Reminder and Medication Tracking Platform**

An AI-powered platform for managing medicine schedules, tracking dosage adherence,
predicting refill requirements and keeping long-term medication history — built for
patients, caregivers and administrators, with chronic disease management in mind.

This repository is the shared workspace for a **26-person AI internship cohort**.
Each intern builds the full platform on their own branch.

> **Interns: read [INTERN_GUIDE.md](INTERN_GUIDE.md) before you write any code.**
> It covers branch naming, the workflow, what CI checks, and the milestone deadlines.

---

## How this repository works

| | |
|---|---|
| `main` | Skeleton, CI pipeline and instructions. Maintained by mentors — **read-only for interns**. |
| `intern/NN-firstname-lastname` | One branch per intern. All of your work lives here. |
| Pull requests | **Not used.** Nothing is merged into `main`. Your push is your submission. |
| Review | Automated on every push by the [CI pipeline](.github/workflows/ci.yml), plus mentor review at each milestone. |

The 26 branch names are listed in [`.github/interns.yml`](.github/interns.yml).

---

## Repository layout

```
PillSync/
├── backend/              Python API — Django REST Framework (or FastAPI)
│   ├── config/           Settings, root URLs, ASGI/WSGI, Celery
│   ├── apps/             One app per spec module (see each app's README)
│   ├── tests/            Cross-app unit and integration tests
│   └── requirements/     base / dev / prod dependency lists
├── frontend/             React.js SPA — Tailwind, Axios, Redux or Context
│   ├── src/features/     One folder per spec module
│   ├── src/components/   Reusable UI
│   └── tests/
├── ml/                   OCR and refill-prediction experiments
│   ├── src/ocr/          Tesseract pipeline
│   ├── src/nlp/          spaCy / OpenAI parsing
│   └── src/refill_prediction/
├── docs/                 Architecture, database, API, wireframes, milestones, demo
├── deployment/           Docker, nginx, AWS/Azure notes, release scripts
└── .github/              CI pipelines, check scripts, intern roster
```

Every folder has a README explaining what belongs in it. Read the one for the module
you are about to build.

---

## The platform, in modules

| # | Module | Where it lives | Milestone |
|---|---|---|---|
| 1 | Authentication & role-based access (JWT, OAuth2, Patient/Caregiver/Admin) | `backend/apps/accounts` | 1 |
| 2 | Profiles & medication management, dosage scheduling | `backend/apps/profiles`, `backend/apps/medications` | 1–2 |
| 3 | Medicine upload & OCR recognition | `backend/apps/ocr`, `ml/src/ocr` | 3 |
| 4 | Smart reminder system (morning / afternoon / night, snooze, push/email/SMS) | `backend/apps/reminders` | 2 |
| 5 | Medication adherence tracking & reports | `backend/apps/adherence` | 3 |
| 6 | AI refill prediction engine | `backend/apps/refills`, `ml/src/refill_prediction` | 3 |
| 7 | Disease-based medication organisation | `backend/apps/medications` | 2 |
| 8 | Smart notifications & alerts | `backend/apps/notifications` | 2 |
| 9 | Dashboard & analytics | `backend/apps/analytics` | 4 |
| 10 | Integration, testing & deployment | `deployment/`, `docs/` | 4 |

Full requirements: [`docs/pillsync-project-specification.pdf`](docs/pillsync-project-specification.pdf)

---

## Milestones

| Milestone | Weeks | Focus |
|---|---|---|
| 1 | 1–2 | Requirements, database design, auth and core setup |
| 2 | 3–4 | Medication management and the reminder system |
| 3 | 5–6 | OCR recognition and refill prediction |
| 4 | 7–8 | Analytics, testing and deployment |

Report templates are in [`docs/milestones/`](docs/milestones/).

---

## Tech stack

**Backend** Python · Django REST Framework / FastAPI · PostgreSQL (SQLite for dev) · Celery
**Frontend** React.js · Tailwind CSS · Axios · Redux Toolkit or Context API
**AI & OCR** Tesseract OCR · spaCy · OpenAI API
**Auth** JWT · OAuth2
**Notifications** Firebase Cloud Messaging · Twilio · SendGrid
**Testing** Pytest · Django Test Client · Jest / Vitest · React Testing Library
**DevOps** Docker · Docker Compose · GitHub Actions · AWS / Azure / Render / Vercel

---

## Current state

**All four milestones are implemented on `main`**, and serve as the reference
implementation.

**Milestone 1** — authentication with JWT and Google OAuth2, role-based access
for patient / caregiver / admin, patient and family profiles, the finalised
database schema, and a medicine catalogue seeded from the FDA National Drug Code
Directory (3,111 presentations across 833 generics, in the six condition groups
the specification names plus an *other* group for everyday medicines).
[Report](docs/milestones/milestone-1.md)

**Milestone 2** — medicines with stock and disease grouping, dosage scheduling
(daily, chosen weekdays, every N days), the reminder pipeline with
Taken / Missed / Snooze, medication history, and notification delivery across
push, email and SMS with per-user preferences.
[Report](docs/milestones/milestone-2.md) ·
[Pipeline design](docs/architecture/reminder-pipeline.md)

**Milestone 3** — prescription OCR (Tesseract, a rule-based parser, matching to the
catalogue, human review before anything is saved), refill prediction that learns
from what the patient actually takes, a stock ledger, refill and low-stock alerts
that reach caregivers too, and adherence analytics with weekly and monthly
reports.
[Report](docs/milestones/milestone-3.md) ·
[Design](docs/architecture/ocr-and-refills.md)

**Milestone 4** — patient, caregiver and administrator dashboards, refill and
adherence charts, API performance metrics, production packaging (gunicorn, nginx,
Celery, Docker Compose) with a smoke test that runs in CI, and the performance,
testing and final reports.
[Report](docs/milestones/milestone-4.md) ·
[Deployment](docs/deployment.md) ·
[Performance](docs/reports/performance.md) ·
[Testing](docs/reports/testing-report.md) ·
[Final report](docs/reports/final-report.md) ·
[Demo](docs/demo/demo-script.md)

**Not done, stated plainly:** there is **no live deployment** (it needs a hosting
account; the stack is built, tested and documented for Render, AWS and Azure);
reminders reach the console rather than a phone until notification credentials are
set; handwritten prescriptions are unsupported; and the accuracy figures for OCR and
refill prediction are on synthetic data. See the
[final report](docs/reports/final-report.md#7-limitations-and-risks).

**Numbers:** 628 backend tests (89.7% coverage), 142 frontend tests, 31 ML and
dataset tests, and a 20-check smoke test of the production stack.

## Quick start

```bash
git clone https://github.com/GKSJ-Deepvision/PillSync.git
cd PillSync
git checkout -b intern/NN-firstname-lastname origin/main
```

Then follow [INTERN_GUIDE.md](INTERN_GUIDE.md).

Run it locally:

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_reference_data                # loads the medicine catalogue
python manage.py runserver                          # http://localhost:8000

# Optional: the reminder worker, in a third terminal (needs Redis)
celery -A config worker -l info
celery -A config beat -l info

# Frontend, in a second terminal
cd frontend
npm install && cp .env.example .env
npm run dev                                         # http://localhost:5173
```

Everything at once, with Docker:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

A self-contained demo with a month of invented history (no Docker, no Redis):

```bash
python backend/scripts/run_demo.py          # API on :8010, own database
cd frontend && npm run dev:demo             # the app on :5173
```

Then follow [`docs/demo/demo-script.md`](docs/demo/demo-script.md). To run the
production topology instead, see [`docs/deployment.md`](docs/deployment.md).

API documentation: `http://localhost:8000/api/docs/`

---

## Automated checks

Every push to any branch runs [`CI`](.github/workflows/ci.yml):
branch policy · file hygiene · secret scan · structure and progress · YAML/JSON syntax ·
backend lint, format and tests · frontend lint, tests and build · notebook hygiene ·
Docker image build · a smoke test of the full production stack.

Checks skip themselves when the code they cover does not exist yet, so an early-week
branch is not punished for being early. See
[INTERN_GUIDE.md § What CI checks](INTERN_GUIDE.md#5-what-ci-checks-on-every-push).

---

## For mentors

Repository settings that the pipeline cannot enforce on its own — branch protection,
collaborator access, Actions permissions, the weekly cohort report — are listed in
[`docs/mentor-setup.md`](docs/mentor-setup.md).

---

## Licence

[MIT](LICENSE)
