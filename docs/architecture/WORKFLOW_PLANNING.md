# PillSync — System Architecture & Complete Workflow Planning

**Author:** Rajasri Nallamilli (Intern #03)  
**Module Scope:** Milestone 1 — Comprehensive System Workflow Planning  
**Target Platform:** PillSync Intelligent Medicine Reminder & Tracking Platform  
**Color System:** Crimson & Ruby Red (`#ED4264`, `#DC143C`)

---

## 1. Complete Workflow Architecture

PillSync supports 25 distinct screen workflows across 3 distinct security roles (**Patient**, **Caregiver**, **Admin**) and public authentication states.

```mermaid
flowchart TD
    A[Public Landing Page] --> B{Action?}
    B -- Login --> C[Login Page: JWT + Google OAuth2]
    B -- Register --> D[Register Page: Patient / Caregiver Role]
    B -- Forgot Password --> E[Forgot Password Page]

    C --> F{Authenticated Role?}

    F -- Patient Role --> G[Patient Shell Layout]
    G --> G1[Dashboard / Schedule]
    G --> G2[My Medicines & Add Medicine]
    G --> G3[Prescription OCR Reader]
    G --> G4[Adherence Analytics & Reports]
    G --> G5[Refill Prediction Engine]
    G --> G6[Disease Categories]
    G --> G7[Notifications & History]

    F -- Caregiver Role --> H[Caregiver Shell Layout]
    H --> H1[My Patients Dashboard]
    H --> H2[Patient Detail & Adherence View]
    H --> H3[Live Alert Stream & Missed Dose Nudges]

    F -- Admin Role --> I[Admin Shell Layout]
    I --> I1[Admin Overview Dashboard]
    I --> I2[User Management & Block/Unblock]
    I --> I3[Caregiver Assignments]
    I --> I4[System Notification Settings]
    I --> I5[Prescription Management Console]
```

---

## 2. Detailed System Sequence Diagrams

### 2.1 Workflow 1: Authentication & Role-Based Token Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Patient / Caregiver / Admin
    participant UI as React Frontend
    participant AuthAPI as FastAPI / DRF Auth
    participant DB as PostgreSQL DB

    User->>UI: Input Credentials or Click "Continue with Google"
    UI->>AuthAPI: POST /api/v1/auth/login or OAuth Callback
    AuthAPI->>DB: Verify credentials / OAuth Token
    DB-->>AuthAPI: Return User Record & Assigned Role
    AuthAPI->>AuthAPI: Mint JWT Access & Refresh Token with Role Claim
    AuthAPI-->>UI: Return 200 OK + JWT Tokens
    UI->>UI: Store Token securely & Render Role Sidebar Layout
```

### 2.2 Workflow 2: Smart Medicine Intake & Snooze Escalation Flow
```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    actor Caregiver as Caregiver
    participant UI as React Frontend / Push Notification
    participant RemindAPI as Reminder Background Service
    participant DB as PostgreSQL DB

    RemindAPI->>UI: Trigger Reminder Popup (08:00 AM Metformin)
    UI->>Patient: Display Reminder Modal [Taken / Missed / Snooze]
    alt Patient Clicks TAKEN
        Patient->>UI: Click [ ✓ Medicine Taken ]
        UI->>DB: Update Status = TAKEN, Decrement Stock Count
    else Patient Clicks SNOOZE
        Patient->>UI: Click [ Snooze 15m ]
        UI->>RemindAPI: Set Timer for 15 Mins
        RemindAPI->>UI: Re-trigger Notification after 15 Mins
    else Patient Misses / No Action
        RemindAPI->>DB: Update Status = MISSED after 30 mins
        RemindAPI->>Caregiver: Send Push & SMS Alert to Assigned Caregiver
    end
```

### 2.3 Workflow 3: Prescription OCR Extraction & Schedule Creation
```mermaid
flowchart LR
    A[Prescription Image / Photo] --> B[Upload to OCR Endpoint]
    B --> C[Tesseract OCR Processing]
    C --> D[spaCy NLP Entity Extraction]
    D --> E[JSON Output: Medicine, Dosage, Frequency]
    E --> F[Display Review & Edit Form to User]
    F --> G[Save to Patient Schedule & Medicine Database]
```
