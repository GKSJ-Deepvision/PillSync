# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Rajasri Nallamilli
- **Branch:** intern/03-rajasri-nallamilli
- **Submitted on:** 2026-09-07

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☑ Done | `backend/apps/medications/`, `frontend/src/features/medications/` |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `backend/apps/medications/models.py`, `frontend/src/pages/patient/MedicineSchedulePage.jsx` |
| Reminder scheduling system functional | ☑ Done | `backend/apps/reminders/`, `frontend/src/features/reminders/` |
| Reminder actions: Taken / Missed / Snooze | ☑ Done | `backend/apps/reminders/views.py`, `frontend/src/pages/patient/ReminderModal.jsx` |
| Medication history tracking implemented | ☑ Done | `backend/apps/adherence/`, `frontend/src/features/adherence/HistoryTable.jsx` |
| Notification workflows integrated (push / email / SMS) | ☑ Done | `backend/apps/reminders/models.py`, `frontend/src/pages/patient/NotificationsPage.jsx` |
| Multiple patient profiles for families | ☑ Done | `backend/apps/profiles/`, `frontend/src/features/profile/FamilyProfileManager.jsx` |

## What I built

I implemented complete **Medication History Tracking** and **Multiple Patient Profiles for Families** alongside full backend API services and frontend UI components for Milestone 2:

1. **Multiple Patient Profiles for Families**:
   - Django `PatientProfile` model (`backend/apps/profiles/`) supporting multiple profiles under family accounts (Self, Spouse, Child, Parent/Elderly, Sibling, Other).
   - Frontend `FamilyProfileManager.jsx` and `FamilyProfileSelector.jsx` allowing users to manage family profiles, edit health details, and switch active family profile context across the top bar.

2. **Medication History Tracking**:
   - Django `AdherenceLog` model (`backend/apps/adherence/`) for intake logs with status (`Taken`, `Missed`, `Snoozed`), patient profile link, timestamp, and notes.
   - API endpoints (`/api/adherence/history/` and `/api/adherence/summary/`) for history retrieval and adherence rate math.
   - Frontend `HistoryTable.jsx` and `historyService.js` displaying comprehensive intake logs, family profile filter, status filter, search, and adherence rate summary stats.

3. **Smart Reminder Actions & Schedule Integration**:
   - Connected `MedicineSchedulePage.jsx` and `ReminderModal.jsx` so taking, missing, or snoozing a dose persists an intake log into history.

## Reminder and notification design

- Reminders are linked to `MedicationSchedule` and `PatientProfile`.
- Dose actions (`Taken`, `Missed`, `Snoozed`) trigger status transitions in `Reminder` and automatically record an `AdherenceLog` entry.
- Notification feed allows viewing reminder alerts and caregiver nudge notifications per patient profile.

## How to run and verify it

```bash
# Backend setup and tests
cd backend
python manage.py migrate
python -m pytest

# Code style checks
python -m ruff check .
python -m black --check .
python -m isort --check-only .

# Repository structure check
python .github/scripts/check_structure.py

# Frontend build check
cd ../frontend
npm run build
```

## Tests

- Test files added:
  - `backend/apps/accounts/tests/test_accounts.py`
  - `backend/apps/profiles/tests/test_profiles.py`
  - `backend/apps/medications/tests/test_medications.py`
  - `backend/apps/reminders/tests/test_reminders.py`
  - `backend/apps/adherence/tests/test_adherence.py`
  - `backend/tests/test_integration.py`
- What they cover:
  - Custom User role assignment and authentication.
  - Family profile creation, relationship tagging, and switching.
  - Medication creation and dosage schedule association.
  - Reminder action transitions (Taken/Missed/Snoozed).
  - Intake history logging and adherence percentage calculations.
  - End-to-end family medication history workflow integration.
- `pytest` / `npm test` result: All 6 backend pytest unit and integration tests passed cleanly in < 1 sec. Frontend builds cleanly via Vite.

## Blockers and open questions

None.
