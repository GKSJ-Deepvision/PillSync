# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Vemula Purna Vijaya Sai Phani Kumar
- **Branch:** intern/22-vemula-purna-vijaya-sai-phani-kumar
- **Submitted on:** 2026-08-30

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | Done | Backend runs on **Supabase** (managed PostgreSQL + Auth) for this milestone — see `docs/database/schema.sql` and the architecture note below. Django skeleton in `backend/apps/` is kept for the ML/OCR services arriving in Milestones 3-4. |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | Done | `frontend/src/context/AuthContext.jsx` (sign up, sign in, Google OAuth, session persistence, password reset + change) wired to Supabase Auth, which issues/refreshes JWTs. Screens: `frontend/src/features/auth/*.jsx` |
| Database schema finalized | Done | `docs/database/schema.sql` (`profiles`, `caregiver_links`, enum, triggers, RLS). Design write-up in `docs/database/README.md` |
| Frontend setup completed | Done | Vite + React 18 + Tailwind CSS + React Router + `@supabase/supabase-js`, in `frontend/`. `npm run lint`, `npm test`, `npm run build` all pass |
| Role-based access control (Patient / Caregiver / Admin) | Done | Role stored server-side in `profiles.role`, enforced by Postgres Row Level Security (`docs/database/schema.sql`); UI gating in `frontend/src/routes/ProtectedRoute.jsx` and role-specific dashboards in `frontend/src/pages/` |
| User profile management | Done | `frontend/src/features/profile/ProfilePage.jsx` — edit name, phone, DOB, blood group, conditions, emergency contact; role-conditional fields |
| UI wireframes and workflow planning | Done | `docs/wireframes/README.md` |
| PostgreSQL configured | Done | Supabase-managed PostgreSQL; connection via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `frontend/.env` |

## What I built

A working authentication and profile-management core for PillSync, backed by
Supabase instead of a hand-rolled Django auth stack. Supabase Auth issues and
refreshes JWTs, supports Google OAuth2 sign-in, and handles password
hashing/reset/change out of the box, so Milestone 1's auth requirements are
met by configuration plus a small `AuthContext` wrapper rather than custom
token code. A Postgres trigger auto-creates a `profiles` row on every signup,
reading the chosen role (Patient or Caregiver; Admin is provisioned
separately) out of the signup metadata, and Row Level Security policies —
not the frontend — are what actually stop a patient from reading another
patient's data or a non-admin from listing every account.

On top of that sits a React + Tailwind frontend with a custom visual identity
built around a "Dose Ring": a circular mark literally divided into the four
real dosing windows (morning / afternoon / evening / night) that shows up as
the logo, as ambient hero art on the auth screens, and — functionally — as
the "doses logged today" widget on the patient dashboard. Login, registration
(with a role picker), forgot/reset password, a shared dashboard shell with
role-specific bodies for Patient / Caregiver / Admin, and a full profile-edit
form are all implemented and wired to live Supabase calls.

The Django skeleton under `backend/apps/` is left in place untouched: OCR,
refill prediction and analytics in Milestones 3-4 need a Python service for
model inference that Supabase can't provide, so that work will sit alongside
Supabase rather than replacing it.

## Database design

Full schema: [`docs/database/schema.sql`](../database/schema.sql). Design
rationale and ER overview: [`docs/database/README.md`](../database/README.md).

Main tables:
- **`profiles`** — one row per Supabase Auth user (`id` = `auth.users.id`).
  Holds `role` (patient/caregiver/admin), contact info, and patient-only
  clinical fields (blood group, conditions array, emergency contact).
- **`caregiver_links`** — many-to-many join between two `profiles` rows,
  modelling which caregiver can see which patient, with a `pending /
  accepted / revoked` status.

## How to run and verify it

See the root [README.md](../../README.md#running-milestone-1-locally) for
full setup (Supabase project creation, running the SQL, env vars, `npm
install && npm run dev`). Short version:

```bash
# 1. Create a free project at https://supabase.com, then in its SQL Editor
#    run the contents of docs/database/schema.sql.

# 2. Frontend
cd frontend
cp .env.example .env          # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev                   # http://localhost:5173
```

To verify by hand: open `/register`, create a Patient account, confirm the
email if your Supabase project requires it, sign in, land on the patient
dashboard with the Dose Ring, fill in `/profile`, sign out, sign back in and
confirm the data persisted. Create a second account as Caregiver to see the
different dashboard body. To see the Admin view, open Supabase's Table
Editor, open `profiles`, and change that user's `role` to `admin` by hand
(there is no self-serve admin signup, by design).

## Tests

- Test files added: `frontend/tests/unit/DoseRing.test.jsx`,
  `frontend/tests/unit/greeting.test.js`
- What they cover: the Dose Ring renders with an accessible label; the
  time-of-day greeting helper returns the right window/label at the
  boundaries used by the dashboards.
- `npm test` result: **3 passed, 0 failed** (`vitest run`). `npm run lint`
  and `npm run build` also pass clean.

## Blockers and open questions

- The project spec's backend stack is Django REST Framework/FastAPI; I used
  Supabase for Milestone 1's auth/DB/RBAC instead, since it satisfies those
  requirements directly on managed PostgreSQL and left more time for the
  frontend. Flagging this for mentor review in case the cohort expects a
  from-scratch Django auth implementation regardless — happy to add a thin
  Django service that verifies Supabase JWTs if that's preferred, rather
  than reimplementing auth.
- Caregiver-to-patient linking is currently admin-only (by RLS design); the
  self-serve invite flow described in the spec is scoped to Milestone 2
  alongside the rest of the caregiver features.
