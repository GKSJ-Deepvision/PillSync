# PillSync — Frontend

React.js single-page app for patients, caregivers and admins.

**Stack (from the project spec):** React.js, Tailwind CSS, Axios, Redux Toolkit or
Context API, Firebase Cloud Messaging for push, Jest + React Testing Library.

## Layout

| Path              | Purpose                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/api/`        | Axios instance, interceptors, one module per backend resource                                                                  |
| `src/features/`   | One folder per spec module (auth, medications, ocr, reminders, adherence, refills, notifications, analytics, caregiver, admin) |
| `src/components/` | Reusable UI — `common/`, `layout/`, `charts/`                                                                                  |
| `src/pages/`      | Route-level screens composed from features                                                                                     |
| `src/routes/`     | Router setup and role-protected routes                                                                                         |
| `src/store/`      | Redux store and slices (skip if you use Context)                                                                               |
| `src/context/`    | React contexts (auth, theme, notifications)                                                                                    |
| `src/hooks/`      | Shared custom hooks                                                                                                            |
| `src/utils/`      | Formatters, date helpers, validators                                                                                           |
| `src/styles/`     | Tailwind entry CSS and design tokens                                                                                           |
| `tests/`          | Cross-cutting `unit/` and `integration/` tests                                                                                 |

## Running it

The app is already scaffolded - Vite, React 19, Tailwind 4, Redux Toolkit,
React Router, Axios and Vitest are installed and wired.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000`, so run the backend in
another terminal and there is no CORS to configure.

Add new UI inside the folders above. Feature components live under
`src/features/<module>/`; a page in `src/pages/` should stay a thin route
wrapper that composes them.

## Checks CI will run on your branch

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Define those four scripts in `package.json`. CI skips any script you have not
defined yet, so add them as soon as the tooling is installed.
