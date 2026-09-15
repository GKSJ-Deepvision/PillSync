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

## AI Refill Prediction Engine (Module 6)

Implemented: a Python/FastAPI service (`backend/apps/refills`) backed by a
trained ML model (`ml/src/refill_prediction`) that predicts, per medicine,
how many days of stock a patient has left — adjusted for the patient's
*actual* adherence pattern, not just the prescribed dose. Shown on both the
**patient** dashboard/Refills page and the **caregiver** dashboard
(aggregated across every linked patient, most urgent first).

```bash
# 1. Train the model (writes ml/models/refill_predictor.joblib)
pip install -r ml/requirements.txt
python -m ml.src.refill_prediction.train

# 2. Run the API
cd backend
pip install -r requirements/dev.txt
python -m uvicorn config.main:app --reload --port 8000

# 3. Point the frontend at it (already the default)
# frontend/.env -> VITE_API_BASE_URL=http://localhost:8000/api
```

The frontend falls back to a local rule-based estimate if this service
isn't running, so the dashboards never go blank — they just say so. See
`ml/README.md` and `backend/apps/refills/README.md` for how the model is
trained/selected and how the API is shaped.

---

## Running Milestone 1 locally

This branch's Milestone 1 (auth, database, RBAC, profiles) is built on
**Supabase** — see [`docs/milestones/milestone-1.md`](docs/milestones/milestone-1.md)
and [`docs/database/README.md`](docs/database/README.md) for why. It needs a
free Supabase project plus the frontend; the Django backend under
`backend/` is not required to see Milestone 1 working.

### 1. Create the Supabase project and database

1. Go to [supabase.com](https://supabase.com) → **New project** (the free
   tier is enough). Note the **Project URL** and the **`anon` public key**
   from **Project Settings → API** once it's provisioned.
2. Open **SQL Editor → New query**, paste the entire contents of
   [`docs/database/schema.sql`](docs/database/schema.sql), and run it. This
   creates the `profiles` and `caregiver_links` tables, the auto-provisioning
   trigger, and all Row Level Security policies.
3. Then run [`docs/database/schema_m2_m3.sql`](docs/database/schema_m2_m3.sql)
   the same way — it adds `medications`, `medication_schedules` and
   `dose_logs` (Medicine Management, Scheduling, Reminders, Dose Tracking,
   History, Refill Alerts and the Adherence Dashboard all depend on this).
3. *(Optional, recommended for local testing)* In **Authentication →
   Providers → Email**, turn off "Confirm email" so newly registered test
   accounts can sign in immediately without clicking an email link.
4. *(Optional)* In **Authentication → Providers → Google**, enable Google
   sign-in and add your OAuth client ID/secret if you want to test the
   "Continue with Google" button — it's safe to leave disabled otherwise.

### 2. Run the frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` and set:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then:

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to **http://localhost:5173**).

### 3. Try it out

1. Go to `/register`, choose **Patient**, fill in the form, and submit.
   (If you disabled email confirmation in step 1.3, you're signed in
   immediately; otherwise, confirm via the email Supabase sends, then sign
   in at `/login`.)
2. You'll land on the **patient dashboard** with the Dose Ring widget.
   Visit `/profile` to fill in conditions, blood group and an emergency
   contact, save, then refresh to confirm it persisted.
3. Register a second account as **Caregiver** to see the caregiver
   dashboard body (empty until an admin links a patient).
4. To provision the **Admin** account, first create or reset the account in
   Supabase **Authentication → Users** using the admin email and password you
   choose. Then run [`docs/database/provision-admin.sql`](docs/database/provision-admin.sql)
   in **SQL Editor**. Sign in at `/login`; the existing profile role lookup
   will open the Admin dashboard automatically. Never put the admin password
   in frontend source code or `.env` variables exposed to Vite.

### 4. Verify the checks CI will run

```bash
cd frontend
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Vitest — 3 tests
npm run build         # Production build
```

All four should pass with no setup beyond `npm install` (they don't need a
live Supabase connection).

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
