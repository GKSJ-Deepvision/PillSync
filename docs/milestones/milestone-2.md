# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Syed Muhammed S R
- **Branch:** intern/19-syed-muhammed-s-r
- **Submitted on:** 2026-09-28

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☑ Done | `apps/medications/models.py` — `Medicine` model; `apps/medications/views.py` — `MedicineViewSet` |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `apps/medications/models.py` — `MedicationSchedule` with `DoseSlot`, `ScheduleFrequency`; `occurs_on()` / `next_occurrence()` logic |
| Reminder scheduling system functional | ☑ Done | `MedicationSchedule.reminder_enabled`, `remind_minutes_before`; `apps/medications/services/scheduling.py` |
| Reminder actions: Taken / Missed / Snooze | ☑ Done | `apps/adherence/models.py` — `DoseEvent.Status` choices: `taken`, `missed`, `snoozed`; `apps/adherence/views.py` — PATCH endpoint records `acted_at` |
| Medication history tracking implemented | ☑ Done | `apps/adherence/views.py` — `/api/adherence/history/` returns per-status counts and `adherence_percentage` |
| Notification workflows integrated (push / email / SMS) | ☐ In progress | `apps/notifications/` scaffolded; push/email/SMS delivery not yet wired end-to-end |
| Multiple patient profiles for families | ☑ Done | `Medicine.patient` FK → `PatientProfile`; all queries filterable by `?patient=<id>` |

## What I built

- **`Medicine` model** — tracks name, brand, dosage form, strength, category, stock (`quantity_remaining`, `low_stock_threshold`), active dates, and patient ownership. Includes `consume()` and `restock()` helpers that guard against negative stock.
- **`Dosage` model** — stores the per-dose amount and unit linked to a medicine.
- **`MedicationSchedule` model** — supports `daily`, `specific_days` (ISO weekday list), and `interval` frequencies; includes reminder toggle and lead-time minutes. `occurs_on(day)` and `next_occurrence()` implement the scheduling logic. A unique constraint prevents duplicate `(medicine, time_of_day, slot)` combinations.
- **`DoseEvent` model** (`apps/adherence`) — records every dose action (taken / missed / snoozed) with timestamps and optional `snoozed_until`.
- **REST API** — `MedicineViewSet`, `DosageViewSet`, `MedicationScheduleViewSet` via DRF `DefaultRouter`; custom `POST /<pk>/schedules/` action; adherence events and history endpoints.
- **Services** — `apps/medications/services/scheduling.py` (`update_stock`); `apps/adherence/services.py` (adherence summary calculator).

## Reminder and notification design

Reminders are schedule-driven: each `MedicationSchedule` carries `reminder_enabled` and `remind_minutes_before` (0–180 min). A background task (to be wired in Milestone 4) would query schedules due within the next window and enqueue notifications.

Dose actions are recorded via `POST /api/adherence/events/`. A `snoozed` event stores `snoozed_until`; a follow-up `PATCH` to the same event updates `status` to `taken` or `missed` and stamps `acted_at`.

Notification delivery channels (`apps/notifications/`) are scaffolded but push/email/SMS are not yet connected end-to-end (blocked on provider credentials).

## How to run and verify it

```bash
# from backend/
python -m pytest apps/medications/tests/ apps/adherence/tests/ -v
```

## Tests

- **Test files added:**
  - `apps/medications/tests/test_medications.py`
  - `apps/medications/tests/test_api.py`
  - `apps/adherence/tests/test_api.py`
- **What they cover:**
  - `test_create_medicine` — ORM creation and field values
  - `test_medicine_stock` — `restock()` / `consume()` / floor-at-zero behaviour
  - `test_medication_schedule` — `occurs_on()` respects start date
  - `test_medicine_api` — `GET /api/medications/medicines/` returns correct listing
  - `test_stock_service` — `update_stock()` service layer, including ValueError on negative input
  - `test_history_records_doses_and_returns_summary` — history endpoint aggregates taken/missed/snoozed and computes `adherence_percentage`
  - `test_event_status_update_records_action_time` — PATCH on a dose event stamps `acted_at`
- **`pytest` result:** 23 passed

## Blockers and open questions

- Notification delivery (push / email / SMS) not yet wired to a provider — deferred to Milestone 4.
