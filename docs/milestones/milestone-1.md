# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Syed Muhammed S R
- **Branch:** intern/19-syed-muhammed-s-r
- **Submitted on:** 2026-08-29

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | ☐ | |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | ☐ | |
| Database schema finalized | ☑ Done | `backend/database/pillsync_schema.sql` |
| Frontend setup completed | ☐ | |
| Role-based access control (Patient / Caregiver / Admin) | ☐ | |
| User profile management | ☐ | |
| UI wireframes and workflow planning | ☐ | |
| PostgreSQL configured | ☑ Done | PostgreSQL `pillsync_db` |

## What I built

I designed and implemented the PostgreSQL database schema for the PillSync medication management system.

The schema contains tables for users, patients, caregivers, caregiver-patient relationships, medicines, prescriptions, medication schedules, medication history, refills, and notifications. Primary keys and foreign-key relationships were added to maintain data relationships and integrity.

## Database design

The database schema is implemented in `backend/database/pillsync_schema.sql`.

The main tables are:

- `users` — stores user account information and roles.
- `patients` — stores patient-related information.
- `caregivers` — stores caregiver information.
- `caregiver_patients` — connects caregivers with patients.
- `medicines` — stores medicine information.
- `prescriptions` — stores prescription information.
- `medication_schedules` — stores medication timing and dosage schedules.
- `medication_history` — records medication-taking history.
- `refills` — stores medicine refill information.
- `notifications` — stores notification information.

Primary keys and foreign keys are used to maintain relationships between the tables.

## How to run and verify it

Connect to the PostgreSQL database:

```bash
psql -U <username> -d pillsync_db