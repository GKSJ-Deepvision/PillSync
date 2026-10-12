# PillSync — System Architecture & Design

## 1. High-Level Architecture Overview

PillSync is an intelligent medication adherence, schedule tracking, and refill prediction platform built for chronic disease patients, caregivers, and medical administrators.

The platform employs a modular decoupled architecture:
- **Frontend SPA**: Built with React 18, Tailwind CSS, Lucide icons, Axios HTTP client, and Web Audio API.
- **Backend API**: Python 3.11 / 3.12 with Django REST Framework (DRF), SQLite in local development, PostgreSQL ready for production, Celery background tasks.
- **ML / OCR Pipeline**: Tesseract OCR engine, OpenCV / PIL preprocessing, and regex entity parsing for prescription data extraction.
- **Real-Time Alert Engine**: Integrated Web Audio synthesizer (multi-tone medical alerts), browser Web Notification API, and Caregiver emergency push dispatches.

```
+--------------------------------------------------------------------------+
|                             Frontend (React SPA)                         |
|  - Patient Portal  - Caregiver Portal  - Admin Console  - OCR Scanner     |
|  - Adherence UI    - Refill Tracker    - Web Audio Alert Engine          |
+------------------------------------+-------------------------------------+
                                     | REST API / JSON (Axios)
                                     v
+------------------------------------+-------------------------------------+
|                     Backend (Django REST Framework)                      |
|                                                                          |
|  apps/accounts      apps/profiles      apps/medications   apps/ocr       |
|  apps/reminders     apps/adherence     apps/refills       apps/analytics |
|  apps/notifications apps/prescriptions                                   |
+-------------------+--------------------------------+---------------------+
                    |                                |
                    v                                v
+-------------------+--------------+   +-------------+---------------------+
|    Database & Persistent Store   |   |        ML & OCR Pipeline          |
|    - SQLite (Dev)                |   |    - Tesseract OCR (Image to Text)|
|    - PostgreSQL (Prod)           |   |    - Multi-drug Regex Entity      |
|    - LocalStorage (Client cache) |   |      Extraction Engine            |
+----------------------------------+   +-----------------------------------+
```

## 2. Core Subsystems

### 2.1 Role-Based Access Control (RBAC)
- **Patient**: Views daily schedules, logs doses (taken/snoozed), scans prescriptions via OCR, tracks refill status, chats with AI assistant.
- **Caregiver**: Monitors assigned patients, tracks real-time adherence rates, sends emergency adherence alerts and wellness reminders.
- **Admin**: System oversight, user role auditing, session monitoring, platform health inspection.

### 2.2 OCR Prescription Recognition Pipeline
1. Image uploaded via camera or file input.
2. OpenCV / PIL grayscale and adaptive binarization preprocessing.
3. Tesseract OCR character recognition.
4. Entity extraction parser detects:
   - Medication name (brand & generic)
   - Dosage strength (mg, mcg, ml)
   - Frequency (OD, BD, TID, etc.)
   - Total tablet / capsule count
5. Direct mapping into Patient medication schedule.

### 2.3 Adherence & Smart Reminder Engine
- Three distinct daily slots: Morning (08:00), Afternoon (13:00), Night (20:00).
- Local time awareness preventing timezone boundary mismatches.
- Multi-channel notification: On-screen toast, browser audio alert (C5-G5 chime), and caregiver escalation for missed doses.

### 2.4 Refill Prediction Engine
- Real-time stock decrement upon dose confirmation.
- Consumption burn-rate velocity calculation:
  $$\text{Days Remaining} = \frac{\text{Current Stock}}{\text{Daily Dosage Count}}$$
- Automatic low-stock flag triggered when $\text{Days Remaining} \le \text{Threshold}$.
