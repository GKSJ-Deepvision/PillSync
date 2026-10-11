# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Rajasri Nallamilli (Intern #03)
- **Branch:** intern/03-rajasri-nallamilli
- **Submitted on:** 2026-08-30

---

## Milestone 1 Evaluation Criteria Matrix

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| **Backend initialization completed** | ☑ **Done** | [backend/](file:///c:/Users/rajas/OneDrive/PillSync/backend) — Django 5.0/6.0 + DRF, config/settings/{base,dev,prod}.py, manage.py check clean |
| **Authentication workflows implemented (JWT, OAuth2, sessions, password management)** | ☑ **Done** | [apps/accounts/](file:///c:/Users/rajas/OneDrive/PillSync/backend/apps/accounts) — register, login, refresh, logout+blacklist, Google ID-token exchange, password change/reset |
| **Database schema finalized** | ☑ **Done** | [docs/database/schema.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/database/schema.md), migrations in apps/*/migrations/0001_initial.py |
| **Frontend setup completed** | ☑ **Done** | [frontend/](file:///c:/Users/rajas/OneDrive/PillSync/frontend) — Vite + React 19 + Tailwind 4 + Redux Toolkit; npm run build succeeds |
| **Role-based access control (Patient / Caregiver / Admin)** | ☑ **Done** | [apps/common/permissions.py](file:///c:/Users/rajas/OneDrive/PillSync/backend/apps/common/permissions.py), User.accessible_patient_profiles() |
| **User profile management** | ☑ **Done** | [apps/profiles/](file:///c:/Users/rajas/OneDrive/PillSync/backend/apps/profiles) — patient profiles, family profiles, conditions, emergency contacts |
| **UI wireframes and workflow planning** | ☑ **Done** | [docs/wireframes/wireframes.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/wireframes/wireframes.md), [docs/architecture/WORKFLOW_PLANNING.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/architecture/WORKFLOW_PLANNING.md) |
| **PostgreSQL configured** | ☑ **Done** | config/settings/base.py (DATABASE_URL → POSTGRES_* → SQLite fallback); CI runs the suite against PostgreSQL 16 |

---

## What Was Built

1. **Backend Architecture & System Initialization**:
   - Initialized Django & Django REST Framework application structure with modular settings (`base.py`, `dev.py`, `prod.py`).
   - Dynamic database connection switching supporting `DATABASE_URL`, standard `POSTGRES_*` environment variables, and local `SQLite` fallback.
   - Clean Django check passing with 0 warnings or errors.

2. **Authentication Workflows & Token Management**:
   - Full JWT authentication using SimpleJWT with access token expiration, token refresh, and token blacklist on logout.
   - Session authentication integration alongside JWT headers (`Authorization: Bearer <token>`).
   - Google ID-token OAuth exchange endpoint for federated identity.
   - Secure authenticated password change and token-based password reset workflows.

3. **Role-Based Access Control (RBAC)**:
   - Three distinct roles: `PATIENT`, `CAREGIVER`, and `ADMIN`.
   - Granular DRF permissions in `apps/common/permissions.py` (`IsPatient`, `IsCaregiver`, `IsAdminUserRole`, `IsOwnerOrCaregiver`, `HasPatientProfileAccess`).
   - Model-level access scoping via `User.accessible_patient_profiles()`.

4. **Multi-Profile Healthcare & Profile Management**:
   - Multi-profile support (`Self`, `Spouse`, `Child`, `Parent / Elderly`, `Sibling`, `Other`).
   - Dedicated medical conditions and emergency contact entities with cascade management and primary contact prioritization.

5. **Frontend Architecture & Redux Store**:
   - Vite + React 19 + Tailwind CSS 4 setup with Redux Toolkit auth slice and persistent storage.
   - URL-based role routing (`/patient`, `/caregiver`, `/admin`) allowing seamless role inspection and testing.

6. **Database Schema & UI Wireframe Documentation**:
   - Exhaustive ER diagrams and field specifications in [docs/database/schema.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/database/schema.md).
   - 25-screen layout blueprints, ASCII wireframes, and sequence diagrams in [docs/wireframes/wireframes.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/wireframes/wireframes.md) and [docs/architecture/WORKFLOW_PLANNING.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/architecture/WORKFLOW_PLANNING.md).

---

## How to Run and Verify

```bash
# 1. Backend checks and migrations
cd backend
python manage.py check
python manage.py migrate
python -m pytest

# 2. Code formatting and linting
ruff check .
black --check .
isort --check-only .

# 3. Frontend checks and build
cd ../frontend
npm run lint
npm run build
```
