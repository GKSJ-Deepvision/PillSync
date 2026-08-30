# Milestone 1 — Backend Initialization, Authentication & Role-Based Access Control

* **Intern:** Ruchitha Puru
* **Branch:** `intern/20-ruchitha-puru`
* **Submitted on:** 30 August 2026

## Evaluation Criteria

| Criterion                                               | Status        | Evidence                             |
| ------------------------------------------------------- | ------------- | ------------------------------------ |
| Backend initialization completed                        | ☑ Done        | `backend/`                           |
| Authentication workflows implemented                    | ☑ Done        | `backend/apps/accounts/`             |
| Role-based access control — Patient / Caregiver / Admin | ☑ Done        | `backend/apps/accounts/`             |
| Database schema finalized                               | ☐ Not my task | Handled by database team             |
| Frontend setup completed                                | ☐ Not my task | Handled by frontend team             |
| User profile management                                 | ☐ Not my task | Outside my assigned Milestone 1 task |
| UI wireframes and workflow planning                     | ☐ Not my task | Handled by frontend/design team      |
| PostgreSQL configured                                   | ☐ Not my task | Handled by database team             |

## What I Built

For Milestone 1, I was responsible for the **backend initialization, authentication, and role-based access control** of the PillSync platform.

I initialized the FastAPI backend according to the repository's existing structure and configured the required backend dependencies and application setup. The backend provides the foundation on which the remaining PillSync modules can be developed in later milestones.

I also implemented the authentication workflow and role-based access control. The system supports the three required user roles — **Patient, Caregiver, and Admin** — and protects backend functionality based on the authenticated user's role.

## 1. Backend Initialization

The following backend setup was completed:

* Initialized the FastAPI backend.
* Followed the existing repository folder structure.
* Configured the backend application.
* Added the required backend dependencies.
* Prepared the backend for API development.
* Ensured the backend passes the project's validation and code-quality checks.

The backend is structured so that additional modules such as medications, reminders, OCR, adherence, refills, notifications, and analytics can be added in later milestones.

## 2. Authentication

The authentication system was implemented as part of the backend.

The authentication workflow provides:

* User registration.
* User login.
* Secure password handling.
* JWT-based authentication.
* Access-token generation.
* Authentication of protected API endpoints.
* Validation of authenticated users.

This ensures that protected resources cannot be accessed without valid authentication.

## 3. Role-Based Access Control

Role-based access control was implemented for the three roles defined in the PillSync specification:

### Patient

Patients can access functionality intended for their own medication-management workflow.

### Caregiver

Caregivers can access functionality intended for monitoring and managing assigned patients.

### Admin

Administrators have access to administrative functionality and system-level operations.

The backend verifies the authenticated user's role before allowing access to role-protected functionality.

Therefore, authentication answers:

> **"Who are you?"**

while RBAC answers:

> **"What are you allowed to access?"**

## 4. Backend Security Flow

The implemented authentication and authorization flow can be represented as:

```text
User
  ↓
Login / Authentication
  ↓
Credentials validated
  ↓
JWT access token generated
  ↓
Client sends token with API request
  ↓
Backend validates JWT
  ↓
User identity retrieved
  ↓
User role checked
  ↓
Patient / Caregiver / Admin authorization
  ↓
Protected resource accessed
```

## How to Run and Verify

From the repository root:

```bash
cd backend
```

Create a virtual environment:

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements/dev.txt
```

Run the backend using the project's FastAPI configuration.

Run the tests:

```powershell
pytest
```

Run the code-quality checks:

```powershell
black .
isort .
ruff check .
```

The backend implementation and tests pass successfully.

## Tests

* **Test files added:** Authentication and RBAC test files under the backend test structure.
* **Authentication tests:** Verify authentication-related functionality and protected access.
* **RBAC tests:** Verify access according to Patient, Caregiver, and Admin roles.
* **`pytest` result:** All tests passing.
* **CI status:** No issues reported.

## My Milestone 1 Contribution

My contribution to Milestone 1 is specifically:

```text
Backend Initialization
        +
Authentication
        +
JWT Authentication
        +
Role-Based Access Control
        |
        ├── Patient
        ├── Caregiver
        └── Admin
```

The backend foundation is now ready for the medication-management and reminder features that will be developed in subsequent milestones.

## Blockers and Open Questions

None.

