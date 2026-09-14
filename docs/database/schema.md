# PillSync Database Schema & ER Diagram

This document details the finalized relational database architecture for **PillSync**, designed for PostgreSQL with Django ORM.

---

## Entity Relationship (ER) Diagram

`mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ CAREGIVER_PATIENTS : assigned as caregiver/patient
    USERS ||--o{ MEDICATIONS : owns
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ SCANNED_PRESCRIPTIONS : uploads
    MEDICATIONS ||--o{ SCHEDULES : defines
    MEDICATIONS ||--o{ REMINDERS : triggers
    MEDICATIONS ||--o{ REFILL_REQUESTS : generates
    SCHEDULES ||--o{ REMINDERS : generates
    USERS ||--o{ ADHERENCE_RECORDS : tracks

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role PATIENT | CAREGIVER | ADMIN
        string phone_number
        boolean is_active
        datetime date_joined
    }

    USER_PROFILES {
        int id PK
        uuid user_id FK
        string avatar_url
        date date_of_birth
        string gender
        string emergency_contact_name
        string emergency_contact_phone
        datetime created_at
    }

    CAREGIVER_PATIENTS {
        int id PK
        uuid caregiver_id FK
        uuid patient_id FK
        string relationship_type
        enum access_level FULL | VIEW_ONLY | EMERGENCY
        enum status ACTIVE | PENDING | REVOKED
        datetime created_at
    }

    MEDICATIONS {
        int id PK
        uuid user_id FK
        string name
        string disease_category
        string dosage
        string frequency
        string instructions
        int quantity_remaining
        int refill_threshold
        boolean is_active
        datetime created_at
    }

    SCHEDULES {
        int id PK
        int medication_id FK
        enum time_of_day MORNING | AFTERNOON | EVENING | NIGHT
        time exact_time
        json days_of_week
        int dose_amount
    }

    REMINDERS {
        int id PK
        uuid user_id FK
        int medication_id FK
        int schedule_id FK
        datetime scheduled_time
        enum status UPCOMING | TAKEN | MISSED | SNOOZED
        datetime taken_at
        datetime snoozed_until
    }

    ADHERENCE_RECORDS {
        int id PK
        uuid user_id FK
        date record_date
        int total_scheduled
        int total_taken
        int total_missed
        float adherence_percentage
        int current_streak
    }

    NOTIFICATIONS {
        int id PK
        uuid user_id FK
        string title
        text message
        enum type DOSE_ALERT | MISSED_DOSE | REFILL_WARNING | CARE_TEAM
        boolean is_read
        datetime created_at
    }

    SCANNED_PRESCRIPTIONS {
        int id PK
        uuid user_id FK
        string image_url
        text raw_extracted_text
        json parsed_medication_data
        enum status PROCESSING | COMPLETED | FAILED
        datetime created_at
    }

    REFILL_REQUESTS {
        int id PK
        int medication_id FK
        uuid patient_id FK
        string pharmacy_name
        date predicted_runout_date
        enum status PREDICTED | REQUESTED | APPROVED | FULFILLED
        datetime created_at
    }
`

---

## Core Tables & Relations

1. **ccounts_user**: Custom identity model supporting email authentication, password hashing, and role-based permissions (PATIENT, CAREGIVER, ADMIN).
2. **profiles_userprofile**: Extends identity with clinical demographics, avatars, and emergency contacts.
3. **ccounts_caregiverpatient**: Maps caregiver-to-patient monitoring delegations with role-based access control (FULL, VIEW_ONLY).
4. **medications_medication**: Stores patient prescriptions, disease classification (Blood Pressure, Diabetes, Thyroid, etc.), dosage, instructions, and stock levels.
5. **medications_schedule**: Configures multi-dose daily timing (Morning 08:00 AM, Afternoon 01:00 PM, Evening 06:00 PM, Night 10:00 PM).
6. **eminders_reminder**: Tracks individual dose instances, confirmation logging, snooze states, and missed dose triggers.
7. **dherence_adherencerecord**: Aggregates daily and longitudinal adherence scores, intake ratios, and adherence streaks.
8. **
otifications_notification**: Dispatches real-time reminders, caregiver alerts, and critical refill warnings.
