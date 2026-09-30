# analytics — Module 9: Dashboard & Analytics

## Reference implementation (on `main`)

Dashboards for the three roles, and API latency. Also no tables.

| File | Job |
|---|---|
| `services/dashboard.py` | Patient dashboard, caregiver overview (with an explainable attention score), administrator overview |
| `views.py`, `urls.py` | `/analytics/dashboard/`, `/caregiver/`, `/admin/`, `/performance/` |
| `middleware.py`, `metrics.py` | `Server-Timing` on every response; a rolling in-memory window of the last 5,000 requests by route template |

Dashboard response time is a graded metric: [`docs/reports/performance.md`](../../../docs/reports/performance.md).
Read the history once and compute in memory; a query-count test guards the administrator overview.

---

**Implement here**
- Aggregation endpoints for medicine history and active medicine lists
- Adherence analytics and health consistency reports
- Refill tracking and refill prediction analytics
- Caregiver monitoring reports
- Query optimisation — dashboard response time is a graded performance metric

**Expected files:** `views.py`, `serializers.py`, `urls.py`, `services/aggregations.py`, `tests/`

**Milestone:** 4 (Week 7–8)
