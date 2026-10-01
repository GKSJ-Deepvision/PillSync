# PillSync Database Notes

## Database

PillSync uses Supabase (PostgreSQL) for persistent application data. Authentication is handled by Supabase Auth, and the Django backend verifies Supabase JWTs.

## Tables read directly by the frontend

The caregiver adherence page queries these tables through the Supabase client:

| Table | Columns used | Purpose |
|---|---|---|
| `caregiver_links` | `caregiver_id`, `patient_id`, `status` | Links a caregiver to a patient. Only rows with status `accepted` are used. |
| `profiles` | `id`, `full_name` | Basic profile information for each linked patient. |
| `dose_logs` | `id`, `patient_id`, `scheduled_for`, `status` | One row per scheduled dose. Status is `taken`, `missed` or `pending`. |

## Adherence calculation

Adherence is taken doses divided by (taken + missed) doses. Pending doses are excluded. The caregiver overview covers the last 30 days and flags patients below 80% adherence.

## Other data

Medication, prescription, OCR scan, refill, notification and reminder data is managed by the corresponding Django apps (medications, prescriptions, ocr, refills, notifications, reminders). A full table-by-table schema will be added from the Django models and the Supabase schema.

## Access control

Direct frontend queries are governed by Supabase Row Level Security (RLS) policies, so a caregiver can only read rows for patients they are linked to. Secrets and service credentials must never be committed to source control or placed in frontend code.