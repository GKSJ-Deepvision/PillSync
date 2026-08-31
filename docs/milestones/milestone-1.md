# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Advala Indhu
- **Branch:** intern/01-advala-indhu
- **Submitted on:** 2026-08-31

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | ☑ Done | Runs on Supabase-managed PostgreSQL and Auth for this milestone. `backend/apps/` is left as the mentor-provided scaffold, reserved for later milestones. |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | ☑ Done | `frontend/src/context/AuthContext.jsx`. Verified live: registered a real account, confirmed it via a real email, and signed in successfully against a live Supabase project. |
| Database schema finalized | ☑ Done | `frontend/docs/database/schema.sql`. Deployed to a live Supabase project (`lwpsbfcqjqgzjwrjdtbk`). |
| Frontend setup completed | ☑ Done | Vite + React 18 + Tailwind CSS + React Router 6. `npm run lint`, `npm test`, `npm run build` all pass locally and in CI. |
| Role-based access control (Patient / Caregiver / Admin) | ☑ Done | `frontend/src/routes/ProtectedRoute.jsx` (UI gating) + Postgres RLS policies in `schema.sql` (the actual enforcement boundary). |
| User profile management | ☑ Done | `frontend/src/features/profile/ProfilePage.jsx`. Verified live: saved profile fields and confirmed they persisted after a page reload. |
| UI wireframes and workflow planning | ☑ Done | `frontend/docs/wireframes/README.md`. |
| PostgreSQL configured | ☑ Done | Supabase-managed PostgreSQL, connected via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. |

## What I built

Authentication, database schema, and role-based access for PillSync's Milestone 1, built on Supabase (managed PostgreSQL + Auth) rather than a hand-rolled Django backend. `AuthContext.jsx` wraps the Supabase Auth client and exposes sign-up, sign-in, Google OAuth, session sync, and password reset/update. `ProfilePage.jsx` is a single edit form with fields conditional on role — everyone gets name/phone/date of birth, patients additionally get blood group, conditions, and an emergency contact.

The database ships two tables: `profiles` (one row per Supabase Auth user, holding `role` as the single source of truth for RBAC) and `caregiver_links` (a many-to-many join between caregivers and the patients they're allowed to see, admin-write-only this milestone). A `handle_new_user()` trigger auto-provisions a `profiles` row on every signup.

This deviates from the spec's Django REST Framework / FastAPI backend — flagged here for mentor review. Supabase satisfies the milestone's auth, database, and RBAC requirements directly on managed PostgreSQL; the Django skeleton stays in place for the OCR and refill-prediction services planned for Milestones 2–3, which need a Python service Supabase can't provide.

## Database design

ER relationship: `profiles` 1—* `caregiver_links` (twice — once via `caregiver_id`, once via `patient_id`), giving the many-to-many caregiver ↔ patient link. Full DDL, including the role enum, triggers, and RLS policies, is in `frontend/docs/database/schema.sql`; design rationale is in `frontend/docs/database/README.md`.

Row Level Security is the real access-control boundary — `ProtectedRoute.jsx` only decides which dashboard body renders. Policies:

| Policy | Effect |
|---|---|
| `profiles_select_own` / `profiles_update_own` | Every user can read/edit their own profile row only. |
| `profiles_select_admin` | Admins can read every profile (powers admin dashboard counts). |
| `profiles_select_linked_patient` | A caregiver can read a patient's profile only once the link is `accepted`. |
| `links_select_participant` | Caregivers and patients can see links that involve them. |
| `links_admin_write` | Only admins can create or change `caregiver_links` rows. |

**Bug found and fixed during verification:** the first version of `profiles_select_admin` queried `public.profiles` from within a policy defined on `public.profiles` itself, which Postgres rejects as infinite recursion (surfaced as a live 500 error: `infinite recursion detected in policy for relation "profiles"`). Fixed by introducing a `SECURITY DEFINER` helper function, `current_user_role()`, that reads the caller's role while bypassing RLS; `profiles_select_admin` and `links_admin_write` now call that function instead of self-joining `profiles`. Applied directly against the live Supabase project and confirmed working.

## How to run and verify it

```bash
cd frontend
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project

# then, in the Supabase SQL editor, run frontend/docs/database/schema.sql

npm run dev      # local dev server — register an account, sign in, edit your profile
npm run lint      # oxlint
npm test          # vitest
npm run build     # production build
```

## Tests

- Test files added: `frontend/tests/unit/DoseRing.test.jsx`, `frontend/tests/unit/greeting.test.js`
- What they cover: `DoseRing.test.jsx` renders the dosing-window widget and asserts it exposes an accessible label ("today's dosing windows"); `greeting.test.js` asserts the time-of-day greeting helper returns the correct window at the morning/afternoon/evening/night boundaries used by the dashboards.
- `npm test` result: 2 test files, 5 tests, 0 failed — passing both locally and in CI (GitHub Actions run for commit `5f306bb`: Success).

## Blockers and open questions

None currently blocking. Open item for mentor review: using Supabase (managed Auth + PostgreSQL) instead of a from-scratch Django REST Framework backend for this milestone's auth/database/RBAC requirements — see "What I built" above for the reasoning. The Django skeleton under `backend/apps/` remains untouched and will be used for the OCR and refill-prediction work in later milestones.