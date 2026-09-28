# M1 - Requirements, Database Design & Core Setup (Week 1–2)

## Objective

Establish the backend foundation for PillSync: define the initial architecture and data schema, configure Django with Django REST Framework and PostgreSQL, and provide the first authenticated API surface.

## Work completed

- Documented the initial repository structure, requirements, database schema, and backend architecture.
- Set up the Django project, Django REST Framework, environment-based settings, and backend tooling.
- Configured the development database for PostgreSQL and added the PostgreSQL driver and database settings.
- Established the core Django project and app structure, including the configuration, accounts, profiles, medicines, and API modules.
- Added a custom user model with Patient, Caregiver, and Admin roles, unique email addresses, and profile support.
- Implemented registration, JWT login, JWT refresh, authenticated user details, and profile read/update endpoints.
- Added the initial models and migrations used by the backend schema.
- Added the `/api/` URL root and initial health, authentication, profile, and API routing.
- Added backend tests and configured CI/code-quality checks for Ruff, Black, isort, Django checks, and pytest.

## APIs/features implemented

- `GET /api/health/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`
- `GET` and `PUT /api/profile/`

## Database/models introduced

- Custom `accounts.User` model with role choices and a unique email field.
- `profiles.Profile` model linked one-to-one with the user and containing contact and emergency-contact fields.
- Initial Django migrations and database schema documentation for the backend foundation.

## Testing and validation

- Django and pytest tests were added for accounts, API behavior, medicines, and profiles.
- API tests cover registration, authentication, permissions, profile behavior, health checks, and core API responses.
- CI runs Ruff, Black, isort, Django system checks, and pytest with coverage reporting.
- The repository contains configuration for all four tools and CI validation; this report does not claim a new local run result.

## Git/branch and development workflow

Milestone 1 backend work was completed in the repository history by the commit titled `feat: complete milestone 1 backend APIs and tests` (`44daaf0`). Development uses intern branches; the current branch is `intern/12-dushyant-singh-sisodiya`. Pushes trigger the repository CI workflow, which validates structure, secrets, formatting, linting, imports, Django checks, and tests.

## Final outcome/status

Milestone 1 backend setup is complete. PillSync has a Django/DRF foundation, PostgreSQL configuration, role-aware user authentication with JWT, initial schema migrations, core routing, tests, and automated quality checks.
