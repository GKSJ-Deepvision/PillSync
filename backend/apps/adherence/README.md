# adherence — Module 5: Medication Adherence Tracking

## Reference implementation (on `main`)

No tables: adherence is computed from `reminders.DoseEvent`, the same rows that drove the reminders.
Definitions and reasoning: [`docs/architecture/ocr-and-refills.md`](../../../docs/architecture/ocr-and-refills.md#3-adherence).

| File | Job |
|---|---|
| `engine.py` | Pure functions: totals, streaks, consistency, trend, missed-dose patterns. Every definition is written at the top of the file |
| `services/reports.py` | Loads doses as plain records; summaries, weekly and monthly reports, CSV |
| `views.py` | `GET /adherence/summary/` and `/adherence/report/` |

Skipped doses are excluded, and "no data" is `null`, never 0% or 100%. The engine is tested against an
independent naive calculation over 300 random histories.

---

**Implement here**
- Dose event log: taken / missed / snoozed, with timestamps
- Daily medication history
- Adherence percentage calculation and consistency tracking
- Weekly and monthly medication reports
- Missed-dosage analysis and adherence trends

**Expected files:** `models.py`, `serializers.py`, `views.py`, `urls.py`, `services/metrics.py`, `tests/`

**Milestone:** 3 (Week 5–6)
