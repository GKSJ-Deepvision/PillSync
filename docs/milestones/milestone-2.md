# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Vemula Purna Vijaya Sai Phani Kumar
- **Branch:** intern/22-vemula-purna-vijaya-sai-phani-kumar
- **Submitted on:** 2026-09-01

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☑ Done | `frontend/src/features/medications/` (`MedicationsPage.jsx`, `MedicationFormModal.jsx`, `api.js`) |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `medication_schedules` table (`docs/database/schema_m2_m3.sql`); multi-time + day-of-week editor in `MedicationFormModal.jsx` / `DaysOfWeekPicker.jsx` |
| Reminder scheduling system functional | ☑ Done | `frontend/src/features/reminders/api.js#ensureTodayDoseLogs`, `useTodayDoses.js` |
| Reminder actions: Taken / Missed / Snooze | ☑ Done | `components/dashboard/TodayReminders.jsx`, `features/reminders/api.js` (`markDoseTaken`, `markDoseMissed`, `snoozeDose`) |
| Medication history tracking implemented | ☑ Done | `dose_logs` table; `features/reminders/HistoryPage.jsx` (date range / medicine / status filters) |
| Notification workflows integrated (push / email / SMS) | ☑ Partial — in-app + browser push | `features/reminders/notifications.js` (Web Notification API). Email/SMS not implemented — would need a server-side scheduler + provider (e.g. Supabase Edge Function + Twilio/Resend), out of scope for a client-only app; noted as a follow-up. |
| Multiple patient profiles for families | ☑ Done (inherited from Milestone 1) | `caregiver_links` table + RLS policies already scope every new table (`medications`, `medication_schedules`, `dose_logs`) to a patient with linked-caregiver read access |

## What I built

A full medicine-management and reminder system on top of the Milestone 1 Supabase
schema: patients add medicines (with a searchable reference dataset for
autocomplete), define one or more daily dosage times per medicine, and the app
auto-generates today's doses as reminder cards. Each dose can be marked Taken,
Missed, or Snoozed (which reschedules it and re-arms the browser notification).
Every dose occurrence is persisted permanently in `dose_logs`, which is the
data source for both the History page (Milestone 2) and the Adherence
Dashboard / Refill Alerts (Milestone 3).

## Reminder and notification design

- On every app load, `ensureTodayDoseLogs` looks at each active
  `medication_schedule` and `upsert`s a `dose_logs` row for any schedule due
  today (matched against `days_of_week`), keyed on
  `unique(schedule_id, scheduled_for)` so it's safe to call repeatedly —
  this is what lets a purely client-side app "generate" reminders without a
  cron job.
- `autoMarkMissed` flips any dose still `pending`/`snoozed` more than 60
  minutes past its scheduled time to `missed`, so a day the patient never
  opens the app doesn't leave doses stuck pending forever.
- If the patient grants browser notification permission
  (`notifications.js`), each upcoming dose within the next 6 hours gets a
  `setTimeout`-scheduled native OS notification; snoozing a dose reschedules
  both the in-app card and the notification.
- Delivery failure handling: notification calls are wrapped in try/catch so
  a browser that blocks/throws never crashes the reminder list — the in-app
  card list is always the source of truth and works with notifications off.

## How to run and verify it

```bash
# 1. Apply the schema (after schema.sql from Milestone 1)
#    Supabase Dashboard → SQL Editor → paste docs/database/schema_m2_m3.sql → Run

# 2. Frontend
cd frontend
npm install
npm run dev
# Sign in as a patient → Medicines → "+ Add medicine" → add a schedule
# → Today tab shows the generated reminder → tap Taken/Snooze/Missed
```

## Tests

- Test files added: `frontend/tests/unit/refillPrediction.test.js`,
  `frontend/tests/unit/adherence.test.js`
- What they cover: dose-log-driven adherence math (used by History/Adherence)
  and the refill formula that Medicine Management's stock fields feed into
- `npm test` result: **15/15 passing** (`vitest run`)
- `npm run build` / `npm run lint`: clean (0 errors)

## Blockers and open questions

Email/SMS reminder delivery is stubbed as a documented follow-up (see table
above) — it needs a server-side scheduled job, which this Supabase-only
frontend doesn't have yet. Everything else in this milestone is complete.
