# PillSync — Database Design (Milestone 1)

Two tables this milestone, related one-to-many via a self-referencing link
(a caregiver can be linked to many patients):

| Table | Purpose |
|---|---|
| `profiles` | One row per Supabase Auth user, keyed on the same UUID as `auth.users.id` — no separate foreign key needed. Holds `role` (single source of truth for RBAC), identity fields, and patient-only fields (`blood_group`, `conditions`, emergency contact) that stay empty for caregiver/admin rows. |
| `caregiver_links` | Many-to-many join table: `caregiver_id` / `patient_id` (both FKs to `profiles.id`), a `status` of `pending` / `accepted` / `revoked`, unique on the `(caregiver, patient)` pair. Writes are admin-only this milestone; self-serve invite/accept is Milestone 2 scope. |

A `handle_new_user()` trigger auto-creates a `profiles` row on every signup
using the `role` / `full_name` passed in `auth.signUp()`'s metadata. A second
trigger keeps `updated_at` current on both tables.

## Row Level Security — the real access boundary

`ProtectedRoute.jsx` only gates which dashboard body renders in the UI.
Actual enforcement is server-side, via these RLS policies:

| Policy | Effect |
|---|---|
| `profiles_select_own` / `profiles_update_own` | Every user can read/edit their own profile row, and no one else's. |
| `profiles_select_admin` | Admins can read every profile (powers the admin dashboard counts). |
| `profiles_select_linked_patient` | A caregiver can read a patient's profile only once that link has `status = 'accepted'`. |
| `links_select_participant` | Caregivers and patients can see links that involve them. |
| `links_admin_write` | Only admins can create or change `caregiver_links` rows. |

See `schema.sql` for the full DDL.
