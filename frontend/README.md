# PillSync — Frontend

React.js single-page app for patients, caregivers and admins.

**Stack (from the project spec):** React.js, Tailwind CSS, Axios, Redux Toolkit or
Context API, Firebase Cloud Messaging for push, Jest + React Testing Library.

## Layout

| Path | Purpose |
|---|---|
| `src/api/` | Axios instance, interceptors, one module per backend resource |
| `src/features/` | One folder per spec module (auth, medications, ocr, reminders, adherence, refills, notifications, analytics, caregiver, admin) |
| `src/components/` | Reusable UI — `common/`, `layout/`, `charts/` |
| `src/pages/` | Route-level screens composed from features |
| `src/routes/` | Router setup and role-protected routes |
| `src/store/` | Redux store and slices (skip if you use Context) |
| `src/context/` | React contexts (auth, theme, notifications) |
| `src/hooks/` | Shared custom hooks |
| `src/utils/` | Formatters, date helpers, validators |
| `src/styles/` | Tailwind entry CSS and design tokens |
| `tests/` | Cross-cutting `unit/` and `integration/` tests |

## Scaffolding (do this once, on your own branch)

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom @reduxjs/toolkit react-redux
npm install -D tailwindcss postcss autoprefixer eslint prettier vitest @testing-library/react @testing-library/jest-dom jsdom
```

Keep the folders above — move the generated files into them rather than starting
a new layout.

## Checks CI will run on your branch

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Define those four scripts in `package.json`. CI skips any script you have not
defined yet, so add them as soon as the tooling is installed.
