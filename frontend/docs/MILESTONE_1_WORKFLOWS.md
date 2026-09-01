# PillSync Milestone 1 — Workflow Documentation

## Overview

This document explains the primary user workflows implemented in Milestone 1 of the PillSync frontend. Each workflow describes the user's journey through the application, step by step.

---

## Workflow 1: Login → Dashboard

**Description:** A registered user signs in and lands on their role-specific dashboard.

```
1. User navigates to /login
2. User enters email and password
3. Form validation runs (email format, required fields)
4. authService.login() is called (mock: checks against MOCK_USERS)
5. On success: token + user stored in localStorage via AuthContext
6. AuthContext sets isAuthenticated = true, user = { name, email, role }
7. React Router redirects to /dashboard
8. DashboardLayout mounts Navbar + Sidebar + main content
9. AppRoutes resolves /dashboard → DashboardRedirect component
10. DashboardRedirect reads user.role and renders:
    - role === 'patient'   → PatientDashboard
    - role === 'caregiver' → CaregiverDashboard
    - role === 'admin'     → AdminDashboard
```

**Test credentials:**
| Role      | Email                       | Password    |
|-----------|----------------------------|-------------|
| Patient   | patient@pillsync.com       | password123 |
| Caregiver | caregiver@pillsync.com     | password123 |
| Admin     | admin@pillsync.com         | password123 |

---

## Workflow 2: Register → Role Selection → Dashboard

**Description:** A new user creates an account, selects a role, and is redirected to their dashboard.

```
1. User navigates to /register
2. User fills in: Full Name, Email, Phone (optional), Password, Confirm Password
3. User selects one of three role cards: Patient | Caregiver | Admin
4. Form validation runs:
   - Required: name, email, password, confirmPassword, role
   - Email format check
   - Password minimum 6 characters
   - Password match check
5. authService.register() is called (mock: creates new user object)
6. Token + new user stored in localStorage
7. AuthContext updates with new user and role
8. React Router redirects to /dashboard
9. Dashboard renders based on selected role
```

**Role Card Behavior:**
- **Patient** card: Emerald border, Heart icon
- **Caregiver** card: Violet border, Users icon
- **Admin** card: Rose border, Shield icon
- Selected card: highlighted with ring + filled background

---

## Workflow 3: Patient → Profile → Edit Profile

**Description:** A patient views their profile and updates personal information.

```
1. Patient is logged in and on /dashboard
2. Clicks "My Profile" in Navbar dropdown or Sidebar
3. Navigates to /profile → PatientProfile page renders
4. Profile shows: avatar, name, role badge, email, phone, DOB, address
5. Patient clicks "Edit Profile" button
6. Navigates to /profile/edit → EditProfile page renders
7. Form pre-populates with current user data from AuthContext
8. Patient modifies: name, phone, date of birth, address
9. Patient clicks "Save Changes"
10. userService.updateProfile() is called (mock: updates localStorage)
11. AuthContext.updateUserProfile() updates React state
12. Success banner appears: "Profile updated successfully."
13. After 1.2 seconds, redirects back to /profile
14. Profile page now shows updated information
```

---

## Workflow 4: Caregiver → My Patients → Patient Details

**Description:** A caregiver reviews their patient roster and inspects a specific patient's record.

```
1. Caregiver is logged in and on /dashboard (CaregiverDashboard)
2. Dashboard shows patient summary table with statuses
3. Caregiver clicks "My Patients" in Sidebar or "Manage Patient Roster" link
4. Navigates to /patients → MyPatients page renders
5. Displays searchable, filterable table of all assigned patients
6. Caregiver searches by name or email in the search box
7. Caregiver filters by status: "All" | "On Track" | "Needs Attention"
8. Caregiver clicks "Details" button on a specific patient row
9. Navigates to /patients/:id → PatientDetails page renders
10. patientService.fetchPatientDetails(id) is called (mock: returns from MOCK_PATIENTS)
11. Loading spinner shown during fetch
12. Patient details display:
    - Demographics (name, age, DOB, email, phone)
    - Active prescribed medications list
    - Today's hourly schedule timeline
    - Monthly adherence rate (circular stat)
    - Quick actions: Call Patient, Message Patient
13. Caregiver clicks "Back" arrow to return to /patients
```

---

## Workflow 5: Admin → User Management

**Description:** An administrator searches, views, and manages platform user accounts.

```
1. Admin is logged in and on /dashboard (AdminDashboard)
2. Clicks "User Management" in Sidebar
3. Navigates to /users → UserManagement page renders
4. All registered users displayed in a responsive table
5. Admin uses search box to filter by name or email
6. Admin selects role filter: Patient | Caregiver | Admin | All
7. Admin selects status filter: Active | Disabled | All
8. For each user row, three action buttons are available:
   a. "View" → Opens Modal with full user details card
   b. "Edit" → Opens Modal with editable form (placeholder)
   c. Power icon → Opens Modal with disable/enable confirmation
9. On "Disable" confirmation:
   - User status toggles from Active → Disabled (or vice versa)
   - Table updates in real time (React state)
   - Modal closes
10. Admin can navigate to /activity-log for audit history
```

---

## Additional Workflows (Placeholder Features)

These workflows are designed and partially scaffolded, but require Milestone 2 backend integration:

- **Patient → Medicines:** Navigates to `/medicines` → displays placeholder with OCR scanner description
- **Patient → Schedule:** Navigates to `/schedule` → displays calendar placeholder
- **Patient → Adherence:** Navigates to `/adherence` → displays analytics placeholder
- **Caregiver → Alerts:** Navigates to `/alerts` → shows mock alerts with resolve functionality
- **Admin → Activity Log:** Navigates to `/activity-log` → searchable audit table with mock data

---

## Navigation Architecture

### Sidebar Navigation by Role

| Route            | Patient | Caregiver | Admin |
|-----------------|:-------:|:---------:|:-----:|
| /dashboard       |   ✅    |    ✅     |  ✅   |
| /profile         |   ✅    |    ✅     |  ✅   |
| /medicines       |   ✅    |    ❌     |  ❌   |
| /schedule        |   ✅    |    ❌     |  ❌   |
| /adherence       |   ✅    |    ❌     |  ❌   |
| /notifications   |   ✅    |    ❌     |  ❌   |
| /patients        |   ❌    |    ✅     |  ❌   |
| /patients/:id    |   ❌    |    ✅     |  ❌   |
| /alerts          |   ❌    |    ✅     |  ❌   |
| /users           |   ❌    |    ❌     |  ✅   |
| /activity-log    |   ❌    |    ❌     |  ✅   |
| /settings        |   ✅    |    ✅     |  ✅   |
