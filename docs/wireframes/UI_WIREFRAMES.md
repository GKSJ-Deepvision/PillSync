# PillSync — Full UI Wireframes & Layout Specification

**Author:** Rajasri Nallamilli (Intern #03)  
**Module Scope:** Milestone 1 — Comprehensive UI Wireframe Architecture  
**Target Platform:** PillSync Intelligent Medicine Reminder & Tracking Platform  
**Primary Color Palette:** Crimson & Ruby Red (`#ED4264`, `#DC143C`)

---

## 1. Executive Summary & Design System

PillSync is an AI-powered healthcare application built for **Patients**, **Caregivers**, and **Administrators**. The UI uses a high-contrast crimson palette (`#ED4264` to `#DC143C`), clear typography, accessible dose intake action buttons (`Taken` / `Snooze` / `Missed`), and dynamic multi-role navigation.

### 1.1 Brand Color Palette & Tokens
```css
:root {
  /* Brand Crimson Primary */
  --primary-crimson: #ED4264;    /* Primary brand gradient start */
  --primary-ruby: #DC143C;       /* Primary brand gradient end / buttons */
  --primary-dark: #b91c1c;       /* Hover states */
  --primary-light: #fff1f2;      /* Light crimson background highlight */
  
  /* Status Colors */
  --status-taken: #16a34a;       /* Green: Dose taken */
  --status-snoozed: #d97706;     /* Amber: Dose snoozed */
  --status-missed: #dc2626;      /* Red: Dose missed / alert */
  --status-pending: #2563eb;     /* Blue: Dose upcoming */

  /* Neutral Surfaces */
  --bg-app: #fcf8f9;            /* Soft warm neutral background */
  --bg-card: #ffffff;           /* Card surface */
  --text-main: #0f172a;         /* High contrast dark text */
  --text-muted: #64748b;        /* Subtitles & metadata */
  --border-color: #f1f5f9;      /* Subtle borders */
}
```

---

## 2. Complete Navigation Architecture

### 2.1 Patient Sidebar Navigation
```
PillSync (Crimson Brand)
├── 🏠 Dashboard
├── 💊 My Medicines
│   ├── All Medicines
│   ├── Add Medicine
│   └── Categories
├── 📅 Schedule
├── 📄 Prescriptions
├── 📊 Adherence
├── 🔄 Refills
├── 📜 History
├── 🔔 Notifications
├── 👤 Profile
├── ⚙ Settings
└── 🚪 Logout
```

### 2.2 Caregiver Sidebar Navigation
```
PillSync Caregiver
├── 🏠 Dashboard
├── 👥 My Patients
├── 💊 Patient Medicines
├── 🔔 Alerts
├── 📊 Adherence Reports
├── 🔄 Refill Alerts
├── 📜 Medication History
├── 👤 Profile
├── ⚙ Settings
└── 🚪 Logout
```

### 2.3 Admin Sidebar Navigation
```
PillSync Admin
├── 🏠 Dashboard
├── 👥 Users
├── 🧑‍⚕️ Caregivers
├── 🔗 Assignments
├── 🔔 Notifications
├── 📊 Analytics
├── ⚙ System Settings
└── 🚪 Logout
```

---

## 3. Public & Authentication Wireframes

### 3.1 Screen 1: Landing Page (`/`)
```
--------------------------------------------------
PillSync                         Login | Register
--------------------------------------------------

        Intelligent Medication Management

   Never miss a dose. Stay on track.

   [ Get Started ]    [ Login ]

--------------------------------------------------
Features

✓ Smart Medicine Reminders
✓ Medication Tracking
✓ AI Refill Prediction
✓ Caregiver Monitoring
✓ Medication Analytics
✓ Prescription / OCR Scanner
--------------------------------------------------
```

### 3.2 Screen 2: Login Page (`/login`)
```
+--------------------------------------------------+
|                     PillSync                     |
|           Sign In to Your Account                |
+--------------------------------------------------+
| Email                                            |
| [ user@example.com                             ] |
| Password                                         |
| [ **************                               ] |
| [x] Remember me              [ Forgot Password? ]|
|                                                  |
| [            LOGIN TO DASHBOARD                ] |
|                                                  |
| ------------------- OR ------------------------- |
| [ G  Continue with Google (OAuth2)             ] |
|                                                  |
| Don't have an account? [ Create Account ]        |
+--------------------------------------------------+
```

### 3.3 Screen 3: Registration Page (`/register`)
```
+--------------------------------------------------+
|               Create PillSync Account            |
+--------------------------------------------------+
| Full Name                                        |
| [ John Doe                                     ] |
| Email                                            |
| [ john@example.com                             ] |
| Phone Number                                     |
| [ +1 (555) 000-0000                            ] |
| Password                                         |
| [ **************                               ] |
| Confirm Password                                 |
| [ **************                               ] |
| Select Role:                                     |
| (•) Patient      ( ) Caregiver                   |
|                                                  |
| [             CREATE ACCOUNT                   ] |
+--------------------------------------------------+
```

### 3.4 Screen 4: Forgot Password Page (`/forgot-password`)
```
+--------------------------------------------------+
|               Forgot Password?                   |
| Enter your registered email to receive a reset   |
| link.                                            |
+--------------------------------------------------+
| Email Address                                    |
| [ user@example.com                             ] |
|                                                  |
| [            SEND RESET LINK                   ] |
|                                                  |
| ← Back to Login                                  |
+--------------------------------------------------+
```

---

## 4. Patient Portal Screen Specifications

### 4.1 Screen 5: Patient Dashboard (`/patient/dashboard`)
```
--------------------------------------------------------
PillSync (#ED4264)        🔔(3)    Profile (Rajasri N.)
--------------------------------------------------------
Good Morning, Rajasri 👋

Today's Medication
--------------------------------------------------------
08:00 AM  💊 Metformin 500mg (1 Tablet)      [ ✓ Taken ]
01:00 PM  💊 Vitamin D (1 Tablet)           [ Mark Taken ]
08:00 PM  💊 BP Medicine (1 Tablet)         [ Mark Taken ]

Adherence Stats          Next Refill Alert      Upcoming Reminder
  86% Adherence          Metformin               08:00 PM BP Med
  Taken: 18 | Missed: 3   5 days remaining
--------------------------------------------------------
```

### 4.2 Screen 6: Patient Profile Management (`/patient/profile`)
```
+--------------------------------------------------+
| Personal Information                             |
| Name: Rajasri Nallamilli  | DOB: 1998-05-14       |
| Phone: +1 555 123 4567   | Email: rajasri@med.com|
| Address: 123 Health Ave, CA                      |
+--------------------------------------------------+
| Healthcare Information                           |
| Medical Conditions: Type 2 Diabetes, Hypertension|
| Allergies: Penicillin                            |
| Emergency Contact: John Nallamilli (+15559876543)|
+--------------------------------------------------+
| Account Settings                                 |
| [ Change Password ]  [ Notification Preferences ] |
| [ Logout ]                                       |
+--------------------------------------------------+
```

### 4.3 Screen 7: My Medicines Page (`/patient/medicines`)
```
My Medicines                               [+ Add Medicine]

Search medicine...

-------------------------------------------------------------------------
Medicine       Dosage    Frequency    Status    Category    Stock   Action
-------------------------------------------------------------------------
Metformin      500 mg    2 / day      Active    Diabetes    10      [Edit] [Del]
Amlodipine     10 mg     1 / day      Active    BP          24      [Edit] [Del]
Vitamin D      1 tablet  Weekly       Active    Vitamins    8       [Edit] [Del]
-------------------------------------------------------------------------
```

### 4.4 Screen 8: Add Medicine Page (Manual & Image Upload) (`/patient/add-medicine`)
```
+-----------------------------------------------------------------------+
| Add New Medicine                                                      |
| [ Method 1: Manual Entry ]    [ Method 2: Upload Image / Prescription]|
+-----------------------------------------------------------------------+
| Method 1: Manual Entry Form                                           |
| Medicine Name: [ Metformin 500mg              ]                       |
| Dosage:        [ 1 Tablet                     ]                       |
| Frequency:     [ Twice Daily                  ]                       |
| Time Slot:     [ 08:00 AM, 08:00 PM           ]                       |
| Condition:     [ Diabetes                     ]                       |
| [ SAVE MEDICINE ]                                                     |
+-----------------------------------------------------------------------+
| Method 2: AI / Prescription OCR Upload                                |
| 📷 Drop prescription scan or photo here                               |
| AI Extracted: Metformin 500mg, 2/day, 30 days count                    |
| [ REVIEW & SAVE SCHEDULE ]                                            |
+-----------------------------------------------------------------------+
```

### 4.5 Screen 9: Medicine Schedule Page (`/patient/schedule`)
```
Today's Schedule

08:00 AM  💊 Metformin 500mg     [ Taken ]  [ Missed ]  [ Snooze ]
01:00 PM  💊 Vitamin D           [ Taken ]  [ Missed ]  [ Snooze ]
08:00 PM  💊 BP Medicine         [ Taken ]  [ Missed ]  [ Snooze ]
```

### 4.6 Screen 10: Reminder Modal UI
```
+--------------------------------------------------+
| 💊 Medication Reminder                           |
| It's time to take:                               |
|                                                  |
| Metformin 500 mg                                 |
| Scheduled: 08:00 AM                              |
|                                                  |
| [ ✓ MEDICINE TAKEN ]                             |
| [ ✕ MEDICINE MISSED ]                            |
| [ ⏰ SNOOZE 15 MINS ]                             |
+--------------------------------------------------+
```

### 4.7 Screen 11: Medication Adherence Page (`/patient/adherence`)
```
Today's Adherence: 86%  (Taken: 18 | Missed: 3)

Weekly Trends
Mon  █████████ (90%)
Tue  ████████  (80%)
Wed  █████████ (95%)
Thu  ███████   (75%)
Fri  █████████ (90%)
Sat  ████████  (85%)
Sun  █████████ (90%)
```

### 4.8 Screen 12: Refill Prediction Page (`/patient/refills`)
```
Refill Prediction Engine

Metformin 500mg
---------------------------------------------------
Current Stock:       10 tablets
Daily Consumption:   2 tablets/day
Estimated Depletion: 5 days (Sep 4, 2026)
Recommended Refill:  In 3 days (Sep 2, 2026)
Status:              ⚠ LOW STOCK WARNING

[ + Add Stock ]  [ Order Refill Medicine ]
---------------------------------------------------
```

### 4.9 Screen 13: Disease-Based Organization Page (`/patient/categories`)
```
Medicine Categories

❤️ Blood Pressure (2 Medicines)
🩸 Diabetes (1 Medicine)
🦋 Thyroid (0 Medicines)
💊 Antibiotics (1 Medicine)
🌱 Vitamins (3 Medicines)
❤️ Heart Medications (1 Medicine)
```

### 4.10 Screen 14: Notifications Page (`/patient/notifications`)
```
Notifications

🔴 Missed Dose Alert — You missed your 01:00 PM medicine.
🟡 Refill Warning — Your BP medicine stock will finish in 5 days.
🔵 Prescription Reminder — Prescription #004 expires in 7 days.
🟠 Caregiver Alert — Your caregiver Eleanor has been notified.
```

### 4.11 Screen 15: Medication History Page (`/patient/history`)
```
Medication Intake History           Filter: [ All Dates ▼ ]

Date        Medicine       Scheduled    Status
---------------------------------------------------
Aug 30      Metformin      08:00 AM     ✓ Taken
Aug 30      Vitamin D      01:00 PM     ✕ Missed
Aug 29      Metformin      08:00 AM     ✓ Taken
Aug 29      BP Medicine    08:00 PM     ✓ Taken
```

---

## 5. Caregiver Portal Screen Specifications

### 5.1 Screen 16: Caregiver Dashboard (`/caregiver/dashboard`)
```
Caregiver Dashboard — My Patients

👤 Patient A (Rahul)
Adherence: 92% | Today: 4 Medicines | Missed: 0
[ View Patient Details ]

👤 Patient B (Priya)
Adherence: 76% | Today: 5 Medicines | Missed: 2
⚠ ATTENTION REQUIRED — Missed 01:00 PM Dose
[ View Patient Details ]
```

### 5.2 Screen 17: Caregiver Patient Detail View (`/caregiver/patient/:id`)
```
Patient Details: Rahul

Adherence Rate: 92%
Today's Check:  ✓ Med 1 | ✓ Med 2 | ✕ Med 3 (Missed)
Refill Alerts:  ⚠ Metformin (5 days remaining)

[ View Full History Report ] [ Send Nudge Notification ]
```

---

## 6. Admin Portal Screen Specifications

### 6.1 Screen 18: Admin Dashboard (`/admin/dashboard`)
```
PillSync Admin Dashboard

Total Users: 1,250 | Patients: 1,020 | Caregivers: 180 | Active Medicines: 4,530

Quick Modules:
- User Management
- Caregiver Assignments
- Notification Settings
- Platform Analytics
- System Operations
```

### 6.2 Screen 19: User Management Console (`/admin/users`)
```
User Management                    [ Search User... ]

Name        Role        Status      Action
---------------------------------------------------
Rahul       Patient     Active      [ View / Edit ]
Priya       Caregiver   Active      [ View / Edit ]
Anil        Patient     Blocked     [ Unblock ]
```

### 6.3 Screen 20: System Notification Settings (`/admin/notifications`)
```
System Notification Settings

Channels Enabled:
[x] Push Notifications
[x] Email Alerts (SendGrid)
[ ] SMS Gateway (Twilio)

Alert Categories:
Medicine Reminders          [ ON ]
Missed Dose Alert           [ ON ]
Refill Alert                [ ON ]
Prescription Expiry         [ ON ]
Emergency Caregiver Alert   [ ON ]
```

### 6.4 Screen 21: Prescription Management Console (`/admin/prescriptions`)
```
Prescription Records                 [ + Upload Prescription ]

Prescription #001
Doctor: Dr. Smith | Date: 2026-08-15 | Expiry: 2026-11-15
Medicines: Metformin, Lisinopril
Actions: [ View Document ] [ Download PDF ]
```
