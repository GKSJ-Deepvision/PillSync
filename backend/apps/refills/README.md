# refills — Module 6: AI Refill Prediction Engine

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
