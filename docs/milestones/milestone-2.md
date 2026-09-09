# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Advala Indhu
- **Branch:** intern/01-advala-indhu
- **Submitted on:** 2026-09-09

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management | ☑ Done | `frontend/src/features/medications/MedicationsPage.jsx`, `MedicationForm.jsx` — add, edit, remove medicines with name, dosage, category, notes. |
| Dosage scheduling | ☑ Done | Each medicine stores one or more `reminder_times`; `frontend/src/lib/scheduling.js` converts these into today's scheduled doses. |
| Reminder system with Taken/Missed/Snooze | ☑ Done | `frontend/src/features/reminders/RemindersPage.jsx` — generates today's doses automatically and lets the patient mark each Taken, Missed, or Snoozed (15 min). |
| Medication history | ☑ Done | `frontend/src/features/adherence/HistoryPage.jsx` — last-30-days log plus an adherence percentage. |
| Notification workflows integrated | ☑ Done | `frontend/docs/database/schema-milestone2.sql` — a database trigger creates an in-app notification for the patient (and any accepted-linked caregivers) the moment a dose is marked Missed. `frontend/src/features/notifications/NotificationsPage.jsx` displays and lets the user mark them read. |

## What I built

Built on top of Milestone 1's Supabase foundation, this milestone adds medicine management, dosage scheduling, and reminders. Three new tables: `medications` (one row per medicine a patient tracks, with dosage, category, and an array of reminder times), `dose_logs` (one row per scheduled dose event, with a `pending / taken / missed / snoozed` status), and `notifications` (an in-app feed).

The Reminders page is the core of this milestone: on load, it checks each active medicine's reminder times against today's date and creates any missing `dose_logs` rows for today (idempotent — running it twice doesn't create duplicates). Each dose shows as Upcoming, Due now, or Overdue based on a 30-minute grace window after the scheduled time, and the patient can mark it Taken, Missed, or Snooze it for 15 minutes.

Marking a dose Missed fires a database trigger (`notify_on_missed_dose`) that inserts a notification for the patient and, if they have any caregivers with an accepted link, for each of those caregivers too — this reuses the `caregiver_links` table from Milestone 1 rather than inventing a new relationship.

The scheduling logic (converting reminder times to today's doses, classifying a dose's time-window status, and calculating an adherence percentage) is written as small, pure functions in `frontend/src/lib/scheduling.js`, specifically so it could be unit-tested without touching Supabase or the DOM.

## Database design

Two new tables extend Milestone 1's schema — see `frontend/docs/database/schema-milestone2.sql` for the full DDL, applied on top of `schema.sql`.

| Table | Purpose |
|---|---|
| `medications` | One row per medicine a patient tracks: name, dosage, `reminder_times` (a time array), category, optional quantity-on-hand (for the refill-prediction milestone), notes. |
| `dose_logs` | One row per scheduled dose instance: which medication, which patient, the scheduled timestamp, and a status of `pending / taken / missed / snoozed`. Indexed on `(patient_id, scheduled_for)` for fast "today's doses" queries. |
| `notifications` | In-app feed: recipient, kind, title/body, an optional link back to the medication, and a read flag. |

RLS follows the same pattern as Milestone 1: a patient can read and write only their own `medications` and `dose_logs`; a caregiver can *read* (not write) an accepted-linked patient's medications and dose logs; admins can read everything (`current_user_role()` helper reused from Milestone 1 to avoid the same infinite-recursion issue found and fixed there). Notifications are private to their recipient only.

## How to run and verify it

```bash
cd frontend
npm install

# in the Supabase SQL editor, run (in this order):
#   frontend/docs/database/schema.sql            (Milestone 1, if not already applied)
#   frontend/docs/database/schema-milestone2.sql  (Milestone 2)

npm run dev
# log in as a patient, go to /medications, add a medicine with a reminder time
# go to /reminders, mark a dose Taken / Missed / Snooze
# go to /history to see the adherence percentage
# go to /notifications to see the missed-dose alert (if you marked one Missed)

npm run lint
npm test
npm run build
```

## Tests

- Test files added: `frontend/tests/unit/scheduling.test.js`
- What they cover: `todaysScheduledDoses` (converts reminder-time strings into sorted Date objects for a given day), `doseWindowStatus` (classifies a dose as upcoming / due / overdue relative to now and a grace window), `adherencePercentage` (computes taken-vs-missed percentage, correctly ignoring pending/snoozed doses, and returns null when there's nothing to calculate yet).
- `npm test` result: 3 test files, 13 tests, 0 failed (2 files carried over from Milestone 1, still passing).

## Blockers and open questions

None currently blocking. Same open item as Milestone 1: continuing with Supabase rather than the Django backend for this milestone's data layer — `medications`, `dose_logs`, and `notifications` all live in the same Supabase-managed PostgreSQL database as `profiles`, using the same RLS approach. Flagging again for mentor confirmation on whether/when this should move to Django, since Milestone 2's folder table in the intern guide lists `backend/apps/medications/`, `backend/apps/reminders/`, and `backend/apps/notifications/` as the expected backend locations.