# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** <Swathi S>
- **Branch:** <intern/23-swathi-s>
- **Submitted on:** <2026-09-16>

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☐ Not started / ☐ In progress / ☐ Done | |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `backend/apps/medications/models.py`, `backend/apps/medications/serializers.py`, `backend/apps/medications/views.py`, `backend/tests/unit/test_dosage_models.py`, `backend/tests/integration/test_dosage_scheduling.py` |
| Reminder scheduling system functional | ☐ | |
| Reminder actions: Taken / Missed / Snooze | ☐ | |
| Medication history tracking implemented | ☑ Done | `backend/apps/medications/models.py`, `backend/apps/medications/views.py`, `backend/apps/adherence/views.py`, `backend/tests/integration/test_medication_history.py`, `backend/apps/medications/tests/test_api.py` |
| Notification workflows integrated (push / email / SMS) | ☐ | |
| Multiple patient profiles for families | ☐ | |

## What I built

Implemented recurring dosage scheduling and medication history tracking. Schedules support time-of-day windows, exact times, selected weekdays, and dose amounts. Medication history records the scheduled dose, status, and taken timestamp.

## Reminder and notification design

Reminder and notification workflows are  documented or marked complete for this milestone.

## How to run and verify it

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

## Tests

- Test files added: `backend/tests/unit/test_dosage_models.py`; `backend/tests/integration/test_dosage_scheduling.py`; `backend/tests/integration/test_medication_history.py`; `backend/apps/medications/tests/test_api.py`
- What they cover: recurring dosage schedules and medication API/history behavior.
- `pytest` / `npm test` result: Run `pytest` from `backend` to verify the current branch.

## Blockers and open questions

Reminder delivery channels, notification workflows, and multiple patient profiles remain open for this milestone.
