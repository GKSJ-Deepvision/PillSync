# Milestone 4 â€” Analytics, Testing & Deployment

## Current status

| Criterion | Status | Evidence |
|---|---|---|
| Analytics dashboard API | Done | `GET /api/analytics/dashboard/` |
| Refill and adherence data | Done | Existing adherence service and refill records are aggregated |
| Frontend dashboard integration | Done | Patient dashboard uses the analytics endpoint with a compatibility fallback |
| Caregiver monitoring | Done | Administrator-managed caregiver-patient relationships and scoped caregiver dashboard endpoint |
| Admin dashboard | Not started | No safe admin API/UI has been added yet |
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
for an active authorized relationship. Emergency contacts are not used as
authorization. The repository has no invitation or patient-consent integration,
so assignment approval remains an administrator workflow.

## Validation

Focused backend analytics tests cover authentication, ownership isolation,
aggregation, low-stock flags, refill prediction data, empty data behavior, and
invalid dates, caregiver authorization, and patient scoping. Account tests cover
relationship validation, uniqueness, listing, creation policy, and revocation.
Frontend dashboard tests cover rendering against the analytics service response.

Full test counts, coverage, response-time measurements, deployment URLs, and
container status remain unreported until those commands and deployment steps are
actually run.

## Known limitations

The repository does not include invitation, patient-consent, caregiver
notification, or production deployment workflows. Those remain separate work.
