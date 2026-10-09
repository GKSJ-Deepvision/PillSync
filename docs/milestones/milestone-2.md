# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Reference implementation (mentor-maintained, on `main`)
- **Branch:** `main`
- **Submitted on:** 2026-09-05

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | Done | [`apps/medications/`](../../backend/apps/medications) — medicines with stock, refills, disease grouping, catalogue-backed entry |
| Dosage scheduling (morning / afternoon / evening / night, repeats) | Done | [`MedicationSchedule`](../../backend/apps/medications/models.py) — daily, chosen days, every N days |
| Reminder scheduling system functional | Done | [`apps/reminders/`](../../backend/apps/reminders) — dose generation, dispatch, snooze, overdue sweep |
| Reminder actions: Taken / Missed / Snooze | Done | [`services/actions.py`](../../backend/apps/reminders/services/actions.py), plus Skipped |
| Medication history tracking implemented | Done | `GET /api/v1/doses/history/` — per-day counts and adherence |
| Notification workflows integrated (push / email / SMS) | Done | [`apps/notifications/`](../../backend/apps/notifications) — FCM, SendGrid-over-SMTP, Twilio, console fallback |
| Multiple patient profiles for families | Carried from M1 | A dependent profile's reminders go to whoever manages it |
| Disease-based medication organisation | Done | `GET /api/v1/medicines/by-condition/` |

## What I built

**Four apps.** `medications` owns a patient's own medicines — stock, pack size,
low-stock threshold, instructions, disease category — and the schedules they are
taken on. `prescriptions` stores the doctor's record and warns before it lapses.
`reminders` turns schedules into dated doses and handles what the patient does
about them. `notifications` decides who to tell, on which channel, and records
whether it worked.

**The pipeline.** A schedule is a rule; a `DoseEvent` is one dated instance of
it, created 14 days ahead. That single decision is what makes a reminder a row
to send, medication history the same rows after the fact, and Milestone 3's
adherence a count of them. Full reasoning in
[`docs/architecture/reminder-pipeline.md`](../architecture/reminder-pipeline.md).

**Four Celery tasks** drive it: dispatch every minute, sweep overdue doses every
15 minutes, top up the horizon nightly, warn about expiring prescriptions daily.
All idempotent — beat can double-fire after a restart, and a reminder sent twice
is worse than one sent late.

**Frontend.** Today's medicines grouped into the four parts of the day with
Taken / Snooze / Missed / Skip on each dose; a medicines page grouped by
condition with catalogue-backed entry and an inline schedule builder; a
day-by-day history with adherence bars; and notification settings.

## Reminder and notification design

**Scheduling.** Three repeat rules cover what the specification asks for: every
day, on chosen weekdays, and every N days counted from the start date. Times are
local to the patient — an 08:00 dose means 08:00 where they are, not on the
server, which matters the moment anyone travels.

**Delivery.** `dispatch_due_reminders` runs every minute and sends what has come
due. `reminder_sent_at` is the guard against re-sending, with snoozes matched on
`snooze_until` instead — the whole point of a snooze being a second reminder.

**When delivery fails.** Providers never raise on a delivery failure: one bad
recipient must not stop the batch sending to fifty others. Every attempt is
logged with its outcome, including attempts skipped by preference, because "why
didn't I get a reminder?" has to be answerable. `GET
/api/v1/notifications/log/delivery_stats/` reports the success rate that
Milestone 4 grades.

**Quiet hours are narrow on purpose.** They hold back low-stock, refill and
prescription-expiry notices only. Suppressing dose reminders during the default
22:00–07:00 window would break exactly the 06:00 thyroid tablet and the 22:30
statin — the doses people actually forget. This was found by a test: the first
implementation silenced them, and the test that caught it is
`test_a_dose_reminder_is_never_silenced_by_quiet_hours`.

**Without credentials, nothing breaks.** Each provider falls back to logging the
message, so the full pipeline runs in development and in CI with no Firebase
project, Twilio number or SendGrid key.

## How to run and verify it

```bash
# Backend, frontend and the reminder worker
cd backend
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py seed_reference_data
python manage.py runserver

# In another terminal, for real background delivery (needs Redis)
celery -A config worker -l info
celery -A config beat -l info
```

Or the whole stack, worker and beat included: `docker compose up --build`.

Then: add a medicine at `/medications` (search the catalogue for "metformin"),
give it a dose time a minute or two ahead, and watch it appear at `/today`.
Mark it taken and the stock drops; mark one missed and any active caregiver is
alerted.

Verified live against a running server: catalogue-backed medicine creation with
two schedules; today's doses grouped by slot; snooze then take; stock falling
60 → 58; a second take refused with 400; a missed dose alerting the caregiver on
two channels; history reporting 50% adherence for the day; and delivery stats.

## Tests

- **Test files added:** 5 backend
  (`apps/medications/tests/test_scheduling.py`, `test_medications_api.py`,
  `apps/reminders/tests/test_dose_actions.py`, `test_reminders_api.py`,
  `apps/notifications/tests/test_notifications.py`,
  `apps/prescriptions/tests/test_prescriptions_api.py`), 2 frontend
  (`DoseCard.test.jsx`, `TodaysDoses.test.jsx`).
- **What they cover:** the three repeat rules and their edge dates; that
  generation is idempotent, never back-fills, and honours the patient's
  timezone; that editing a schedule moves untouched doses but leaves answered
  ones alone; every dose action including the snooze cap and taking a snoozed
  dose; that stock decrements only on Taken and floors at zero; that a skipped
  dose is not an adherence failure; that only ACTIVE caregivers who opted in are
  alerted; the overdue sweeper; the four tasks, including that a reminder is not
  sent twice; quiet hours across midnight and the policy about which categories
  they may hold; that a blocked send is logged as skipped rather than dropped;
  device re-registration on a shared browser; and prescription expiry warnings.
- **`pytest` result:** 245 passed, 89% line coverage (137 new tests this
  milestone).
- **`npm test` result:** 56 passed across 7 files (13 new).
- **Lint:** `ruff`, `black --check`, `isort --check-only`, `eslint`,
  `prettier --check` all clean. OpenAPI schema generates with no warnings.

Two real defects were found by these tests rather than by users:

1. **Schedules were unreachable by their own owner.** The object permission
   resolved a patient profile from `obj` or `obj.patient`, and a
   `MedicationSchedule` has neither — it only knows its medicine. Every schedule
   edit returned 403. Fixed by extending the resolution chain, and the
   permission now fails closed for any model that has none of those paths.
2. **Default quiet hours silenced dose reminders**, as described above.

## Blockers and open questions

None blocking. Three notes:

1. **Celery is wired but only exercised eagerly in tests.** `CELERY_TASK_ALWAYS_EAGER`
   is on in development, so the tasks run inline. A real Redis-backed worker is
   in `docker-compose.yml` and should be run at least once before Milestone 4's
   deployment review.
2. **Push notifications need a Firebase project.** The code path, the device
   registration endpoint and the tests are complete, but `FIREBASE_CREDENTIALS_PATH`
   has to be set before a real push arrives. Until then it logs to the console.
   The frontend does not yet request browser notification permission or register
   a token — that is a small addition once a project exists.
3. **The dose horizon is 14 days.** Long enough to show the week ahead, short
   enough that editing a schedule does not orphan months of rows. Configurable
   through `DOSE_HORIZON_DAYS`.
