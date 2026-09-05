# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Reference implementation (mentor-maintained, on `main`)
- **Branch:** `main`
- **Submitted on:** 2026-09-05

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | Done | [`backend/`](../../backend) — Django 6.0 + DRF, `config/settings/{base,dev,prod}.py`, `manage.py check` clean |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | Done | [`apps/accounts/`](../../backend/apps/accounts) — register, login, refresh, logout+blacklist, Google ID-token exchange, password change/reset |
| Database schema finalized | Done | [`docs/database/schema.md`](../database/schema.md), migrations in `apps/*/migrations/0001_initial.py` |
| Frontend setup completed | Done | [`frontend/`](../../frontend) — Vite + React 19 + Tailwind 4 + Redux Toolkit; `npm run build` succeeds |
| Role-based access control (Patient / Caregiver / Admin) | Done | [`apps/common/permissions.py`](../../backend/apps/common/permissions.py), `User.accessible_patient_profiles()` |
| User profile management | Done | [`apps/profiles/`](../../backend/apps/profiles) — patient profiles, family profiles, conditions, emergency contacts |
| UI wireframes and workflow planning | Done | [`docs/wireframes/wireframes.md`](../wireframes/wireframes.md) |
| PostgreSQL configured | Done | `config/settings/base.py` (`DATABASE_URL` → `POSTGRES_*` → SQLite fallback); CI runs the suite against PostgreSQL 16 |

## What I built

**Backend.** A Django 6.0 / DRF project with three apps. `accounts` owns
identity: a UUID-keyed, email-login `User` covering all three roles, JWT
authentication with rotating refresh tokens and blacklisting, Google OAuth2
sign-in by verified ID token, Argon2 password hashing, password change and a
reset flow that cannot be used to enumerate accounts. `CaregiverAssignment`
implements the caregiver→patient link: it starts `PENDING`, only the patient can
activate it, and three flags control what the caregiver may see or do.

`profiles` owns the patient record, separate from `User` so a parent can manage
profiles for a child or an elderly relative who has no login of their own —
the specification's "multiple patient profiles for families". Conditions and
emergency contacts hang off it.

`common` holds the shared base model, the RBAC permission classes, the unified
error envelope, and the two seeded reference tables.

**Frontend.** A Vite + React 19 SPA with an axios client that attaches the
access token, refreshes it transparently on a 401, and replays the failed
request. Redux Toolkit holds the session; a small `useApi` hook handles server
data. Screens: login, register, dashboard, my profile, family profiles,
caregivers, my patients, medicine catalogue, admin user management — each gated
by role in the router and again by the API.

**Datasets.** ~116,000 FDA National Drug Code products downloaded, filtered to
home-administered human medicines, and categorised into the six condition
groups the specification names. 2,562 categorised presentations, of which
1,742 across 369 generics are committed as the seed catalogue, plus 20
conditions.

## Database design

[`docs/database/schema.md`](../database/schema.md) has the ER diagram and the
reasoning. Nine tables. The decisions that shaped it:

- **UUID primary keys** — ids appear in URLs a patient and their caregiver both
  see; sequential integers would leak volume and make records guessable.
- **`User` separate from `PatientProfile`** — a dependent needs a profile
  without a login.
- **One `User` for all roles** — a caregiver is often also a patient.
- **Nothing is deleted** — `is_active` retires rows, because medication history
  has to outlive the account.

Constraints are enforced in the database, not only in serializers: unique
`(caregiver, patient)`, a check that nobody is their own caregiver, unique
`(managed_by, full_name)` for profiles, and a partial unique index giving each
patient at most one primary emergency contact.

## Datasets

| Output | Rows | Tracked? |
|---|---|---|
| `ml/data/raw/product.txt` | 115,981 | No — rebuildable |
| `ml/data/processed/medicines_catalogue.csv` | 2,562 | No |
| `backend/apps/common/data/medicines_seed.csv` | 1,742 | Yes (288 KB) |
| `backend/apps/common/data/conditions_seed.json` | 20 | Yes |
| `ml/data/samples/medicines_sample.csv` | 120 | Yes |

Source: the FDA National Drug Code Directory, public domain. No patient data of
any kind is committed.

Category coverage: Blood Pressure 658 · Diabetes 246 · Thyroid 103 ·
Antibiotics 757 · Vitamins 334 · Heart Medications 464 (before the per-category
seed cap). The seed keeps the most widely marketed generics in each category
with all their strengths — ranking by how many NDC products carry a name, rather
than slicing alphabetically, which would have dropped everyday drugs like
metoprolol.

Homeopathic preparations (~13,700 of the directory) are excluded: their
ingredient names match the category rules but they are not medicines this
platform should suggest, and their names crowd out real drugs in search.
Combination products keep their full ingredient list under one normalised
spelling, so the same painkiller does not appear three times.

## How to run and verify it

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_reference_data
python manage.py createsuperuser
python manage.py runserver
```

```bash
# Frontend, in a second terminal
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

Or the whole stack: `docker compose up --build`.

Then: register at `/register`, sign in, add a family profile at `/family`,
search "metformin" at `/medicines`. API docs at
`http://localhost:8000/api/docs/`.

Verified live against a running server: `/health/`, registration, login,
`/users/me/`, `/profiles/patients/me/`, medicine search (84 metformin
presentations), category counts, and that an unauthenticated request gets 401
while a patient hitting `/admin/users/` gets 403.

## Tests

- **Test files added:** 5 backend (`apps/accounts/tests/test_models.py`,
  `test_auth_api.py`, `test_rbac.py`, `apps/profiles/tests/test_profiles_api.py`,
  `apps/common/tests/test_reference_api.py`), 1 ML
  (`ml/tests/test_medicine_reference.py`), 5 frontend.
- **What they cover:** the user manager and role helpers; every auth workflow
  including token rotation, blacklisting and both password flows; that login
  and password reset reveal nothing about which emails exist; the full caregiver
  assignment lifecycle; that a patient cannot see another patient's profile by
  id, that a caregiver sees nothing before `ACTIVE` and nothing after revoke,
  and that they never get write access; family profile creation, including that
  a client cannot attach a profile to someone else's account; the seed files'
  shape and the seed command's idempotency; the dataset categorisation rules;
  and on the frontend, the API error envelope, token storage, validation, the
  login form and role-gated routing.
- **`pytest` result:** 108 passed, 87% line coverage.
- **`npm test` result:** 43 passed across 5 files.
- **Lint:** `ruff`, `black --check`, `isort --check-only`, `eslint`,
  `prettier --check` all clean.

Three real defects were found by these tests rather than by users: an admin
viewset whose `http_method_names` silently blocked its own activate/deactivate
actions; a seed command that was not idempotent because its dedup key used
untruncated names while the database stored truncated ones; and a malformed
regex escape in `pyproject.toml` that would have failed every CI run.

## Blockers and open questions

None blocking. Three notes for the mentors:

1. **Django 6.0 requires Python ≥3.12**, so the toolchain pin moved from 3.11 to
   3.12 across CI, `pyproject.toml`, `ruff.toml` and the Dockerfile.
2. **Google OAuth2 needs credentials.** The code path and its tests are
   complete, but `GOOGLE_OAUTH2_CLIENT_ID` has to be set before the button can
   be wired into the UI. It is stubbed in tests, not exercised against Google.
3. **This reference implementation lives on `main`**, which every intern branches
   from — so all 26 start from a finished Milestone 1 rather than building it.
   If the intent is for them to build it themselves, this should move to a
   `reference/milestone-1` branch instead.
