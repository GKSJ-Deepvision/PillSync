# UI wireframes & workflow planning — Milestone 1

Low-fidelity layout plans for the screens Milestone 1 ships. These map
directly onto `frontend/src/features/auth/*`, `frontend/src/features/profile/`
and `frontend/src/pages/*Dashboard.jsx`.

## Sign in / sign up (`AuthLayout`)

Split screen. Left panel (desktop only) is pure brand — the Dose Ring
signature mark plus a short strip of example log lines. Right panel is the
form. Same skeleton for login, register, forgot-password and reset-password;
only the eyebrow/title/subtitle and form fields change.

```
┌──────────────────────────────┬────────────────────────────────┐
│  P  PillSync                 │  ← back link (mobile logo)      │
│                               │                                  │
│         ╭───────╮             │  EYEBROW                        │
│        ╱  Dose   ╲            │  Sign in to your account        │
│       │   Ring    │           │  Pick up right where you left…  │
│        ╲         ╱            │                                  │
│         ╰───────╯             │  [ Email                    ]   │
│                               │  [ Password        Forgot it? ] │
│  "06:40 morning dose logged"  │                                  │
│  "13:15 caregiver notified"   │  [        Sign in        ]      │
│  "21:00 night reminder sent"  │  ───────────── or ─────────────  │
│                               │  [ 🟦 Continue with Google ]     │
│                               │                                  │
│                               │  New to PillSync? Create account│
└──────────────────────────────┴────────────────────────────────┘
```

Register swaps the single form for a **role picker (Patient / Caregiver)**
above the fields — role is chosen before name/email/password, since it
changes nothing else in the form but drives everything after signup.

## Role-aware dashboard shell (`DashboardLayout`)

One shell, three bodies. Sidebar nav items are the same shape for every
role; only the label set and the main content differ.

```
┌──────────┬──────────────────────────────────────────────────┐
│ P PillSync│  PATIENT                                          │
│           │  Good morning, Priya                              │
│ ◐ Today   │  ┌──────────────┐  ┌──────────────────────────┐  │
│ ◔ Profile │  │   Dose Ring   │  │ Your profile              │  │
│           │  │   0 / 4 today │  │ role · blood group · …    │  │
│           │  └──────────────┘  │ conditions · emergency ctct│  │
│  ⬤ Priya  │                    └──────────────────────────┘  │
│  Patient  │  ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│           │  │Meds M2  │ │Reminders│ │Refills M3│             │
│  Sign out │  └─────────┘ └─────────┘ └─────────┘             │
└──────────┴──────────────────────────────────────────────────┘
```

- **Patient** → Dose Ring (today's 4 windows) + profile summary + upcoming
  module teasers.
- **Caregiver** → list of linked patients (via `caregiver_links`, empty
  state until an admin links one) + upcoming module teasers.
- **Admin** → patient/caregiver/admin counts + newest accounts, proving
  read access across every profile via RLS rather than per-row ownership.

## Profile management (`ProfilePage`)

Single form, sectioned, fields conditional on role:

```
Signed in as priya@example.com                         [ patient ]

Basic details
  Full name        Phone
  Date of birth    Blood group   ← patient only

Conditions (patient only)
  [ hypertension, type 2 diabetes                      ]

Emergency contact (patient only)
  Name        Phone        Relation

                                          [ Save changes ]
```

## Workflow: signup → first dashboard view

```
Register (pick role) → Supabase Auth creates the user
        → handle_new_user() trigger inserts profiles row (role, name)
        → email confirmation (if enabled) → Sign in
        → AuthContext loads session + profile
        → ProtectedRoute reads profile.role
        → routes to Patient / Caregiver / Admin dashboard body
```
