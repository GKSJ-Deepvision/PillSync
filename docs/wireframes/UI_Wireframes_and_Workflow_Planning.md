# PillSync — UI Wireframes and Workflow Planning

## 1. Document Purpose

This document defines the UI wireframes, user workflows, navigation structure, role-based access, and frontend implementation plan for the PillSync Intelligent Medicine Reminder and Medication Tracking Platform.

The purpose of this document is to establish a clear UI and workflow structure before feature-level frontend implementation begins.

This document serves as a reference for the development team to maintain consistency between the project requirements, user workflows, UI design, frontend routes, and future implementation.

---

## 2. Project Overview

PillSync is an intelligent medicine reminder and medication tracking platform designed to help patients manage their medicines, schedules, reminders, medication history, adherence, and refill requirements.

The platform supports three primary user roles:

- Patient
- Caregiver
- Admin

The UI is planned around these roles so that each user receives the features and navigation relevant to their responsibilities.

---

## 3. UI Design Objectives

The PillSync UI will follow the following design objectives:

### 3.1 Simplicity

The application should provide a simple and understandable interface for managing medicines and medication schedules.

### 3.2 Clear Information Hierarchy

Important information such as upcoming medicines, missed doses, adherence status, notifications, and refill alerts should be easy to identify.

### 3.3 Role-Based Navigation

Navigation options should be based on the authenticated user's role.

Patients, caregivers, and administrators should receive different dashboard and navigation experiences according to their responsibilities.

### 3.4 Accessibility

The interface should use:

- Readable typography
- Clear labels
- Appropriate contrast
- Recognizable icons
- Simple navigation
- Clear success and error messages
- Large and understandable action buttons

### 3.5 Consistency

Common UI elements such as buttons, forms, cards, navigation bars, alerts, tables, and modals should follow a consistent design structure across the application.

---

## 4. User Roles

### 4.1 Patient

The patient is the primary user of the medication management features.

The patient should be able to:

- View their dashboard
- Manage medicines
- Add medicines
- Manage medication schedules
- View reminders
- Record medication status
- View medication history
- View adherence information
- View refill information
- Manage their profile
- View notifications

### 4.2 Caregiver

The caregiver is responsible for monitoring assigned patients.

The caregiver should be able to:

- View assigned patients
- Monitor medication status
- View missed-dose alerts
- View refill alerts
- View adherence information
- View patient medication information
- Manage their own profile

### 4.3 Admin

The administrator manages platform-level operations.

The admin should be able to:

- Manage users
- Manage patients
- Manage caregivers
- Assign caregivers to patients
- View platform activity
- View platform analytics
- Manage notification-related configuration
- Manage system-level settings
- Manage their own profile

---

# 5. Screen Inventory

## 5.1 Common Screens

The following screens are shared or relevant to multiple user roles:

1. Welcome / Landing Page
2. Login
3. Registration
4. Forgot Password
5. Reset Password
6. Profile
7. Notifications

## 5.2 Patient Screens

1. Patient Dashboard
2. Medicine Management
3. Add Medicine
4. Medicine Details
5. Medication Schedule
6. Reminder Management
7. Prescription Management
8. Upload Prescription
9. Adherence Dashboard
10. Medication History
11. Refill Prediction

## 5.3 Caregiver Screens

1. Caregiver Dashboard
2. Patient List
3. Patient Details
4. Patient Medication Status
5. Missed Dose Alerts
6. Refill Alerts
7. Adherence Reports

## 5.4 Admin Screens

1. Admin Dashboard
2. User Management
3. Patient Management
4. Caregiver Management
5. Caregiver Assignment
6. Platform Activity
7. Notification Configuration
8. Platform Analytics
9. System Settings

---

# 6. Screen-Level UI Planning

## 6.1 Login Screen

### Purpose

Allow registered users to securely authenticate into the PillSync application.

### Planned Components

- PillSync logo
- Email / username input
- Password input
- Login button
- Forgot Password link
- Registration link
- OAuth login option
- Authentication error message

### Navigation

```text
Login
  |
  v
Authentication
  |
  +---- Failed ----> Error Message
  |
  +---- Successful
             |
             v
          Role Check
             |
       +-----+-----+
       |     |     |
       v     v     v
    Patient Caregiver Admin 
          |       |       |
          v       v       v
     Dashboard Dashboard Dashboard
````markdown
---

## 6.2 Patient Dashboard

### Purpose

Provide the patient with a summary of their current medication-related information.

### Planned Components

* Header
* Navigation sidebar
* Welcome / greeting section
* Today's medications
* Upcoming medications
* Adherence percentage
* Refill alerts
* Notifications
* Recent medication history
* Quick action buttons

---

## 6.3 Medicine Management

### Purpose

Allow patients to view and manage their medicines.

### Planned Components

* Medicine list
* Search
* Filter
* Add Medicine button
* Medicine name
* Dosage
* Frequency
* Quantity
* Start date
* End date
* Medicine status
* View details
* Edit
* Delete

---

## 6.4 Add Medicine

### Purpose

Allow patients to add a medicine through manual entry or image/prescription-based input.

### Planned Components

* Upload medicine image
* Upload prescription
* Manual medicine entry
* Medicine name
* Dosage
* Quantity
* Frequency
* Start date
* End date
* Save button
* Cancel button

### Planned Workflow

```text
Add Medicine
     |
     +-------------------+
     |                   |
     v                   v
Upload Image        Manual Entry
     |                   |
     v                   |
OCR Processing           |
     |                   |
     +---------+---------+
               |
               v
         Review Details
               |
               v
          Confirm Data
               |
               v
       Set Medication
           Schedule
```

---

## 6.5 Medicine Details

### Purpose

Allow patients to view complete information about a selected medicine.

### Planned Components

* Medicine name
* Medicine image
* Dosage
* Frequency
* Quantity
* Start date
* End date
* Medication schedule
* Reminder status
* Current stock
* Refill information
* Edit Medicine button
* Delete Medicine button

### Navigation

```text
Medicine Management
        |
        v
  Select Medicine
        |
        v
  Medicine Details
        |
   +----+----+----+
   |         |    |
   v         v    v
 Edit      Delete Schedule
```

---

## 6.6 Medication Schedule

### Purpose

Allow patients to create and manage schedules for taking their medicines.

### Planned Components

* Calendar view
* Daily medication schedule
* Medicine name
* Dosage
* Medication time
* Frequency
* Start date
* End date
* Add Schedule button
* Edit Schedule
* Delete Schedule
* Schedule status

### Planned Workflow

```text
Medicine Details
       |
       v
Create Schedule
       |
       v
Select Medicine
       |
       v
Set Dosage
       |
       v
Select Date
       |
       v
Select Time
       |
       v
Set Frequency
       |
       v
Save Schedule
       |
       v
Schedule Created
       |
       v
Reminder Generated
```

---

## 6.7 Reminder Management

### Purpose

Allow patients to view and manage reminders generated from their medication schedules.

### Planned Components

* Upcoming reminders
* Medicine name
* Dosage
* Reminder time
* Reminder status
* Notification method
* Snooze option
* Mark as Taken
* Mark as Missed

### Planned Workflow

```text
Medication Schedule
        |
        v
  Reminder Created
        |
        v
  Reminder Triggered
        |
   +----+----+----+
   |         |    |
   v         v    v
 Taken     Missed Snooze
   |         |    |
   |         |    +----> Reminder Again
   |         |
   +---------+
        |
        v
 Medication Record
        |
        v
 Adherence Tracking
```

---

## 6.8 Medication History

### Purpose

Provide patients with a historical record of their medication activity.

### Planned Components

* Medicine name
* Date
* Scheduled time
* Actual action time
* Medication status
* Taken status
* Missed status
* Snoozed status
* Date filter
* Medicine filter
* Medication history list

### Planned Navigation

```text
Patient Dashboard
       |
       v
Medication History
       |
       +----------------+
       |                |
       v                v
 Date Filter      Medicine Filter
       |                |
       +-------+--------+
               |
               v
       Medication Records
```

---

## 6.9 Adherence Dashboard

### Purpose

Provide patients with a visual summary of their medication adherence.

### Planned Components

* Overall adherence percentage
* Daily adherence
* Weekly adherence
* Monthly adherence
* Taken doses
* Missed doses
* Snoozed doses
* Adherence trend
* Medicine-wise adherence
* Medication history
* Adherence summary cards

### Planned Workflow

```text
Reminder
   |
   v
Taken / Missed / Snoozed
   |
   v
Medication Record
   |
   v
Adherence Calculation
   |
   v
Adherence Data
   |
   v
Adherence Dashboard
```

---

## 6.10 Refill Prediction

### Purpose

Display medication stock information and refill-related predictions.

### Planned Components

* Medicine name
* Current stock
* Daily consumption
* Estimated remaining quantity
* Estimated depletion date
* Recommended refill date
* Low-stock warning
* Refill alert
* Refill status

### Planned Workflow

```text
Medicine Added
      |
      v
Initial Quantity
      |
      v
Medication Schedule
      |
      v
Medicine Consumption
      |
      v
Stock Updated
      |
      v
Remaining Quantity
      |
      v
Refill Prediction
      |
      v
Low Stock Detection
      |
      v
Refill Alert
```

---

## 6.11 Notifications

### Purpose

Provide users with important medication and system notifications.

### Planned Components

* Medication reminders
* Missed-dose notifications
* Refill notifications
* System notifications
* Notification timestamp
* Read / unread status
* Mark as Read
* Clear Notification
* Notification priority

### Planned Workflow

```text
System Event
     |
     +------------------+
     |                  |
     v                  v
Medication Event    Refill Event
     |                  |
     +---------+--------+
               |
               v
          Notification
               |
               v
          User Interface
               |
               v
       Read / Unread Status
```

---

## 6.12 Prescription Management

### Purpose

Allow patients to manage prescription-related information and uploaded prescriptions.

### Planned Components

* Prescription list
* Prescription name
* Prescription image / document
* Upload Prescription button
* Prescription date
* Associated medicines
* View Prescription
* Delete Prescription

### Planned Navigation

```text
Patient Dashboard
       |
       v
Prescription Management
       |
       +------------------+
       |                  |
       v                  v
Upload Prescription   Select Prescription
       |                  |
       v                  v
Prescription Details  View Prescription
```

---

## 6.13 Upload Prescription

### Purpose

Allow patients to upload a prescription that can later be processed for medicine information.

### Planned Components

* Upload area
* File selection
* Image preview
* Prescription preview
* Upload button
* Cancel button
* Processing status
* Error message

### Planned Workflow

```text
Upload Prescription
        |
        v
    Select File
        |
        v
    Preview File
        |
        v
      Upload
        |
        v
    Processing
        |
        v
Prescription Stored
        |
        v
Medicine Information
    Extraction
```

---

## 6.14 Profile Screen

### Purpose

Allow authenticated users to view and manage their profile information.

### Planned Components

* Profile picture
* Full name
* Email
* Phone number
* User role
* Profile information
* Edit Profile button
* Change Password button
* Logout button

### Planned Navigation

```text
Dashboard
    |
    v
 Profile
    |
    +----------------+
    |                |
    v                v
Edit Profile    Change Password
```

```
```


# 7. User Workflows

## 7.1 Patient Workflow

The patient workflow describes the complete journey from authentication to medication management and monitoring.

```text
                         Login
                           |
                           v
                  Authentication
                           |
                           v
                  Patient Dashboard
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
    Medicines           Schedule        Notifications
        |
        v
  Add Medicine
        |
        +-----------------------+
        |                       |
        v                       v
 Manual Entry             Upload Image
                                |
                                v
                         OCR Processing
                                |
                                v
                         Review Details
                                |
        +-----------------------+
        |
        v
  Medicine Details
        |
        v
  Set Medication
     Schedule
        |
        v
 Reminder Generated
        |
        v
 Reminder Triggered
        |
   +----+----+----+
   |         |    |
   v         v    v
 Taken     Missed Snooze
   |         |    |
   +---------+----+
             |
             v
    Medication History
             |
             v
    Adherence Calculation
             |
             v
     Adherence Dashboard
             |
             v
      Stock Calculation
             |
             v
      Refill Prediction
             |
             v
        Refill Alert
```

---

## 7.2 Caregiver Workflow

The caregiver workflow focuses on monitoring patients assigned to the caregiver.

```text
                         Login
                           |
                           v
                 Caregiver Dashboard
                           |
                           v
                    Assigned Patients
                           |
                           v
                     Select Patient
                           |
                           v
                    Patient Details
                           |
              +------------+------------+
              |            |            |
              v            v            v
         Medications   Adherence      Alerts
              |            |            |
              |            |       +----+----+
              |            |       |         |
              |            |       v         v
              |            |    Missed     Refill
              |            |     Dose       Alert
              |            |       |         |
              +------------+-------+---------+
                           |
                           v
                   Patient Monitoring
```

### Caregiver Monitoring Flow

```text
Patient
   |
   v
Medication Schedule
   |
   v
Medication Reminder
   |
   +------------------+
   |                  |
   v                  v
Medication Taken   Medication Missed
                        |
                        v
                 Missed Dose Alert
                        |
                        v
                    Caregiver
```

---

## 7.3 Admin Workflow

The admin workflow focuses on platform-level management.

```text
                         Login
                           |
                           v
                    Admin Dashboard
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
     User Management   Analytics       Activity
          |
     +----+----+
     |         |
     v         v
 Patients   Caregivers
                |
                v
        Caregiver Assignment
                |
                v
        Patient Monitoring
```

---

# 8. Core Medication Workflows

## 8.1 Medicine → Schedule → Reminder → Medication Status → Adherence

This is the primary medication workflow of the PillSync application.

```text
Add Medicine
     |
     v
Medicine Details
     |
     v
Set Dosage
     |
     v
Set Schedule
     |
     v
Create Reminder
     |
     v
Reminder Triggered
     |
     +-------------+-------------+
     |             |             |
     v             v             v
   Taken         Missed        Snooze
     |             |             |
     +-------------+-------------+
                   |
                   v
          Medication Record
                   |
                   v
          Adherence Calculation
                   |
                   v
          Adherence Dashboard
```

---

## 8.2 Medicine Stock → Refill Prediction → Refill Alert

```text
Medicine Added
      |
      v
Initial Quantity
      |
      v
Medication Schedule
      |
      v
Medicine Consumption
      |
      v
Stock Calculation
      |
      v
Remaining Quantity
      |
      v
Estimated Depletion
      |
      v
Refill Prediction
      |
      v
Low Stock Detection
      |
      v
Refill Alert
      |
      +-------------+
      |             |
      v             v
   Patient       Caregiver
```

---

# 9. Authentication and Role Routing

The authentication workflow determines the appropriate dashboard based on the authenticated user's role.

```text
                    Login
                      |
                      v
               Authentication
                      |
                      v
                Authenticated
                      |
                      v
                  Role Check
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       PATIENT    CAREGIVER     ADMIN
          |           |           |
          v           v           v
       Patient    Caregiver     Admin
      Dashboard   Dashboard    Dashboard
```

### Authentication Failure

```text
Login
  |
  v
Authentication
  |
  +---- Failed
  |       |
  |       v
  |   Error Message
  |
  +---- Successful
          |
          v
       Role Check
```

The frontend will provide appropriate feedback when authentication fails.

Backend authentication and authorization remain the primary security mechanisms.

---

# 10. Navigation Structure

The planned navigation hierarchy is:

```text
PillSync
|
+-- Authentication
|   +-- Login
|   +-- Registration
|   +-- Forgot Password
|   +-- Reset Password
|
+-- Patient
|   +-- Dashboard
|   +-- Medicines
|   +-- Add Medicine
|   +-- Medicine Details
|   +-- Schedule
|   +-- Reminders
|   +-- History
|   +-- Adherence
|   +-- Refills
|   +-- Prescriptions
|   +-- Notifications
|   +-- Profile
|
+-- Caregiver
|   +-- Dashboard
|   +-- Patients
|   +-- Patient Details
|   +-- Medication Status
|   +-- Alerts
|   +-- Reports
|   +-- Notifications
|   +-- Profile
|
+-- Admin
    +-- Dashboard
    +-- Users
    +-- Patients
    +-- Caregivers
    +-- Assignments
    +-- Activity
    +-- Analytics
    +-- Notifications
    +-- Settings
    +-- Profile
```

---

# 11. Role-Based Access Matrix

The following matrix defines the planned UI-level access for each role.

| Feature                   | Patient | Caregiver | Admin |
| ------------------------- | :-----: | :-------: | :---: |
| Login                     |   Yes   |    Yes    |  Yes  |
| Registration              |   Yes   |    Yes    |  Yes  |
| Own Profile               |   Yes   |    Yes    |  Yes  |
| Notifications             |   Yes   |    Yes    |  Yes  |
| Own Medicines             |   Yes   |     No    |   No  |
| Own Schedule              |   Yes   |     No    |   No  |
| Own Reminders             |   Yes   |     No    |   No  |
| Own Medication History    |   Yes   |     No    |   No  |
| Own Adherence             |   Yes   |     No    |   No  |
| Own Refill Information    |   Yes   |     No    |   No  |
| Own Prescriptions         |   Yes   |     No    |   No  |
| Assigned Patient List     |    No   |    Yes    |  Yes  |
| Patient Medication Status |    No   |    Yes    |  Yes  |
| Patient Adherence         |    No   |    Yes    |  Yes  |
| Missed Dose Alerts        |    No   |    Yes    |  Yes  |
| Refill Alerts             |    No   |    Yes    |  Yes  |
| User Management           |    No   |     No    |  Yes  |
| Patient Management        |    No   |     No    |  Yes  |
| Caregiver Management      |    No   |     No    |  Yes  |
| Caregiver Assignment      |    No   |     No    |  Yes  |
| Platform Activity         |    No   |     No    |  Yes  |
| Platform Analytics        |    No   |     No    |  Yes  |
| System Settings           |    No   |     No    |  Yes  |

> Note: This is the planned frontend access structure. Actual authorization will be enforced by the backend.

---

# 12. Frontend Route Planning

The following routes are planned for future React implementation.

```text
/
|
+-- /login
+-- /register
+-- /forgot-password
+-- /reset-password
|
+-- /patient
|   +-- /dashboard
|   +-- /medicines
|   +-- /medicines/add
|   +-- /medicines/:id
|   +-- /schedule
|   +-- /reminders
|   +-- /history
|   +-- /adherence
|   +-- /refills
|   +-- /prescriptions
|   +-- /prescriptions/upload
|   +-- /notifications
|   +-- /profile
|
+-- /caregiver
|   +-- /dashboard
|   +-- /patients
|   +-- /patients/:id
|   +-- /patients/:id/medications
|   +-- /alerts
|   +-- /reports
|   +-- /notifications
|   +-- /profile
|
+-- /admin
    +-- /dashboard
    +-- /users
    +-- /patients
    +-- /caregivers
    +-- /assignments
    +-- /activity
    +-- /analytics
    +-- /notifications
    +-- /settings
    +-- /profile
```

These routes are planning-level definitions and may be refined during implementation based on the finalized backend API contract.

---

# 13. Frontend Component Planning

The planned frontend structure is:

```text
frontend/
|
+-- src/
    |
    +-- components/
    |   +-- common/
    |   |   +-- Button
    |   |   +-- Input
    |   |   +-- Modal
    |   |   +-- Alert
    |   |   +-- Loading
    |   |
    |   +-- layout/
    |       +-- Navbar
    |       +-- Sidebar
    |       +-- DashboardLayout
    |
    +-- pages/
    |   +-- auth/
    |   +-- patient/
    |   +-- caregiver/
    |   +-- admin/
    |
    +-- features/
    |   +-- auth/
    |   +-- medications/
    |   +-- reminders/
    |   +-- adherence/
    |   +-- refills/
    |   +-- notifications/
    |   +-- caregiver/
    |   +-- admin/
    |
    +-- routes/
    |
    +-- store/
    |
    +-- services/
```

### Component Principles

The frontend should use reusable components wherever possible.

For example:

```text
Button
Input
Modal
Card
Alert
Table
Navbar
Sidebar
Loading
EmptyState
ErrorState
```

These components can be reused across Patient, Caregiver, and Admin interfaces.

---

# 14. Wireframe to React Page Mapping

| Wireframe               | Planned React Page            | Feature        |
| ----------------------- | ----------------------------- | -------------- |
| Landing Page            | `LandingPage.jsx`             | Common         |
| Login                   | `LoginPage.jsx`               | Authentication |
| Registration            | `RegisterPage.jsx`            | Authentication |
| Forgot Password         | `ForgotPasswordPage.jsx`      | Authentication |
| Reset Password          | `ResetPasswordPage.jsx`       | Authentication |
| Patient Dashboard       | `PatientDashboard.jsx`        | Patient        |
| Medicine Management     | `MedicinesPage.jsx`           | Medication     |
| Add Medicine            | `AddMedicinePage.jsx`         | Medication     |
| Medicine Details        | `MedicineDetailsPage.jsx`     | Medication     |
| Schedule                | `SchedulePage.jsx`            | Medication     |
| Reminders               | `RemindersPage.jsx`           | Reminder       |
| History                 | `MedicationHistoryPage.jsx`   | Medication     |
| Adherence               | `AdherencePage.jsx`           | Adherence      |
| Refills                 | `RefillsPage.jsx`             | Refill         |
| Prescription Management | `PrescriptionsPage.jsx`       | Prescription   |
| Upload Prescription     | `UploadPrescriptionPage.jsx`  | Prescription   |
| Notifications           | `NotificationsPage.jsx`       | Notifications  |
| Profile                 | `ProfilePage.jsx`             | Profile        |
| Caregiver Dashboard     | `CaregiverDashboard.jsx`      | Caregiver      |
| Patient Monitoring      | `PatientDetailsPage.jsx`      | Caregiver      |
| Admin Dashboard         | `AdminDashboard.jsx`          | Admin          |
| User Management         | `UserManagementPage.jsx`      | Admin          |
| Caregiver Assignment    | `CaregiverAssignmentPage.jsx` | Admin          |
| Analytics               | `AnalyticsPage.jsx`           | Admin          |

---

# 15. Frontend and Backend Interaction Plan

The planned application architecture is:

```text
React UI
   |
   v
Page / Component
   |
   v
Feature Logic
   |
   v
Redux Store / Local State
   |
   v
Axios API Layer
   |
   v
Django REST API
   |
   v
PostgreSQL
```

The frontend will consume backend APIs for:

* Authentication
* User profiles
* Medicines
* Medication schedules
* Reminders
* Medication history
* Adherence
* Refill information
* Notifications
* Caregiver functionality
* Administrative functionality

The exact API endpoints will be connected after the backend API contracts are finalized.

---

# 16. UI State Planning

Every major screen should account for different application states.

## 16.1 Loading State

```text
+----------------------------------+
|                                  |
|       Loading information...     |
|                                  |
+----------------------------------+
```

The loading state should be displayed while information is being retrieved from the backend.

---

## 16.2 Empty State

Example for Medicine Management:

```text
+----------------------------------+
|                                  |
|       No medicines found.        |
|                                  |
|  Add a medicine to begin         |
|  managing your medication.       |
|                                  |
|        [ Add Medicine ]           |
|                                  |
+----------------------------------+
```

---

## 16.3 Success State

```text
+----------------------------------+
| ✓ Medicine added successfully.  |
+----------------------------------+
```

---

## 16.4 Error State

```text
+----------------------------------+
| Unable to load the information. |
|                                  |
|             [ Retry ]            |
+----------------------------------+
```

---

## 16.5 Confirmation State

For destructive actions such as deleting a medicine:

```text
+----------------------------------+
| Are you sure you want to delete  |
| this medicine?                   |
|                                  |
|      [ Cancel ]    [ Delete ]    |
+----------------------------------+
```

---

# 17. Accessibility and Usability Considerations

The UI should consider:

* Clear labels for form fields
* Keyboard-accessible controls
* Readable typography
* Appropriate contrast
* Clear success, warning, and error states
* Confirmation before destructive actions
* Responsive layouts
* Consistent navigation
* Understandable button labels
* Meaningful empty states
* Clear medication status indicators
* Touch-friendly controls on mobile devices

Medication-related actions should use clear and unambiguous labels such as:

* `Mark as Taken`
* `Mark as Missed`
* `Snooze`
* `Add Medicine`
* `Set Schedule`
* `View Details`

---

# 18. Responsive Design Planning

The frontend should support different screen sizes.

## 18.1 Desktop

The desktop layout may use:

* Sidebar navigation
* Multi-column dashboard cards
* Tables
* Calendar views
* Charts
* Detailed medication information

## 18.2 Tablet

The layout should adapt by:

* Reducing the number of columns
* Adjusting card sizes
* Making navigation more compact
* Maintaining readable content spacing

## 18.3 Mobile

The mobile layout should support:

* Collapsible navigation
* Single-column content
* Touch-friendly buttons
* Mobile-friendly forms
* Scrollable tables where required
* Mobile-friendly medication reminders

The exact responsive breakpoints will be finalized during frontend implementation.

---

# 19. Low-Fidelity Wireframe Specifications

The following low-fidelity wireframes should be created to visually represent the planned screens.

## 19.1 Login Wireframe

```text
+------------------------------------------------+
|                    PillSync                    |
|                                                |
|              Welcome Back                      |
|                                                |
| Email / Username                               |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
| Password                                       |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
|              [ Login ]                         |
|                                                |
| Forgot Password?                               |
|                                                |
| ---------------- OR ----------------            |
|                                                |
|              [ Continue with OAuth ]            |
|                                                |
| Don't have an account? Register                |
+------------------------------------------------+
```

---

## 19.2 Patient Dashboard Wireframe

```text
+----------------------------------------------------------------+
| PillSync                    Notifications       Profile        |
+------------------+---------------------------------------------+
| Dashboard        | Welcome back, Patient                      |
| Medicines        |                                             |
| Schedule         | +------------+ +------------+ +------------+ |
| Reminders        | | Today's    | | Adherence  | | Refill     | |
| History          | | Medicines  | | 85%        | | Alert      | |
| Adherence        | +------------+ +------------+ +------------+ |
| Refills          |                                             |
| Notifications    | Today's Medicines                          |
| Profile          |                                             |
| Logout           | 08:00  Medicine A        [ Taken ]         |
|                  | 13:00  Medicine B        [ Pending ]       |
|                  | 20:00  Medicine C        [ Pending ]       |
|                  |                                             |
|                  | Recent Medication History                  |
|                  | +-----------------------------------------+ |
|                  | | Date | Medicine | Status               | |
|                  | +-----------------------------------------+ |
+------------------+---------------------------------------------+
```

---

## 19.3 Medicine Management Wireframe

```text
+----------------------------------------------------------------+
| Medicines                                      [ + Add Medicine ]|
+----------------------------------------------------------------+
| Search medicines...              Filter: [ All ]               |
+----------------------------------------------------------------+
| Medicine Name | Dosage | Frequency | Stock | Status | Actions |
+----------------------------------------------------------------+
| Medicine A    | 500mg  | Daily     | 20    | Active | View    |
| Medicine B    | 10mg   | Twice/day | 10    | Active | View    |
| Medicine C    | 250mg  | Weekly    | 3     | Low    | View    |
+----------------------------------------------------------------+
```

---

## 19.4 Add Medicine Wireframe

```text
+------------------------------------------------+
|                Add Medicine                    |
+------------------------------------------------+
|                                                |
| [ Upload Medicine Image ]                      |
|                                                |
| [ Upload Prescription ]                        |
|                                                |
| ---------------- OR ----------------            |
|                                                |
| Medicine Name                                  |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
| Dosage                                         |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
| Quantity                                       |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
| Frequency                                      |
| +--------------------------------------------+ |
| |                                            | |
| +--------------------------------------------+ |
|                                                |
| Start Date              End Date               |
| +----------------+      +----------------+     |
| |                |      |                |     |
| +----------------+      +----------------+     |
|                                                |
|       [ Cancel ]       [ Save Medicine ]        |
+------------------------------------------------+
```

---

## 19.5 Medication Schedule Wireframe

```text
+----------------------------------------------------------------+
|                  Medication Schedule                           |
+----------------------------------------------------------------+
|                         August 2026                            |
|                                                                |
|  Mon     Tue     Wed     Thu     Fri     Sat     Sun           |
|   1       2       3       4       5       6       7            |
|   8       9      10      11      12      13      14            |
|  15      16      17      18      19      20      21            |
|                                                                |
+----------------------------------------------------------------+
| Selected Day: Monday                                          |
+----------------------------------------------------------------+
| Time     Medicine       Dosage       Status                   |
| 08:00    Medicine A     500mg        Scheduled                |
| 13:00    Medicine B     10mg         Scheduled                |
| 20:00    Medicine C     250mg        Scheduled                |
+----------------------------------------------------------------+
|                     [ + Add Schedule ]                         |
+----------------------------------------------------------------+
```

---

## 19.6 Reminder Screen Wireframe

```text
+---------------------------------------------------------------+
|                         Reminders                             |
+---------------------------------------------------------------+
|                                                               |
| NEXT REMINDER                                                 |
|                                                               |
| Medicine A                                                    |
| 500mg                                                         |
| Today - 08:00 AM                                              |
|                                                               |
|       [ Mark as Taken ]   [ Snooze ]                          |
|                                                               |
+---------------------------------------------------------------+
| Upcoming Reminders                                            |
+---------------------------------------------------------------+
| 01:00 PM | Medicine B | Pending                              |
| 08:00 PM | Medicine C | Pending                              |
+---------------------------------------------------------------+
```

---

## 19.7 Adherence Dashboard Wireframe

```text
+----------------------------------------------------------------+
|                    Adherence Dashboard                         |
+----------------------------------------------------------------+
|                                                                |
| Overall Adherence                                              |
|                                                                |
|                       85%                                      |
|                                                                |
+------------------+------------------+--------------------------+
| Taken            | Missed           | Snoozed                  |
| 85               | 10               | 5                        |
+------------------+------------------+--------------------------+
|                                                                |
| Weekly Adherence                                               |
|                                                                |
| Mon  ██████████████████ 90%                                    |
| Tue  ████████████████   80%                                    |
| Wed  █████████████████ 85%                                    |
| Thu  ██████████████████ 90%                                    |
| Fri  ███████████████    75%                                    |
|                                                                |
+----------------------------------------------------------------+
```

---

## 19.8 Refill Screen Wireframe

```text
+----------------------------------------------------------------+
|                      Refill Prediction                         |
+----------------------------------------------------------------+
| Medicine        Current Stock   Daily Use   Status             |
+----------------------------------------------------------------+
| Medicine A      20 tablets      2/day       Normal             |
| Medicine B      5 tablets       2/day       Low Stock          |
| Medicine C      3 tablets       1/day       Refill Soon        |
+----------------------------------------------------------------+
|                                                                |
| Medicine B                                                     |
| Estimated depletion: 2 days                                    |
| Recommended refill: Immediately                                |
|                                                                |
|                     [ Refill Reminder ]                        |
+----------------------------------------------------------------+
```

---

## 19.9 Caregiver Dashboard Wireframe

```text
+----------------------------------------------------------------+
| PillSync - Caregiver                         Notifications     |
+-------------------+--------------------------------------------+
| Dashboard         | Welcome, Caregiver                         |
| Patients          |                                            |
| Alerts            | Assigned Patients                         |
| Reports           |                                            |
| Profile           | +----------------------------------------+ |
| Logout            | | Patient | Adherence | Alerts | Status | |
|                   | +----------------------------------------+ |
|                   | | Patient A | 90% | 1 | Active       | |
|                   | | Patient B | 72% | 3 | Attention    | |
|                   | | Patient C | 95% | 0 | Active       | |
|                   | +----------------------------------------+ |
+-------------------+--------------------------------------------+
```

---

## 19.10 Admin Dashboard Wireframe

```text
+----------------------------------------------------------------+
| PillSync - Admin                            Profile            |
+-------------------+--------------------------------------------+
| Dashboard         | Platform Overview                         |
| Users             |                                            |
| Patients          | +------------+ +------------+ +----------+ |
| Caregivers        | | Total Users| | Patients   | | Caregivers|
| Assignments       | |    250     | |    180     | |    70    |
| Analytics         | +------------+ +------------+ +----------+ |
| Activity           |                                            |
| Notifications     | User Activity                              |
| Settings           | +----------------------------------------+ |
| Profile            | | Date | User | Activity | Status        | |
| Logout             | +----------------------------------------+ |
+-------------------+--------------------------------------------+
```

---

# 20. Workflow Diagram Summary

The overall PillSync workflow can be represented as:

```text
                         +----------------+
                         |     LOGIN      |
                         +-------+--------+
                                 |
                                 v
                         +----------------+
                         | AUTHENTICATION |
                         +-------+--------+
                                 |
                                 v
                           +-----------+
                           | ROLE CHECK|
                           +-----+-----+
                                 |
                +----------------+----------------+
                |                |                |
                v                v                v
          +-----------+    +-----------+    +-----------+
          |  PATIENT  |    | CAREGIVER |    |   ADMIN   |
          +-----+-----+    +-----+-----+    +-----+-----+
                |                |                |
                v                v                v
          Patient UI       Caregiver UI       Admin UI
                |                |                |
                v                v                v
          Medicines         Patients          Users
                |                |                |
                v                v                v
           Schedule        Monitoring         Analytics
                |
                v
           Reminders
                |
        +-------+-------+
        |       |       |
        v       v       v
      Taken   Missed  Snooze
        |       |       |
        +-------+-------+
                |
                v
        Medication History
                |
                v
        Adherence Tracking
                |
                v
        Stock Calculation
                |
                v
        Refill Prediction
                |
                v
          Refill Alert
```

---

# 21. Implementation Plan

The frontend implementation will be performed incrementally.

## Phase 1 — Frontend Foundation

Tasks:

1. React application setup
2. Routing setup
3. Global styling
4. Reusable UI components
5. API service configuration
6. State management setup
7. Authentication state handling

---

## Phase 2 — Authentication and Profiles

Tasks:

1. Login page
2. Registration page
3. Forgot password page
4. Reset password page
5. Authentication state
6. Role-based route handling
7. Profile page

---

## Phase 3 — Patient Features

Tasks:

1. Patient dashboard
2. Medicine management
3. Add medicine
4. Medicine details
5. Medication schedule
6. Reminder management
7. Medication history
8. Notifications

---

## Phase 4 — Caregiver Features

Tasks:

1. Caregiver dashboard
2. Patient list
3. Patient details
4. Medication monitoring
5. Missed-dose alerts
6. Refill alerts
7. Adherence reports

---

## Phase 5 — Admin Features

Tasks:

1. Admin dashboard
2. User management
3. Patient management
4. Caregiver management
5. Caregiver assignment
6. Platform activity
7. Analytics
8. System settings

---

## Phase 6 — Intelligent Features

Tasks:

1. Prescription upload
2. OCR integration
3. Medicine information extraction
4. Medication stock tracking
5. Refill prediction
6. Adherence analytics
7. Intelligent notifications

---

# 22. Development Sequence

The recommended implementation sequence is:

```text
Frontend Setup
      |
      v
Routing
      |
      v
Authentication
      |
      v
Role-Based Navigation
      |
      v
Profile
      |
      v
Patient Dashboard
      |
      v
Medicine Management
      |
      v
Medication Schedule
      |
      v
Reminders
      |
      v
Medication History
      |
      v
Adherence
      |
      v
Refill Prediction
      |
      v
Caregiver Features
      |
      v
Admin Features
      |
      v
OCR / Intelligent Features
      |
      v
Testing
      |
      v
Deployment
```

---

# 23. Testing Considerations

Each implemented screen should eventually be tested for:

* Correct rendering
* Navigation
* Form validation
* User interactions
* Loading states
* Error handling
* Empty states
* Role-based access
* Responsive behavior
* API integration
* Accessibility

### Example

For the Medicine Management page:

```text
Open Medicine Management
        |
        v
Check Loading State
        |
        v
Load Medicines
        |
   +----+----+
   |         |
   v         v
Success     Error
   |         |
   v         v
Display    Error
Medicines  Message
   |
   v
Select Medicine
   |
   v
Medicine Details
```

---

# 24. Milestone Implementation Boundaries

## Milestone 1

The current planning covers:

* UI wireframes
* User workflows
* Navigation planning
* Role-based UI planning
* Frontend architecture planning
* Authentication-related screens
* Profile-related screens

## Milestone 2

The planned implementation includes:

* Medicine management
* Medication scheduling
* Medication reminders
* Notification functionality
* Medication history

## Milestone 3

The planned implementation includes:

* OCR-based medicine extraction
* Refill prediction
* Medicine stock tracking
* Adherence analytics
* Refill notifications

## Milestone 4

The planned implementation includes:

* Advanced dashboards
* Analytics visualizations
* Comprehensive testing
* Performance improvements
* Deployment
* Final documentation

---

# 25. Traceability Matrix

| Requirement           | Planned UI                         | Planned Workflow                      | Milestone |
| --------------------- | ---------------------------------- | ------------------------------------- | --------- |
| Authentication        | Login / Registration               | Login → Authentication → Role Routing | M1        |
| User Profile          | Profile                            | Dashboard → Profile                   | M1        |
| Medicine Management   | Medicine Management                | Add → Save → Manage                   | M2        |
| Medication Scheduling | Schedule                           | Medicine → Schedule                   | M2        |
| Reminders             | Reminders                          | Schedule → Reminder                   | M2        |
| Medication History    | History                            | Reminder → Taken/Missed → History     | M2        |
| OCR                   | Add Medicine / Upload Prescription | Upload → OCR → Review → Confirm       | M3        |
| Refill Prediction     | Refills                            | Stock → Prediction → Alert            | M3        |
| Adherence             | Adherence Dashboard                | Taken/Missed → Analytics              | M3        |
| Notifications         | Notifications                      | Event → Notification                  | M2/M3     |
| Caregiver Monitoring  | Caregiver Dashboard                | Patient → Monitoring → Alerts         | M2/M3     |
| Platform Analytics    | Admin Dashboard                    | Data → Analytics                      | M4        |

---

# 26. Wireframe Deliverables

The following low-fidelity wireframes are planned:

1. Landing Page
2. Login
3. Registration
4. Forgot Password
5. Reset Password
6. Patient Dashboard
7. Medicine Management
8. Add Medicine
9. Medicine Details
10. Medication Schedule
11. Reminder Management
12. Medication History
13. Adherence Dashboard
14. Refill Prediction
15. Prescription Management
16. Upload Prescription
17. Notifications
18. Profile
19. Caregiver Dashboard
20. Caregiver Patient Monitoring
21. Admin Dashboard
22. User Management

The wireframes focus on:

* Layout
* Information hierarchy
* Navigation
* User workflow
* Placement of important actions
* Basic content structure

The wireframes are not intended to represent the final visual design of the application.

---

# 27. Wireframe Design Conventions

The following conventions will be used throughout the low-fidelity wireframes.

| Element         | Representation                |
| --------------- | ----------------------------- |
| Screen          | Rectangle / frame             |
| Button          | Rounded rectangle             |
| Input field     | Bordered rectangle            |
| Navigation      | Sidebar / top navigation      |
| Card            | Bordered content container    |
| Alert           | Highlighted notification area |
| Table           | Rows and columns              |
| Decision        | Branching workflow            |
| Navigation flow | Arrow                         |
| User action     | Button / interactive element  |

The purpose of these conventions is to make the wireframes easy for all team members to understand and implement.

---

# 28. Team Collaboration Plan

The UI planning document will be used as a common reference for the development team.

The team should follow the documented:

* Screen structure
* Navigation
* Role-based access
* Workflow
* Component structure
* Route naming
* UI conventions

Before implementing a new screen, the responsible team member should verify that the screen is represented in the UI plan or update the plan if the project requirements change.

### Suggested Collaboration Flow

```text
UI Requirement
      |
      v
Wireframe
      |
      v
Workflow Review
      |
      v
Frontend Component
      |
      v
React Page
      |
      v
API Integration
      |
      v
Testing
      |
      v
Review
```

---

# 29. Validation Checklist

Before considering the UI planning task complete, the following items should be reviewed:

* [ ] Required user roles are documented.
* [ ] Required screens are documented.
* [ ] Patient workflow is documented.
* [ ] Caregiver workflow is documented.
* [ ] Admin workflow is documented.
* [ ] Medication workflow is documented.
* [ ] Reminder workflow is documented.
* [ ] Adherence workflow is documented.
* [ ] Refill workflow is documented.
* [ ] Role-based access matrix is documented.
* [ ] Navigation structure is documented.
* [ ] Frontend routes are planned.
* [ ] React page mapping is planned.
* [ ] Component structure is planned.
* [ ] UI states are planned.
* [ ] Accessibility considerations are documented.
* [ ] Responsive design considerations are documented.
* [ ] Milestone boundaries are documented.
* [ ] Traceability matrix is documented.
* [ ] Low-fidelity wireframes are included.
* [ ] Team collaboration approach is documented.

---

# 30. Conclusion

This UI wireframe and workflow plan establishes the structure required for implementing the PillSync frontend.

The design separates Patient, Caregiver, and Admin experiences while maintaining common UI patterns and navigation principles.

The workflows define how medication information moves from medicine creation through scheduling and reminders to medication records, adherence tracking, and refill-related notifications.

The documented screens, routes, components, workflows, role permissions, UI states, and milestone boundaries provide a structured foundation for subsequent frontend implementation.

The low-fidelity wireframes provide a visual reference for the development team while the application moves from planning to feature-level frontend implementation.

This document will be updated when project requirements, backend API contracts, or approved UI decisions change.

````
