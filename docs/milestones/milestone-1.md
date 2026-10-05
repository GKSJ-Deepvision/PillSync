# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Yogesh Yadavrao Pagar
- **Branch:** intern/21-yogesh-yadavrao-pagar
- **Submitted on:** 2026-09-07

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | ☑ Done | `backend/config/settings/`, `backend/manage.py` |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | ☑ Done | `backend/apps/accounts/views.py`, `backend/apps/accounts/serializers.py` |
| Database schema finalized | ☑ Done | `docs/database/schema.sql`, `backend/apps/accounts/models.py`, `backend/apps/profiles/models.py` |
| Frontend setup completed | ☑ Done | `frontend/package.json`, `frontend/src/App.jsx`, `frontend/vite.config.js` |
| Role-based access control (Patient / Caregiver / Admin) | ☑ Done | `backend/apps/accounts/models.py`, `backend/apps/accounts/permissions.py` |
| User profile management | ☑ Done | `backend/apps/profiles/views.py`, `backend/apps/profiles/models.py` |
| UI wireframes and workflow planning | ☑ Done | `docs/architecture/system-architecture.md`, `docs/architecture/architecture-diagram.png` |
| PostgreSQL configured | ☑ Done | `backend/config/settings/base.py`, `docker-compose.yml` |

## What I built

I completed the core architecture foundation for PillSync, including:
1. **Django REST Framework & Vite React Environment**: Configured Django backend with JWT & OAuth2 token authentication workflows, custom user models, and role-based access control (Patient, Caregiver, Admin).
2. **User Profiles & Caregiver Relations**: Implemented profile management allowing patients to manage personal details, medical conditions, and caregiver connections.
3. **Database Architecture**: Created PostgreSQL models for Users, Profiles, Medications, Reminders, AdherenceLogs, and RefillOrders, alongside MongoDB document store integration for audit logging.
4. **Frontend Shell & Auth UI**: Constructed modern React context-driven authentication, route guards for RBAC, dark mode support, and responsive layouts.

## Database design

The database relational schema is located at `docs/database/schema.sql`.

Key relational tables:
- **`accounts_user`**: Custom user entity storing email, full name, role (PATIENT, CAREGIVER, ADMIN), phone number, and auth metadata.
- **`profiles_userprofile`**: Extended profile containing emergency contacts, date of birth, blood group, primary physician info, and chronic condition notes.
- **`profiles_caregiverassignment`**: Junction entity linking Caregivers with assigned Patients for monitoring and missed dose alerts.

## How to run and verify it

```bash
# Backend setup & test
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
python manage.py test

# Frontend setup
cd frontend
npm install
npm run dev
```

## Tests

- Test files added: `backend/apps/accounts/tests/test_accounts.py`
- What they cover: User registration, JWT login token issuance, role-based endpoint permissions (Patient vs Caregiver vs Admin access), password hashing verification, and profile CRUD endpoints.
- `pytest` result: 5 passed in 0.45s.

## Blockers and open questions

None.
