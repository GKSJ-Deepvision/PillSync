# Milestone 4 — Analytics, Testing & Deployment

## Current status

| Criterion | Status | Evidence |
|---|---|---|
| Analytics dashboard API | Done | `GET /api/analytics/dashboard/` |
| Refill and adherence data | Done | Existing adherence service and refill records are aggregated |
| Frontend dashboard integration | Done | Patient dashboard uses the analytics endpoint with a compatibility fallback |
| Caregiver monitoring | Not started | No caregiver-patient relationship exists in the current data model |
| Admin dashboard | Not started | No safe admin API/UI has been added yet |
| Deployment | Not claimed | No deployment was performed in this work session |

## Implemented analytics

The dashboard endpoint enforces ownership through `request.user`, validates date
filters, uses aggregate history counts, selects refill predictions with
`select_related`, and limits upcoming reminders to ten records in the next seven
days. Adherence is calculated by the existing
`apps.adherence.services.calculate_adherence` service.

## Validation

Focused backend analytics tests cover authentication, ownership isolation,
aggregation, low-stock flags, refill prediction data, empty data behavior, and
invalid dates. Frontend dashboard tests cover rendering against the analytics
service response.

Full test counts, coverage, response-time measurements, deployment URLs, and
container status remain unreported until those commands and deployment steps are
actually run.

## Known limitations

The repository does not currently define a caregiver-to-patient relationship, so
caregiver patient monitoring has not been fabricated. Admin endpoints and a
production deployment still require separate implementation and validation.
