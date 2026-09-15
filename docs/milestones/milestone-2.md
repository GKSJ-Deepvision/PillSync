# Milestone 2 — Medication Management & Reminder System (Week 3–4)

- **Intern:** Karthika Shree S
- **Branch:** intern/14-karthika-shree-s
- **Submitted on:** 2026-09-15

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| Medicine management operational | ☐ Not started | Out of scope for this slice — I picked reminder scheduling and reminder actions from Milestone 2's task list; medicine CRUD, OCR-backed entry and disease grouping are not part of this submission |
| Dosage scheduling (morning / afternoon / night, repeats) | ☑ Done | `ReminderCreate` in `backend/apps/reminders/schemas.py` — a single request with `times: [...]` creates one `Reminder` row per time-of-day slot |
| Reminder scheduling system functional | ☑ Done | `backend/apps/reminders/routes.py`, `services.py`, `scheduling.py` — CRUD + "next scheduled occurrence" |
| Reminder actions: Taken / Missed / Snooze | ☑ Done | `POST /api/v1/reminders/{id}/actions` in `routes.py`, backed by `apps/adherence/schemas.py` and `apps/adherence/models.py` (Milestone 1) |
| Medication history tracking implemented | ☐ Not started | Reading back the `AdherenceLog` trail as history/adherence % is Milestone 3's `apps/adherence` scope per its own README |
| Notification workflows integrated (push / email / SMS) | ☐ Not started | Out of scope for this slice — no dispatcher exists yet to *act* on `next_occurrence`; this milestone only computes it |
| Multiple patient profiles for families | ☐ Not started | Carried over from Milestone 1 (also not started there) |

**Scope note:** of Milestone 2's full task list, this submission covers exactly two
items — *reminder scheduling* and *reminder actions* — end to end, verified against
a real PostgreSQL instance. Medicine management, notification delivery, and
multi-patient profiles are explicitly not part of this slice; see "What's
explicitly not done" below.

## What I built

Two endpoint groups on top of Milestone 1's existing `Reminder` and
`AdherenceLog` models (I didn't redesign either — see the schema note below for
the one addition I did need):

**Reminder scheduling** (`apps/reminders/`) — `POST/GET/PATCH /api/v1/reminders`
plus `POST /api/v1/reminders/{id}/deactivate`. Creating a reminder takes a
`frequency` and a list of `times`; the list's required length depends on the
frequency (`TWICE_DAILY` needs exactly 2, `THREE_TIMES_DAILY` needs 3, everything
else needs 1), and each entry becomes its own `Reminder` row. That's what exposes
the spec's "morning / afternoon / night" wording at the API level without
storing more than one time-of-day per row: a twice-daily medicine is two rows
sharing a frequency, not one row holding two times.

Every reminder read includes a computed `next_occurrence` — not stored, worked
out fresh each time by `apps/reminders/scheduling.py`'s
`compute_next_occurrence()`, a pure function of the reminder's own fields plus
"now". `ONCE_DAILY`/`TWICE_DAILY`/`THREE_TIMES_DAILY` recur daily at their own
`scheduled_time`; `WEEKLY` recurs on `day_of_week`; `CUSTOM` recurs every
`interval_days` from the reminder's `created_at`; `AS_NEEDED` has no fixed
recurrence at all (`next_occurrence` is `null` unless a snooze is pending). This
is deliberately side-effect-free so a later milestone's notification dispatcher
can call it directly instead of duplicating the recurrence rules.

**Reminder actions** (`apps/adherence/` schemas, `apps/reminders/routes.py`
endpoint) — `POST /api/v1/reminders/{id}/actions` with
`{"action": "TAKEN" | "MISSED" | "SNOOZE"}`. Every call inserts a new
`AdherenceLog` row (it's an event log, not a status field — a reminder can be
snoozed three times and taken once, and all four events should be visible later).
Taken and Missed both clear any pending `snoozed_until` on the reminder; Snooze
sets it to `now + snooze_minutes` (default 10) and leaves the reminder active so
it's still due again at that time — `next_occurrence` reflects this immediately
on the next `GET`.

## Schema change: was something actually missing?

Checked before touching anything, per the brief. `AdherenceLog` already covers
Taken/Missed/Snoozed as-is (`AdherenceStatus` in `apps/common/enums.py` already
had all three) — no migration needed there.

`Reminder` did need one: nothing on it could represent a pending snooze, so a
snoozed reminder's `next_occurrence` had nowhere to be stored or overridden.
I added `snoozed_until` (nullable timestamp). While in there, `WEEKLY` and
`CUSTOM` recurrence also had no fields to compute a real next occurrence from —
without something to anchor them, "next scheduled occurrence" would only ever
be answerable for the daily frequencies, which is most of the point of this
slice. Added `day_of_week` (nullable int, only meaningful for `WEEKLY`) and
`interval_days` (nullable int, only meaningful for `CUSTOM`) in the same
migration. No new Postgres ENUM type was introduced this time, so — unlike
Milestone 1's migration — `downgrade()` doesn't need the explicit
`sa.Enum(...).drop()` calls; I left a comment in the migration file saying so,
so the next person doesn't wonder if I forgot them.

## Three more bugs found and fixed

Verifying "for real" (see below) surfaced three latent issues, none introduced
by this slice's own code but all found while exercising it:

1. **Milestone 1's initial migration was silently never running.** Its file was
   saved as `...caregiver_.pr` instead of `...caregiver_.py`. Alembic only
   discovers `.py` files in `alembic/versions/`, so `alembic upgrade head` on a
   clean checkout did nothing — `alembic_version` was created with no revision
   stamped, and none of the seven Milestone 1 tables existed. I only caught this
   because I ran the actual command against a fresh Postgres instance rather than
   assuming the prior milestone's own "verified" claim covered a clean clone.
   Fixed by renaming the file; re-verified the full up/down/up cycle afterward.
2. **The app never imported `apps.common.model_registry` at runtime.** Only
   `alembic/env.py` and `tests/conftest.py` imported it, so SQLAlchemy's
   mapper configuration for cross-app relationships (e.g.
   `Medicine.refill_logs: Mapped[list["RefillLog"]]`) never ran outside those two
   contexts. The very first real HTTP request that touched such a relationship —
   `POST /api/v1/reminders`, which loads a `Medicine` — raised
   `InvalidRequestError: ... failed to locate a name`. Fixed with a one-line,
   side-effecting import in `config/main.py`.
3. **A validation `ValueError` (e.g. "TWICE_DAILY requires exactly 2 entries in
   'times'") returned 500 instead of 422.** `config/exceptions.py`'s
   `validation_exception_handler` passed `exc.errors()` straight into
   `JSONResponse`, but pydantic's error payload can carry the raw exception
   object in `ctx.error` when a `model_validator` raises `ValueError` — plain
   `json.dumps` can't serialize that. Fixed by routing it through
   `fastapi.encoders.jsonable_encoder`, the same thing FastAPI's own default
   handler does.

A fourth issue was in the test suite itself, not the app — see "Tests" below.

## How to run and verify it

```bash
# 1. Start Postgres (and redis), or point backend/.env at your own instance.
cp backend/.env.example backend/.env   # then fill in a real SECRET_KEY
docker compose up --build db redis

# 2. Install dependencies and apply migrations (includes this milestone's).
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements/dev.txt
alembic upgrade head

# 3. Run the app.
uvicorn config.main:app --reload

# 4. Seed a user + medicine to exercise the new endpoints against (no auth yet,
#    so these are just rows you can insert directly, or via psql):
#    INSERT INTO users (...) VALUES (...);
#    INSERT INTO medicines (user_id, name, ...) VALUES (...);

# 5. Create a twice-daily reminder and see the generated schedule:
curl -X POST http://localhost:8000/api/v1/reminders \
  -H "Content-Type: application/json" \
  -d '{"medicine_id": "<id>", "user_id": "<id>", "frequency": "TWICE_DAILY", "times": ["08:00:00", "20:00:00"]}'

# 6. Snooze one of them and confirm next_occurrence updates:
curl -X POST http://localhost:8000/api/v1/reminders/<reminder_id>/actions \
  -H "Content-Type: application/json" -d '{"action": "SNOOZE", "snooze_minutes": 15}'
curl http://localhost:8000/api/v1/reminders/<reminder_id>   # snoozed_until == next_occurrence

# 7. Round-trip this milestone's migration to confirm it's reversible.
alembic downgrade -1
alembic upgrade head
```

Verified live against a running server backed by a real Postgres instance (not
SQLite): created ONCE_DAILY/TWICE_DAILY/WEEKLY/CUSTOM/AS_NEEDED reminders;
confirmed `next_occurrence` for each; hit all three validation failures
(wrong `times` count, missing `day_of_week`, missing `interval_days`) and got
422s with clear messages; created a reminder for a medicine belonging to a
different user and got a 404; ran Taken, Missed, and Snooze actions and
confirmed the resulting `AdherenceLog` rows and the reminder's `snoozed_until`;
confirmed Taken clears a pending snooze; updated and deactivated a reminder and
confirmed a deactivated reminder's `next_occurrence` goes to `null`; restarted
Postgres mid-session and confirmed data survived (it's on a real volume, not
memory).

## Tests

- **Test files added:** `backend/apps/reminders/tests/test_scheduling.py`,
  `backend/tests/integration/test_reminders.py`
- **Test files modified:** `backend/tests/conftest.py` (see bug #4 below —
  behavior fix, not new coverage)
- **What they cover:**
  - **Unit** (`test_scheduling.py`, 16 tests) — `compute_next_occurrence()` in
    isolation, with `now` always passed explicitly so results are deterministic:
    all three daily frequencies recurring today vs. rolling to tomorrow, the
    "due at exactly now still rolls forward" edge case (so a polling dispatcher
    can't double-fire), `WEEKLY` with an explicit `day_of_week` vs. falling back
    to `created_at`'s weekday vs. rolling to next week, `CUSTOM`'s
    every-N-days cycle including the "before the first anchor" edge case and the
    missing-`interval_days` default, `AS_NEEDED` having no occurrence on its
    own, and — across several tests — a pending snooze overriding the normal
    recurrence (even for `AS_NEEDED`) while an already-expired snooze is
    correctly ignored.
  - **Integration** (`test_reminders.py`, 15 tests) — over the real app and a
    real Postgres connection (a fixture creates and tears down a throwaway
    `User`+`Medicine` per test via `ON DELETE CASCADE`, not a shared fixture):
    creating a `ONCE_DAILY` reminder, creating a `TWICE_DAILY` reminder as two
    rows, all three create-time validation failures returning 422 with the
    standard error envelope, creating a reminder against a medicine that
    isn't the given user's returning 404, listing filtered by user+medicine,
    404 on an unknown reminder, updating `scheduled_time`, deactivating and
    confirming `next_occurrence` clears, Taken/Missed/Snooze each creating the
    right `AdherenceLog`, Snooze setting `snoozed_until` (and `next_occurrence`
    matching it) on the next read, Taken clearing a prior snooze, and 404 on
    an action against an unknown reminder.
- **`pytest` result:** 44 passed (16 new scheduling unit tests + 20 new/adjusted
  integration tests + 8 Milestone 1 model tests carried forward). 85% line
  coverage on the touched apps. `ruff check`, `black --check`, and
  `isort --check-only` all pass clean; the OpenAPI schema serves all six new
  routes with no generation warnings.
- **Bug #4, found while writing these tests:** the second integration test
  that touched the database in the same `pytest` run failed with
  `RuntimeError: Event loop is closed` (or an asyncpg protocol-state error,
  depending on timing) — pytest-asyncio gives every test function its own
  event loop by default, but the app's async engine is a module-level
  singleton, and an asyncpg connection can't outlive the loop it was opened
  on. This was invisible before because exactly one integration test in the
  whole repo touched the database (`test_health.py`'s `test_database_health`);
  Milestone 2 is the first slice to need more than one. Fixed by disposing the
  engine's connection pool at the end of the `client` fixture in
  `tests/conftest.py`, forcing a fresh connection (bound to whatever loop is
  current) the next time it's needed, instead of reusing one tied to a loop
  that's about to close.

## Blockers and open questions

None blocking. Three notes:

1. **`next_occurrence` is computed in UTC, not the patient's local time.**
   `UserProfile` already has a `timezone` field from Milestone 1, but
   converting a `scheduled_time` like "08:00" into a specific patient's wall
   clock is realistically the notification dispatcher's problem, not the
   scheduling API's — whichever milestone builds that dispatcher should decide
   where that conversion happens rather than have it baked into this endpoint's
   response shape now.
2. **No delivery/dispatch exists yet.** This milestone computes "when is this
   reminder next due" but nothing acts on it — no push/email/SMS, no background
   job polling `next_occurrence`. That's explicitly Milestone 2's "Notification
   workflows" line item, which I didn't pick up in this slice.
3. **No auth.** Every endpoint takes `user_id`/`medicine_id` explicitly, exactly
   as Milestone 1 left things — anyone can currently manage anyone's reminders.
   Wrapping these in real auth/RBAC is still Milestone 1's not-started item,
   and every one of this milestone's endpoints will need an owner-matches-token
   check added once that lands.
