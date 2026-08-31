# PillSync — Milestone 1 Wireframes & Workflow Planning

## Auth screens
- **Login** (`/login`) — email/password sign-in, "Continue with Google" OAuth
  button, links to Forgot Password and Register.
- **Register** (`/register`) — full name, email, password, and a role
  selector (patient / caregiver). Admin accounts are not self-serve.
- **Forgot Password** (`/forgot-password`) — email input, sends a Supabase
  reset link.
- **Reset Password** (`/reset-password`) — new password form, landed on from
  the emailed reset link.

## Dashboard shell
A single `/dashboard` route renders a different body component based on the
signed-in user's role (`DashboardPage.jsx` → `PatientDashboard` /
`CaregiverDashboard` / `AdminDashboard`). `ProtectedRoute.jsx` redirects
unauthenticated users to `/login`.

## Profile form
`/profile` — a single form (`ProfilePage.jsx`) with fields shared by every
role (name, phone, date of birth) plus patient-only fields (blood group,
conditions, emergency contact) that only render when `role === "patient"`.

## Signup → dashboard flow
```
Register → Supabase Auth creates user → handle_new_user() trigger
  inserts a profiles row → session established → redirect to /dashboard
  → DashboardPage renders the body for the user's role
```
