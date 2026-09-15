# PillSync — Frontend

React.js single-page app for patients, caregivers and admins.

**Stack (from the project spec):** React 19 (via Vite), Tailwind CSS v4, Axios.
Redux/Context, routing, and Firebase push are not wired in yet — this milestone
only needed one screen, so they're deferred until a feature actually needs them
(see "Not done yet" below).

## Layout

| Path | Purpose |
|---|---|
| `src/api/` | Axios instance (`client.js`) — base URL from `VITE_API_BASE_URL`, unwraps the backend's `{success, error}` envelope |
| `src/features/` | One folder per spec module. Only `reminders/` exists so far (this milestone's scope) |
| `src/features/reminders/api.js` | Calls into `src/api/client.js` for reminder CRUD + actions |
| `src/features/reminders/hooks/` | `useReminders` — fetch/loading/error state for the list |
| `src/features/reminders/components/` | `CreateReminderForm`, `ReminderCard`, `IdentityBar` |
| `src/features/reminders/frequency.js` | Frequency/weekday labels, time formatting shared by the components |
| `src/pages/` | Route-level screens composed from features (`RemindersPage`) |
| `src/routes/`, `src/store/`, `src/context/` | Still empty — not needed until auth or a second page exists |
| `src/hooks/`, `src/utils/` | Still empty — nothing cross-feature to put here yet |
| `src/styles/` | Tailwind entry CSS (`index.css`) |
| `tests/` | Cross-cutting `unit/` and `integration/` tests — still empty; this milestone's demo wasn't unit-tested (see the milestone report) |

## Running it

```bash
cd frontend
npm install
cp .env.example .env        # defaults to http://localhost:8000/api — fine for local dev
npm run dev                 # http://localhost:5173
```

The backend must be running (see `backend/README.md`) and its `CORS_ALLOWED_ORIGINS`
must include `http://localhost:5173` (it does, by default, in `.env.example`).

No auth or medicine-management UI exists yet, so the Reminders page can't create
its own patient/medicine. Seed one:

```bash
cd backend
python -m scripts.seed_demo
```

Paste the printed User ID and Medicine ID into the two fields at the top of the
page (they're saved to `localStorage` so you don't have to re-paste on reload).

## What this milestone's UI demonstrates

One page (`RemindersPage`): create a reminder (any frequency, including the
multi-time-slot ones), see its computed "next due" time, and log Taken / Missed
/ Snooze against it — the list re-fetches and reflects the change immediately
(a fresh snooze countdown, a reminder dropping off once deactivated, etc).

## Not done yet

- **Auth / login** — every request still takes an explicit `user_id`, entered
  by hand in `IdentityBar`. Once Milestone 1's auth work lands, this becomes a
  real login screen and the IDs come from a token instead.
- **Medicine management UI** — there's no screen to create a medicine yet
  (this demo relies on the seed script for that), since medicine CRUD wasn't
  part of this slice's backend scope either.
- **Router / multiple pages** — only one screen exists, so `react-router-dom`
  is installed but not wired up yet.
- **Tests** — `tests/` is still empty. `vitest` + `@testing-library/react`
  aren't installed; add them when the frontend picks up enough surface area to
  justify component tests (right now it's one page against a well-tested API).

## Checks CI will run on your branch

```bash
npm run lint
npm run build
```

`format:check` and `test` scripts aren't defined yet (see "Not done yet" above)
— CI skips scripts that don't exist in `package.json`, so add them once
prettier/vitest are actually in use.
