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

## Tables created by the Django backend

The backend creates two tables of its own through migrations (run on every deployment start). Neither uses a foreign key to a Django user table: patient and medication ids are UUIDs that refer to rows in Supabase.

### `ocr_prescriptionscan` (model `PrescriptionScan`)

One row per uploaded prescription or label image.

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID, primary key | Scan id |
| `patient_id` | UUID | The signed-in user, taken from the Supabase token |
| `image` | file path | The uploaded image |
| `source` | text | `tesseract` or `vision` |
| `result` | JSON | The full scan result, one entry per medicine |
| `raw_text` | text | Raw text read from the image |
| `medicine_name`, `dosage`, `quantity`, `frequency` | text | The first medicine, kept for compatibility with earlier milestones |
| `created_at` | timestamp | When the scan was made |

### `refills_refillcheck` (model `RefillCheck`)

One row per refill what-if calculation.

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID, primary key | Check id |
| `medication_id` | UUID | Refers to `medications.id` in Supabase |
| `patient_id` | UUID | The signed-in user |
| `quantity_on_hand`, `daily_consumption` | float | Inputs |
| `days_remaining` | float | Days of stock left |
| `depletion_date`, `recommended_refill_date` | date | Predicted dates |
| `is_low_stock` | boolean | Whether stock is below the threshold |
| `checked_at` | timestamp | When the check was made |

## Other data

Profiles, medications, reminders, dose logs, notifications and caregiver links are Supabase tables used directly by the frontend, protected by Row Level Security. Their definitions are managed in Supabase, not in Django migrations.
## Caregiver linking

A caregiver and a patient are linked through `caregiver_links`. Either side can start a request, and the other side has to accept before the caregiver can see any of the patient's data.

| Function | Who calls it | What it does |
|---|---|---|
| `request_caregiver_link(email)` | Caregiver | Requests a link to the patient with that email |
| `patient_request_caregiver(email)` | Patient | Requests a link to the caregiver with that email |
| `my_caregiver_requests()` | Patient | Lists requests sent by caregivers |
| `my_patient_requests()` | Caregiver | Lists requests sent by patients |
| `respond_caregiver_link(id, accept)` | The receiving side | Accepts or declines a pending request |

The `requested_by` column records who started each request. A request to an unknown email returns the same reply as a valid one, so the app never reveals which emails are registered. If both sides send a request, the link is accepted automatically. The SQL is in `frontend/docs/database/schema-caregiver-requests.sql` and `schema-caregiver-requests-patient-side.sql`.

## Access control

Direct frontend queries are governed by Supabase Row Level Security (RLS) policies, so a caregiver can only read rows for patients they are linked to. Secrets and service credentials must never be committed to source control or placed in frontend code.