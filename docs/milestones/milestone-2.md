# M2 - Medication Management & Reminder System (Week 3–4)

## Objective

Add medication management, recurring dosage schedules, reminder actions and medication history, then establish asynchronous notification delivery through push, email, and SMS providers.

## Work completed

- Added medicine records with dosage/instruction, quantity, refill-threshold, active-state, and timestamps.
- Added dosage and medication scheduling APIs supporting daily or weekly schedules, times, date ranges, and active state.
- Added medication history tracking for scheduled occurrences with taken, missed, and skipped statuses.
- Added reminder generation for active medicine schedules and reminder records with morning, afternoon, and night periods.
- Added reminder list/detail APIs and Taken, Missed, and Snooze actions.
- Added Celery task support and Redis broker/result configuration.
- Configured Celery Beat to generate upcoming reminders hourly and dispatch pending notifications every minute.
- Added the notification model and delivery foundation for push, email, and SMS channels.
- Added FCM, SendGrid, and Twilio notification providers with channel-based dispatch.
- Added notification delivery tasks, pending-notification dispatch, retry/backoff handling, attempt tracking, failure errors, and sent timestamps.

## APIs/features implemented

- `GET` and `POST /api/medicines/`
- `GET` and `POST /api/medicines/<medicine_id>/schedules/`
- `PUT`, `PATCH`, and `DELETE /api/schedules/<pk>/`
- `GET` and `POST /api/medicines/<medicine_id>/history/`
- `GET`, `PUT`, `PATCH`, and `DELETE /api/medication-history/<pk>/`
- `GET /api/reminders/` and reminder detail access at `/api/reminders/<pk>/`
- `POST /api/reminders/<pk>/taken/`, `/missed/`, and `/snooze/`
- `GET` and `POST /api/dosages/`
- `GET` and `POST /api/medication-schedules/`

## Database/models introduced or extended

- `medicines.Medicine`, `medicines.MedicineSchedule`, and `medicines.MedicationHistory`.
- `medications.Dosage` and `medications.MedicationSchedule`.
- `reminders.Reminder`, including occurrence uniqueness, period, status, and snooze fields.
- `notifications.Notification`, including channel, delivery status, attempts, error, and sent-time fields.

## Background jobs and notification workflow

Celery generates upcoming reminder occurrences from active schedules. Pending notifications are queued for delivery, and the dispatcher selects FCM for push, SendGrid for email, or Twilio for SMS. Successful delivery records the sent state and timestamp. Provider failures record the error and increment attempts, then Celery retries with backoff up to the configured maximum.

## Testing and validation

- Django and pytest tests cover medication APIs, scheduling, reminder generation and actions, notification models/tasks, dispatcher behavior, and provider integrations.
- API tests cover medicine, dosage, schedule, history, and reminder endpoints.
- CI runs Ruff, Black, isort, Django system checks, and pytest with coverage reporting.
- The repository contains configuration for all listed checks and CI validation; this report does not claim a new local run result.

## Git/branch and development workflow

Milestone 2 work was completed in the repository history by the commit titled `feat: complete Milestone 2 - medicines, scheduling, reminders and notifications` (`e4a7626`). Development uses intern branches; the current branch is `intern/12-dushyant-singh-sisodiya`. Pushes trigger the CI workflow for repository checks, backend quality checks, Django validation, and tests.

## Final outcome/status

Milestone 2 backend functionality is complete. PillSync supports medication and schedule management, generated reminders with user actions, medication history, and asynchronous multi-channel notification delivery with retry handling.
