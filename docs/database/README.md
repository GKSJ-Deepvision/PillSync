# Database design — Milestone 1

PillSync's Milestone 1 database runs on **Supabase** (managed PostgreSQL +
Auth). The full, runnable schema is in [`schema.sql`](./schema.sql) — paste
it into the Supabase SQL Editor once per project. This file explains the
design behind it.

## Why Supabase for Milestone 1

The spec calls for Django REST Framework or FastAPI with JWT/OAuth2 auth on
PostgreSQL. Supabase **is** PostgreSQL, and its Auth service already
implements JWT issuance/refresh, OAuth2 (Google, GitHub, etc.), password
hashing, and password reset/change flows to production standard — so
Milestone 1's four heaviest boxes (backend init, auth workflows, RBAC,
PostgreSQL) are satisfied by configuration + SQL rather than hand-rolled
auth code. The `backend/apps/accounts` and `backend/apps/profiles` Django
skeletons stay in the repo for the OCR/refill-prediction/analytics services
that arrive in Milestones 3–4, which need a Python service for ML work
Supabase can't do.

## Entity-relationship overview

```
auth.users (Supabase-managed)
      │ 1:1 (same id)
      ▼
profiles ──────────────< caregiver_links >────────────── profiles
 id (PK, = auth.users.id)   caregiver_id (FK → profiles.id)   (same table,
 role: patient|caregiver|   patient_id   (FK → profiles.id)    self-referencing)
       admin                status: pending|accepted|revoked
 full_name, phone,
 date_of_birth, avatar_url
 blood_group, conditions[]
 emergency_contact_*
```

- **`profiles`** — one row per Supabase Auth user. `id` is the same UUID as
  `auth.users.id`, so there is no separate foreign-key column: the primary
  key *is* the link. `role` is the single source of truth for RBAC. Patient-
  only clinical fields (`blood_group`, `conditions`, emergency contact) live
  on the same table rather than a separate `patient_details` table for
  Milestone 1 — they're simply `null`/empty for caregiver and admin rows.
  Splitting them out is a clean, low-risk refactor for Milestone 2 once the
  medications module needs to join against patients specifically.
- **`caregiver_links`** — a many-to-many join table between two `profiles`
  rows, modelling "this caregiver can see that patient." `status` supports
  the invite → accept flow described in the spec (Milestone 2 builds the
  self-serve UI for it; Milestone 1 ships the table, RLS, and an admin-only
  write path).

## Row Level Security = the real access control

The UI's `ProtectedRoute` (frontend) only decides what renders. The
enforcement that actually matters lives in Postgres:

| Policy | Effect |
|---|---|
| `profiles_select_own` / `profiles_update_own` | Every user can read and edit their own profile, never anyone else's, by default. |
| `profiles_select_admin` | Admins can read every profile — powers the admin dashboard's user counts. |
| `profiles_select_linked_patient` | A caregiver can read a patient's profile only once `caregiver_links.status = 'accepted'`. |
| `links_select_participant` / `links_admin_write` | Caregivers and patients see links that involve them; only admins create or change links in Milestone 1. |

## Auto-provisioning

`handle_new_user()` fires on every `auth.users` insert and creates the
matching `profiles` row, reading `role` and `full_name` out of the sign-up
metadata the frontend sends (`supabase.auth.signUp({ options: { data: {...
} } })`). A user can never end up authenticated without a profile row, and
the role is set once, server-side, at creation time — the browser cannot
grant itself `admin` by editing local state.
