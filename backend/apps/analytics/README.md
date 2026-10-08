# Analytics API

`GET /api/analytics/dashboard/` is an authenticated, user-isolated dashboard
endpoint. It aggregates the existing `MedicationHistory`, `Medicine`, `Reminder`,
and `RefillPrediction` records.

Optional `start_date` and `end_date` query parameters use `YYYY-MM-DD` format and
filter history/adherence totals. The response contains:

- `summary`: active medicine, low-stock, scheduled, taken, missed, and adherence totals
- `adherence`: the existing adherence service result, including daily breakdown
- `history`: taken, missed, skipped, and total history counts
- `active_medicines`: medicine quantities, low-stock flags, and stored refill predictions
- `upcoming_reminders`: the next seven days of pending or snoozed reminders

The endpoint delegates adherence calculations to
`apps.adherence.services.calculate_adherence`; it does not duplicate that business
logic. Querysets use ownership filters, aggregation, `select_related`, and bounded
reminder results to avoid exposing cross-user data or loading unbounded dashboard
lists.
