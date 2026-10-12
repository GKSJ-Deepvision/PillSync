# PillSync — End-to-End Demo Walkthrough Guide

## 1. Demo Credentials & Portals

The application provides quick login tabs for all 3 supported user roles:

| Role | Email | Password | Primary Purpose |
|---|---|---|---|
| **Patient** | `rahul.verma@example.com` | `rahul@123` | Log daily doses, view reminders, scan prescriptions, track stock |
| **Caregiver** | `priya.sharma@example.com` | `priya@123` | Supervise assigned patients, check adherence, dispatch alerts |
| **Administrator** | `syedmuhammedsr@gmail.com` | `sonu@7860` | Audit user logins, inspect system logs, monitor platform stats |

*Note: New patient and caregiver accounts can also be created via the "Sign up" registration link.*

---

## 2. End-to-End User Journeys

### Journey A: Patient Daily Dose & Audio Alert
1. Log into the Patient Portal.
2. Navigate to **Reminders** (`/reminders`).
3. View the time-of-day slots: Morning (8:00 AM), Afternoon (1:00 PM), Night (8:00 PM).
4. Tap **"Mark Taken"** on any active medication:
   - Web Audio synthesizer plays a clinical chime (C5 -> G5).
   - Stock count decrements by 1.
   - Adherence record updates immediately.
   - Button transitions to a verified green badge.
5. Tap **"Snooze"**:
   - Reschedules alert reminder by 15 minutes.

### Journey B: OCR Prescription & Medicine Strip Scan
1. Navigate to **Scan Strip / OCR** (`/ocr`).
2. Upload a prescription or medication strip photo (or drag-and-drop).
3. The AI OCR engine extracts:
   - Medicine Name
   - Dosage Strength (e.g. 500mg, 10mg)
   - Frequency (e.g. Twice daily, Once daily)
   - Quantity / Pack size
4. Review the extracted cards and tap **"Confirm & Add to Schedule"**.
5. The medicine immediately populates the Patient's active schedule and inventory.

### Journey C: Caregiver Patient Oversight & Emergency Alert
1. Log into the Caregiver Portal (`/caregiver/patients`).
2. View assigned chronic disease patients with their real-time adherence rates.
3. Check patient details, including linked caregiver name (`Dr. Sarah Jenkins` / `Caregiver Clinician`).
4. Click **"Dispatch Test Alert"** to send a high-priority nudge to the patient's device.

### Journey D: Clinical Adherence Report Export
1. Navigate to **Analytics** (`/analytics`).
2. Review 7-day adherence charts, dose breakdown, and refill velocity metrics.
3. Click **"Export CSV"** for structured data analysis.
4. Click **"Print / Save Clinical PDF"** (`Printer` button) to generate an official physician-ready medication audit report.

### Journey E: Admin Console & User Audit
1. Sign in as Administrator (`/login?portal=admin`).
2. View all 16 registered user accounts, active roles, and recent activity timestamps.
