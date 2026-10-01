# PillSync API Notes

## Backend API

PillSync exposes REST endpoints through Django REST Framework. Routes are defined in `backend/config/urls.py` and in each app's `urls.py`.

## Authentication

Protected endpoints expect a Supabase-issued JWT in the `Authorization: Bearer <token>` header. The backend verifies the token before handling the request.

## OCR API

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| OCR scan endpoint (path to be confirmed from `apps/ocr/urls.py`) | `POST` | Authenticated user | Accepts a prescription image and runs the OCR pipeline. |
| OCR monitoring endpoint (path to be confirmed from `apps/ocr/urls.py`) | `GET` | Admin | Read-only OCR monitoring data for the admin dashboard. |

A successful scan returns HTTP 201 with the saved scan `id` and the extraction result. Extracted fields include medication name, dosage, quantity and frequency.

OCR results are normalised and validated: fields are range-checked, quantities are cross-checked against dose frequency and duration, and handwritten or low-confidence results are flagged for review. The pipeline supports Tesseract-based extraction and can also call a configured hosted vision model (Gemini, Anthropic or OpenAI).

## Backend application areas

accounts, adherence, analytics, common, medications, notifications, ocr, prescriptions, profiles, refills and reminders. A per-endpoint reference for the other apps will be added from their `urls.py` files.

## Direct Supabase access

Some frontend features bypass the Django API. `CaregiverAdherencePage.jsx` queries `caregiver_links`, `profiles` and `dose_logs` through the Supabase client, subject to Row Level Security policies.

## Error handling

If a vision-model request fails, the backend raises a `VisionError` that includes the provider's HTTP status and response body where it can be read. Invalid or non-JSON model output is rejected with a descriptive error.

## Testing

The backend test suite (57 tests) covers Supabase authentication, OCR views, parsing and pipeline, and refill services and views. CI and the release-readiness workflow also check branch policy, scan for committed secrets and verify Milestone 4 requirements.