# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Yogesh Yadavrao Pagar
- **Branch:** intern/21-yogesh-yadavrao-pagar
- **Submitted on:** 2026-09-14

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☑ Done | `backend/apps/medications/views.py`, `frontend/src/pages/MedicationsPage.jsx` |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `backend/apps/medications/models.py`, `backend/apps/reminders/models.py` |
| Reminder scheduling system functional | ☑ Done | `backend/apps/reminders/tasks.py`, `frontend/src/pages/RemindersPage.jsx` |
| Reminder actions: Taken / Missed / Snooze | ☑ Done | `backend/apps/adherence/views.py`, `backend/apps/reminders/views.py` |
| Medication history tracking implemented | ☑ Done | `backend/apps/adherence/models.py`, `backend/apps/adherence/services/metrics.py` |
| Notification workflows integrated (push / email / SMS) | ☑ Done | `backend/apps/notifications/services/dispatcher.py`, `backend/apps/notifications/views.py` |
| Multiple patient profiles for families | ☑ Done | `backend/apps/profiles/models.py`, `backend/apps/profiles/views.py` |

## What I built

In Milestone 2, I implemented complete medication management workflows and smart reminder scheduling:
1. **Medication Catalog & Disease Categorization**: Built full CRUD endpoints for patient medications, supporting disease-based tagging (Blood Pressure, Diabetes, Thyroid, Antibiotics, Vitamins, Heart Medications), stock level tracking, dosage units, instructions, and FDA NDC search integration.
2. **Smart Dosage Scheduler**: Developed automatic reminder slot calculation based on medication schedules (Morning 08:00, Afternoon 13:00, Evening 18:00, Night 21:00).
3. **Interactive Dose Actions**: Implemented Taken, Missed, and Snooze (+15 minutes) workflows. Logging dose intake automatically updates remaining medication stock and records adherence entries.
4. **Notification Engine**: Designed multi-channel notification dispatchers supporting Push, Email, and SMS delivery simulators, notifying caregivers upon missed doses.

## Reminder and notification design

Reminders are scheduled periodically using Celery worker beats and evaluated against active medication time vectors:
- **Morning Slot (08:00)**: Triggers morning reminders.
- **Afternoon Slot (13:00)**: Triggers afternoon reminders.
- **Night Slot (21:00)**: Triggers night reminders.
- **Snooze Handling**: Postpones active reminder status by +15 minutes, rescheduling notification dispatcher triggers.
- **Caregiver Alerts**: Automatically dispatches high-priority notifications to assigned caregivers if a dose is logged as missed or remains unconfirmed past the grace period.

## How to run and verify it

```bash
# Run backend tests
cd backend
python -m pytest apps/medications/tests/ apps/reminders/tests/ apps/notifications/tests/

# Run frontend UI tests
cd frontend
npm test
```

## Tests

- Test files added:
  - `backend/apps/medications/tests/test_medications.py`
  - `backend/apps/reminders/tests/test_reminders.py`
  - `backend/apps/notifications/tests/test_notifications.py`
  - `frontend/tests/unit/MedicationsPage.test.jsx`
  - `frontend/tests/unit/RemindersPage.test.jsx`
- What they cover: Medication creation, dosage scheduling, reminder generation, snooze state transitions, missed dose caregiver alerts, and UI page rendering.
- `pytest` result: 13 passed in 0.95s.
- `npm test` result: 4 passed in 0.60s.

## Blockers and open questions

None.
