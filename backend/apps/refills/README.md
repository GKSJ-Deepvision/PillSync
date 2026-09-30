# refills — Module 6: AI Refill Prediction Engine

## Reference implementation (on `main`)

Predicts when each medicine runs out and warns in time. Design, formulas and worked
examples: [`docs/architecture/ocr-and-refills.md`](../../../docs/architecture/ocr-and-refills.md).
Measured accuracy: [`docs/reports/refill-evaluation.md`](../../../docs/reports/refill-evaluation.md).

| File | Job |
|---|---|
| `engine.py` | Pure functions (no Django): `blend_consumption`, `predict`, `project`. The specification's 60-tablets example is a test |
| `models.py` | `RefillPrediction` (one per medicine, recomputed) and `StockEvent` (the append-only stock ledger) |
| `services/prediction.py` | Reads dose history, stores the forecast, writes the notification text |
| `services/stock.py` | `restock`, `adjust`, `record_initial` — every stock change goes through the ledger |
| `services/alerts.py` | Fires once per level (low, critical, out); resets after a refill |
| `services/backtest.py` | Forecast accuracy from real dose history, in a constant number of queries |
| `views.py`, `tasks.py` | The API; the nightly recompute |

Stock must never be changed except by a dose, `restock` or `adjust`; `PATCH` of `quantity_remaining` is refused.

---

**Implement here**

Inputs: initial medicine quantity, daily dosage frequency, quantity per dose,
missed-dosage history, manual stock updates.

Computes: remaining stock, average daily consumption, estimated depletion date,
recommended refill date.

Features: automatic stock calculation, refill date prediction, low-stock alerts,
refill reminders, caregiver refill notifications, refill analytics.

> Worked example from the spec — 60 tablets at 2/day ⇒ 30 days of supply ⇒
> *"Your BP medicine is expected to finish in 5 days. Please arrange a refill."*

Model/heuristic exploration goes in [`ml/src/refill_prediction`](../../../ml/src/refill_prediction).

**Expected files:** `models.py`, `services/prediction.py`, `tasks.py`, `views.py`, `urls.py`, `tests/`

**Milestone:** 3 (Week 5–6)
