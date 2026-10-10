# Milestone 4 â€” Analytics, Testing & Deployment

## Current status

| Criterion | Status | Evidence |
|---|---|---|
| Analytics dashboard API | Done | `GET /api/analytics/dashboard/` |
| Refill and adherence data | Done | Existing adherence service and refill records are aggregated |
| Frontend dashboard integration | Done | Patient dashboard uses the analytics endpoint with a compatibility fallback |
| Caregiver monitoring | Done | Administrator-managed caregiver-patient relationships and scoped caregiver dashboard endpoint |
| Admin dashboard | Not implemented | No safe admin user-management, activity-log, or platform-statistics API exists |
| Deployment | Not claimed | No deployment was performed in this work session |

## Implemented analytics

The dashboard endpoint enforces ownership through `request.user`, validates date
filters, uses aggregate history counts, selects refill predictions with
`select_related`, and limits upcoming reminders to ten records in the next seven
days. Adherence is calculated by the existing
`apps.adherence.services.calculate_adherence` service.

Caregiver monitoring uses an explicit `CaregiverPatientRelationship` record.
Administrators create assignments, caregivers can view their own assignments and
revoke them, and caregiver analytics return the existing dashboard contract only
for an active authorized relationship. The frontend now consumes the relationship
list and scoped dashboard endpoints with loading, empty, retryable error, and
revocation-safe states. Emergency contacts are not used as authorization. The
repository has no invitation or patient-consent integration, so assignment
approval remains an administrator workflow.

## Completed in this work session

- Added caregiver dashboard, real “My Patients” list, and patient monitoring pages.
- Added frontend service integration for relationship and caregiver dashboard APIs.
- Displayed authorized adherence, active medication, low-stock, and refill
  prediction data from the existing dashboard response.
- Removed caregiver alert navigation because no caregiver alert API exists.
- Removed fabricated caregiver profile contact, registration, and hospital values.
- Added frontend coverage for assignment loading, empty/error/retry states,
  authorized monitoring, dashboard navigation, and revoked assignments.
- Added backend regression coverage confirming a revoked assignment returns 404.
- Added production settings validation for hosts, PostgreSQL, CSRF origins, secure
  cookies, proxy HTTPS, and HSTS.

## Validation

Backend analytics tests cover authentication, ownership isolation, aggregation,
low-stock flags, refill prediction data, empty data behavior, invalid dates,
caregiver authorization, patient scoping, and revoked assignments. Account tests
cover relationship validation, uniqueness, listing, creation policy, and
revocation. Frontend tests cover patient dashboard rendering, caregiver
assignment loading/empty/error/retry states, authorized monitoring, and
revocation-safe rendering.

Observed validation results:

| Command | Result |
|---|---|
| `backend\.venv\Scripts\python.exe manage.py check` | Passed |
| `backend\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run` | Passed |
| `backend\.venv\Scripts\python.exe -m black --check apps/accounts apps/analytics apps/api` | Passed |
| `backend\.venv\Scripts\python.exe -m isort --check-only apps/accounts apps/analytics apps/api` | Passed |
| `backend\.venv\Scripts\python.exe manage.py test` | Passed — 152 tests |
| `npm test -- --pool=threads --maxWorkers=1` | Passed — 23 tests |
| `npm run lint` | Passed |
| `npm run build` | Passed |

The default parallel `npm test` invocation had 10 passing tests but failed because
three Vitest worker processes timed out during startup on this Windows host; the
single-worker command above completed successfully.

Full test counts, coverage, response-time measurements, deployment URLs, and
container status remain unreported until those commands and deployment steps are
actually run.

## Known limitations

The repository does not include invitation, patient-consent, caregiver
notification/alert APIs, admin user-management/activity-log APIs, or production
deployment workflows. These remain separate work. Admin assignment creation is
available only through the server-protected relationship endpoint; no frontend
form was added because there is no safe API for discovering and managing users.
Emergency-contact status does not grant patient data access.
