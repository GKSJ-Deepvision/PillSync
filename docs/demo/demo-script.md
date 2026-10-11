# PillSync End-to-End Walkthrough & Demo Script

This script outlines the demonstration flow for the PillSync Medication Management Platform.

## 1. Landing Page & Role Selection
- Visit the PillSync landing page `/`.
- Observe the clean branding with the official PillSync logo in the navigation header.
- View the 3 role portals:
  1. **Patient Portal**: Dosage scheduling, intake logs, smart reminders & prescription OCR scanning.
  2. **Caregiver Portal**: Patient monitoring, missed dose alerts, emergency call triggers & adherence logs.
  3. **Admin Console**: User account management, caregiver assignments & audit logs.
- Note that demo shortcuts and prefilled buttons are absent; users can select **LOGIN / SIGN IN** or **SIGN UP / REGISTER** for any role.

## 2. Authentication Flow
- Select **Patient** -> **Sign Up / Register**.
- Fill in patient name, email, phone, and password.
- Click **Register as Patient** -> Session is initialized with JWT tokens and redirects directly to the `/patient` dashboard.
- Alternatively, select **Caregiver** or **Admin** to access respective portals.

## 3. Medication & Schedule Management
- In Patient Portal, navigate to **My Medicines** (`/medicines`).
- Add a new medication (e.g., *Metformin 500mg*, 60 tablets stock).
- Assign a dosage schedule (e.g., Morning 08:00 AM, 1 Tablet daily).
- Group medicines by condition via `/api/v1/medicines/by-condition/`.

## 4. Smart Reminders & Dose Actions
- Observe scheduled reminders on the dashboard.
- Mark a dose as **Taken**:
  - Reminder status updates to `Taken`.
  - Stock quantity automatically decrements from 60 to 59.
  - Adherence entry is logged for the day.
- Test other dose actions: **Missed**, **Snooze**, and **Skip**.

## 5. OCR Prescription Scanning
- Navigate to **Prescriptions** -> **Scan**.
- Submit prescription image/text for analysis.
- View structured extraction parsing doctor, clinic, medicine name, dosage, frequency, and course length.

## 6. AI Refill Prediction & Adherence Analytics
- Inspect the **Refills** tab to see stock depletion forecasts.
- Review hand-crafted SVG visualization charts:
  - Adherence Ring Chart (% adherence).
  - Stock Projection Chart (days remaining to depletion).
  - Daily Doses Chart (taken vs missed doses).
  - Category Breakdown Bars.
- Export adherence history in CSV format.
