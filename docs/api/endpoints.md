# PillSync — REST API Specification

All endpoints are hosted under `/api/` and return standard JSON payloads.

## Authentication & Accounts (`/api/accounts/`)
- `POST /api/accounts/login/` — Authenticate user credentials and return JWT access/refresh token pair.
- `POST /api/accounts/register/` — Register a new patient or caregiver user account.
- `POST /api/accounts/refresh/` — Refresh an expired JWT access token.
- `GET /api/accounts/me/` — Retrieve the authenticated user's profile and active role.
- `GET /api/accounts/users/` — Administrative list of all registered accounts.

## Profiles & Caregivers (`/api/profiles/`)
- `GET /api/profiles/` — List user profile details.
- `PUT /api/profiles/` — Update user profile (medical conditions, emergency contacts).
- `GET /api/profiles/patients/` — Caregiver endpoint returning all linked patients with adherence rates.
- `POST /api/profiles/assign/` — Link a patient to a caregiver.

## Medications (`/api/medications/`)
- `GET /api/medications/` — List all active medications for the user.
- `POST /api/medications/` — Create a new medication record (name, dosage, disease category, inventory).
- `GET /api/medications/{id}/` — Retrieve detailed medication information.
- `PUT /api/medications/{id}/` — Update medication details or dosage instructions.
- `DELETE /api/medications/{id}/` — Deactivate or archive a medication.

## OCR & Prescriptions (`/api/ocr/`, `/api/prescriptions/`)
- `POST /api/ocr/` — Upload an image (PNG/JPEG) of a medicine strip or prescription; returns extracted entities (medicine name, strength, quantity, frequency, confidence score).
- `GET /api/prescriptions/` — List user's past digital prescriptions.
- `POST /api/prescriptions/` — Save verified OCR prescription as active medication regimens.

## Reminders (`/api/reminders/`)
- `GET /api/reminders/today/` — List all scheduled doses for today partitioned by time-of-day slot (morning, afternoon, night).
- `POST /api/reminders/{id}/take/` — Mark a scheduled dose as taken (decrements stock, records adherence timestamp).
- `POST /api/reminders/{id}/snooze/` — Snooze reminder by configurable duration (e.g., 15 minutes).

## Adherence Tracking (`/api/adherence/`)
- `GET /api/adherence/summary/` — Overall adherence rate, taken vs missed dose counts.
- `GET /api/adherence/history/` — Chronological log of dose events (`TAKEN`, `MISSED`, `SNOOZED`).
- `GET /api/adherence/trends/` — Daily and weekly adherence percentages for trend charts.

## Refills & Inventory (`/api/refills/`)
- `GET /api/refills/` — Current stock status, days remaining, low-stock warnings.
- `POST /api/refills/request/` — Initiate a pharmacy refill order or log new pack purchase.

## Notifications & Alerts (`/api/notifications/`)
- `GET /api/notifications/` — List active notifications and reminders.
- `POST /api/notifications/alert/` — Caregiver dispatch of emergency alert or adherence nudge to patient.
- `POST /api/notifications/{id}/read/` — Mark alert as read.

## Analytics (`/api/analytics/`)
- `GET /api/analytics/dashboard/` — Aggregated dashboard metrics for patient adherence and refill burn rates.
- `GET /api/analytics/report/` — Generate downloadable clinical adherence audit report (CSV / PDF format).
