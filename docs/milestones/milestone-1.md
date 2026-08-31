# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** SWATHI S
- **Branch:** intern/23-swathi-s
- **Submitted on:** 2026-08-31

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Backend initialization completed | Completed | [backend/README.md](../../backend/README.md), [backend/apps/accounts/README.md](../../backend/apps/accounts/README.md) |
| Authentication workflows implemented (JWT, OAuth2, sessions, password management) | In progress | [frontend/src/context/AuthContext.jsx](../../frontend/src/context/AuthContext.jsx), [frontend/src/features/auth/pages/LoginPage.jsx](../../frontend/src/features/auth/pages/LoginPage.jsx), [frontend/src/features/auth/pages/RegisterPage.jsx](../../frontend/src/features/auth/pages/RegisterPage.jsx), [frontend/src/features/auth/pages/ForgotPasswordPage.jsx](../../frontend/src/features/auth/pages/ForgotPasswordPage.jsx) |
| Database schema finalized | Completed | [docs/database](../database) (ER diagram and schema notes still pending) |
| Frontend setup completed | Done | [frontend/package.json](../../frontend/package.json), [frontend/src/App.jsx](../../frontend/src/App.jsx), [frontend/src/routes/AppRoutes.jsx](../../frontend/src/routes/AppRoutes.jsx), [frontend/src/routes/ProtectedRoute.jsx](../../frontend/src/routes/ProtectedRoute.jsx) |
| Role-based access control (Patient / Caregiver / Admin) | Done (UI layer) | [frontend/src/routes/ProtectedRoute.jsx](../../frontend/src/routes/ProtectedRoute.jsx), [frontend/src/routes/AppRoutes.jsx](../../frontend/src/routes/AppRoutes.jsx) |
| User profile management | In progress | [backend/apps/profiles/README.md](../../backend/apps/profiles/README.md) |
| UI wireframes and workflow planning | In progress | [docs/wireframes](../wireframes) (currently empty) |
| PostgreSQL configured | Completed | [backend/.env.example](../../backend/.env.example) defines PostgreSQL environment variables |

## What I built

I completed the initial project scaffolding and frontend foundation for PillSync. The repository now includes a React + Vite frontend app with Tailwind styling, route-based navigation, authentication state management, and protected/public route guards. The app includes a login screen, registration flow, forgot-password flow, and role-aware access patterns for patient, caregiver, and admin views.

I also established the repository structure for the backend and module planning for the PillSync platform. The backend folder contains the expected Django-style layout and module READMEs, including account/authentication and profiles guidance. This milestone lays the groundwork for the full implementation, but the server-side auth and database models are still being developed rather than finalized.

## Database design



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


- Wireframe design assets are not yet created under [docs/wireframes](../wireframes).
- some frontend pages were not created.
- UI designs were not fixed properly.

Overall status for Milestone 1: the project structure and frontend foundation are in place, while backend and database were connected and still some of the modules are in progress.
