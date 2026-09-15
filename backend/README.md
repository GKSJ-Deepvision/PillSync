# PillSync Backend

Django REST API for the PillSync Milestone 1 workflows.

## Setup

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

The API runs at `http://localhost:8000/api/` and uses SQLite at `backend/db.sqlite3`.

Demo credentials for all seeded accounts use `password123`:

- `patient@pillsync.com`
- `caregiver@pillsync.com`
- `admin@pillsync.com`

## Covered API areas

- JWT login, registration, and current-user profile
- Profile read/update
- Caregiver patient roster, patient details, alerts, and alert resolution
- Admin user listing, editing, enable/disable, and activity logs
- Persistent models for medications, schedules, adherence records, alerts, and audit events
- Patient medication CRUD, dose status logging, adherence summaries, and notifications
