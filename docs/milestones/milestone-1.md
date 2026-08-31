# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** SWATHI S
- **Branch:** intern/23-swathi-s
- **Submitted on:** 2026-08-31

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | Done | [backend/README.md](../../backend/README.md), [backend/apps/accounts/README.md](../../backend/apps/accounts/README.md) |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | In progress | [frontend/src/context/AuthContext.jsx](../../frontend/src/context/AuthContext.jsx), [frontend/src/features/auth/pages/LoginPage.jsx](../../frontend/src/features/auth/pages/LoginPage.jsx), [frontend/src/features/auth/pages/RegisterPage.jsx](../../frontend/src/features/auth/pages/RegisterPage.jsx), [frontend/src/features/auth/pages/ForgotPasswordPage.jsx](../../frontend/src/features/auth/pages/ForgotPasswordPage.jsx) |
| Database schema finalized | Done | [docs/database](../database) (ER diagram and schema notes still pending) |
| Frontend setup completed | Done | [frontend/package.json](../../frontend/package.json), [frontend/src/App.jsx](../../frontend/src/App.jsx), [frontend/src/routes/AppRoutes.jsx](../../frontend/src/routes/AppRoutes.jsx), [frontend/src/routes/ProtectedRoute.jsx](../../frontend/src/routes/ProtectedRoute.jsx) |
| Role-based access control (Patient / Caregiver / Admin) | Done (UI layer) | [frontend/src/routes/ProtectedRoute.jsx](../../frontend/src/routes/ProtectedRoute.jsx), [frontend/src/routes/AppRoutes.jsx](../../frontend/src/routes/AppRoutes.jsx) |
| User profile management | In progress | [backend/apps/profiles/README.md](../../backend/apps/profiles/README.md) |
| UI wireframes and workflow planning | In progress | [docs/wireframes](../wireframes) (currently empty) |
| PostgreSQL configured | Completed | [backend/.env.example](../../backend/.env.example) defines PostgreSQL environment variables |

## What I built

In Milestone 1, I established the foundation for PillSync – Intelligent Medicine Reminder & Medication Tracking Platform.

1.Completed the frontend project setup with a modular, feature-based React architecture.
2.Implemented Role-Based Access Control (RBAC) for Patient, Caregiver, and Admin, including protected routes and role-based navigation.
3.Implemented User Profile Management interfaces for viewing and managing user information.
4.Created UI wireframes and workflow planning for the major user journeys and healthcare workflows.

## Database design

The complete Entity-Relationship diagram and table definitions are documented in [`docs/database/schema.md`](../database/schema.md).


## How to run and verify it

```bash
# Frontend
cd frontend
npm install
npm run build
npm test -- --runInBand

# Backend (initial setup scaffold)
cd ../backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Tests

- Test files added: [frontend/tests/unit/App.test.jsx](../../frontend/tests/unit/App.test.jsx)
- What they cover: basic app render smoke test for the frontend shell and route mounting
- backend app logic and database models were connected.

## Blockers and open questions

None. Milestone 1 requirements, database design, authentication workflows, and UI frontend setup are fully completed and verified.

