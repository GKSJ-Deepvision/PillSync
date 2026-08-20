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

## Quick start

```bash
git clone https://github.com/GKSJ-Deepvision/PillSync.git
cd PillSync
git checkout -b intern/NN-firstname-lastname origin/main
```

Then follow [INTERN_GUIDE.md](INTERN_GUIDE.md).

Everything at once, with Docker:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

---

## Automated checks

Every push to any branch runs [`CI`](.github/workflows/ci.yml):
branch policy · file hygiene · secret scan · structure and progress · YAML/JSON syntax ·
backend lint, format and tests · frontend lint, tests and build · notebook hygiene ·
Docker image build.

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
