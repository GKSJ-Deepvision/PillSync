# PillSync API Notes

## Backend API

PillSync exposes REST endpoints through Django REST Framework. Routes are defined in `backend/config/urls.py` and in each app's `urls.py`. The frontend reaches the backend through the `VITE_API_BASE_URL` setting (`frontend/src/lib/apiClient.js`).

## Authentication

Protected endpoints expect a Supabase-issued JWT in the `Authorization: Bearer <token>` header. The backend verifies the token's signature and expiry (`backend/apps/common/supabase_auth.py`) and uses the token's `sub` claim as the patient id, so a client can never act as another user by sending a different id. Failed authentication returns HTTP 401.

## Endpoints

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/ocr/scan/` | `POST` | Signed-in user | Accepts a prescription or medicine-label image (multipart field `image`) and runs the OCR pipeline. |
| `/api/ocr/admin-monitoring/` | `GET` | Signed-in user (see note) | Read-only OCR monitoring data for the admin dashboard. |
| `/api/refills/check/` | `POST` | Signed-in user | Refill what-if calculator: predicts depletion and refill dates from current stock and daily use. |

### POST /api/ocr/scan/

Returns HTTP 201 with the saved scan `id` and the extraction result: `medicines` (one entry per medicine found, with name, strength, units per dose, doses per day, times of day, duration, quantity and food instruction), `source` (`tesseract` or `vision`), `handwriting_suspected`, `warnings` and `needs_review`. Nothing is saved as a medicine here; the frontend shows the result for the user to review and confirm first.

Errors: `400` if the image is missing, the wrong type, too large or unreadable; `503` if Tesseract is not installed on the server.

OCR results are normalised and validated: fields are range-checked, quantities are cross-checked against dose frequency and duration, and handwritten or low-confidence results are flagged for review. The pipeline supports Tesseract-based extraction and can also call a configured hosted vision model (Gemini, Anthropic or OpenAI).

### GET /api/ocr/admin-monitoring/

Returns `total`, `tesseract` and `vision` scan counts and `recent_scans` (the latest 100 scans, newest first, with id, patient id, source, medicine name, dosage, quantity, frequency, medicine count and creation time).

**Note:** the admin-only restriction is currently applied in the frontend. The endpoint itself only requires a signed-in user, so a server-side admin-role check is planned (see "Known limitations" in `docs/milestones/milestone-4.md`).

### POST /api/refills/check/

Request body: `medication_id` (UUID), `quantity_on_hand`, `daily_consumption`, and optional `medicine_name`, `lead_time_days` (default 5) and `low_stock_threshold_days` (default 5).

Returns HTTP 201 with `id`, `days_remaining`, `depletion_date`, `recommended_refill_date`, `is_low_stock` and `checked_at`, plus a `message` when stock is low. The check is saved for history. The live forecast from real dose history is calculated by a database function and shown on the Refills page.

## Backend application areas

Implemented in the backend: `common` (Supabase authentication), `ocr` and `refills`. The folders `accounts`, `adherence`, `analytics`, `medications`, `notifications`, `prescriptions`, `profiles` and `reminders` are reserved for later work; those features are currently handled in the frontend through Supabase.

## Direct Supabase access

Some frontend features bypass the Django API. `CaregiverAdherencePage.jsx` queries `caregiver_links`, `profiles` and `dose_logs` through the Supabase client, subject to Row Level Security policies.

## Error handling

If a vision-model request fails, the backend raises a `VisionError` that includes the provider's HTTP status and response body where it can be read. Invalid or non-JSON model output is rejected with a descriptive error.

## Testing

The backend test suite (57 tests) covers Supabase authentication, OCR views, parsing and pipeline, and refill services and views. The frontend has 57 Vitest tests. CI also checks branch policy, scans for committed secrets and builds both Docker images.