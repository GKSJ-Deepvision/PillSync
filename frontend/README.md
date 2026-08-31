# PillSync — Milestone 1 (Frontend)

React 18 + Vite 5 + Tailwind + React Router 6 frontend, Supabase for Auth
and PostgreSQL (managed backend). Covers Milestone 1 scope: authentication,
RBAC, profile management, and the database schema.

## Setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
```

In the Supabase SQL editor, run `docs/database/schema.sql` to create the
`profiles` / `caregiver_links` tables, triggers, and RLS policies.

Then:

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # oxlint
npm test         # vitest
```

## What's implemented

- `src/context/AuthContext.jsx` — sign up, sign in, Google OAuth, session
  sync, password reset/update.
- `src/routes/ProtectedRoute.jsx` — role-gated route wrapper (UI only; RLS
  is the real boundary — see `docs/database/README.md`).
- `src/features/profile/ProfilePage.jsx` — profile edit form, patient-only
  fields conditional on role.
- `docs/database/schema.sql` — `profiles` + `caregiver_links` tables,
  triggers, RLS policies.
- `tests/unit/` — DoseRing and greeting-helper unit tests.

## Pushing to your branch

```bash
git checkout -b intern/<your-id>-<your-name> main
# copy these files into the repo's frontend/ directory
git add .
git commit -m "Milestone 1: Supabase auth, RBAC, profile management, schema"
git push origin intern/<your-id>-<your-name>
```
