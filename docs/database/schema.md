# Database schema

**Milestone 1 deliverable — "Database schema finalized".**

PostgreSQL 16 in every deployed environment; SQLite is the local fallback so a
fresh clone runs without a database server. `DATABASE_URL` overrides both.

## Entity relationship diagram

```mermaid
erDiagram
    USER ||--o| PATIENT_PROFILE : "has own"
    USER ||--o{ PATIENT_PROFILE : manages
    USER ||--o| CAREGIVER_PROFILE : "has"
    USER ||--o{ CAREGIVER_ASSIGNMENT : "is caregiver in"
    USER ||--o{ CAREGIVER_ASSIGNMENT : "is patient in"
    PATIENT_PROFILE ||--o{ EMERGENCY_CONTACT : "reachable via"
    PATIENT_PROFILE ||--o{ PATIENT_CONDITION : "treated for"
    MEDICAL_CONDITION ||--o{ PATIENT_CONDITION : "recorded as"
    MEDICAL_CONDITION }o--|| MEDICINE_CATEGORY : "usually treated with"
    MEDICINE_REFERENCE }o--|| MEDICINE_CATEGORY : "belongs to"

    USER {
        uuid id PK
        citext email UK "sign-in identity"
        varchar full_name
        varchar phone_number
        varchar role "PATIENT | CAREGIVER | ADMIN"
        varchar auth_provider "LOCAL | GOOGLE"
        bool is_email_verified
        bool is_active "deactivate, never delete"
        bool is_staff
        timestamptz date_joined
        inet last_login_ip
    }

    PATIENT_PROFILE {
        uuid id PK
        uuid user_id FK "null for a dependent"
        uuid managed_by_id FK "who is responsible"
        varchar full_name
        varchar relationship_to_manager
        date date_of_birth
        varchar gender
        varchar blood_group
        smallint height_cm
        decimal weight_kg
        text allergies
        varchar timezone_name "reminders fire locally"
        varchar preferred_reminder_channel
        bool is_self
        bool is_active
    }

    CAREGIVER_PROFILE {
        uuid id PK
        uuid user_id FK UK
        varchar organisation
        varchar qualification
        varchar license_number
        smallint years_of_experience
        bool is_professional
        bool is_verified
    }

    CAREGIVER_ASSIGNMENT {
        uuid id PK
        uuid caregiver_id FK
        uuid patient_id FK
        varchar relationship
        varchar status "PENDING | ACTIVE | REVOKED | DECLINED"
        bool can_view_adherence
        bool can_receive_alerts
        bool can_manage_medications
        uuid invited_by_id FK
        timestamptz responded_at
    }

    EMERGENCY_CONTACT {
        uuid id PK
        uuid patient_id FK
        varchar name
        varchar relationship
        varchar phone_number
        varchar email
        bool is_primary "at most one per patient"
    }

    PATIENT_CONDITION {
        uuid id PK
        uuid patient_id FK
        uuid condition_id FK
        date diagnosed_on
        varchar severity
        text notes
        bool is_active
    }

    MEDICAL_CONDITION {
        uuid id PK
        slug code UK
        varchar name
        varchar category
        bool is_chronic
        bool is_active
    }

    MEDICINE_REFERENCE {
        uuid id PK
        varchar product_ndc "FDA National Drug Code"
        varchar generic_name
        varchar brand_name
        varchar dosage_form
        varchar route
        varchar strength
        varchar strength_unit
        varchar category
        jsonb secondary_categories
        varchar pharm_class
        bool requires_prescription
        bool is_active
    }
```

Every table also carries `created_at` and `updated_at` from the shared
`UUIDTimeStampedModel` base.

## Decisions worth knowing

**UUID primary keys everywhere.** Record identifiers travel in URLs that both a
patient and their caregiver see. Sequential integers would leak how many
patients and prescriptions the platform holds, and make one patient's records
guessable from another's.

**`User` and `PatientProfile` are separate.** The specification requires
"multiple patient profiles for families". A parent tracking medicines for a
child or an elderly relative needs a profile for someone who has no login, so
`PatientProfile.user` is nullable and `managed_by` records who is responsible.

**One `User` model for all three roles.** A caregiver is very often also a
patient — an adult child managing their own medicines and their parent's.
Separate models would force that person to hold two accounts.

**Access is granted, not claimed.** A `CaregiverAssignment` starts `PENDING`;
only the patient (or an admin) moves it to `ACTIVE`, and only an `ACTIVE` one
confers any read access. The three permission flags let a patient share
adherence data without also handing over the ability to change medication.

**Nothing is deleted.** `is_active` flags retire users, profiles and conditions.
Medication history must outlive the account it belongs to, both clinically and
for the adherence analytics in Milestone 4.

## Constraints and indexes

| Table | Constraint | Why |
|---|---|---|
| `user` | `email` unique | Email is the sign-in identity |
| `caregiver_assignment` | unique `(caregiver, patient)` | One link per pair, whatever its status |
| `caregiver_assignment` | check `caregiver != patient` | Nobody is their own caregiver |
| `patient_profile` | unique `(managed_by, full_name)` | Two "Mother" profiles would be unusable |
| `emergency_contact` | unique `patient` where `is_primary` | Exactly one number to call first |
| `patient_condition` | unique `(patient, condition)` | A condition is recorded once |
| `medicine_reference` | unique `(generic, form, strength, unit)` | One row per presentation |

Indexes: `user(role, is_active)`, `caregiver_assignment(patient, status)`,
`patient_profile(managed_by, is_active)`, `patient_condition(patient, is_active)`,
`medicine_reference(category, is_active)` and `(generic_name, brand_name)`.
Each one backs a query the app runs on every page load.

## Reference data

`MEDICAL_CONDITION` and `MEDICINE_REFERENCE` are seeded, not user-entered:

```bash
python manage.py seed_reference_data
```

That loads 20 conditions and ~1,760 medicine presentations from
`backend/apps/common/data/`, built from the FDA National Drug Code Directory by
`ml/src/common/build_medicine_reference.py`. The command is idempotent — rows
are matched on their natural key and updated in place.

Patients link to these rows rather than typing free text, so "diabetes",
"Diabetes Type 2" and "T2DM" do not become three conditions the analytics
cannot group.

## Milestone 2 tables

```mermaid
erDiagram
    PATIENT_PROFILE ||--o{ MEDICINE : takes
    PATIENT_PROFILE ||--o{ PRESCRIPTION : "was given"
    MEDICINE_REFERENCE ||--o{ MEDICINE : "catalogued as"
    PRESCRIPTION ||--o{ MEDICINE : prescribes
    MEDICINE ||--o{ MEDICATION_SCHEDULE : "taken on"
    MEDICATION_SCHEDULE ||--o{ DOSE_EVENT : "materialises into"
    DOSE_EVENT ||--o{ NOTIFICATION_LOG : "reminded by"
    USER ||--o{ DEVICE_TOKEN : registers
    USER ||--|| NOTIFICATION_PREFERENCE : configures
    USER ||--o{ NOTIFICATION_LOG : receives

    MEDICINE {
        uuid id PK
        uuid patient_id FK
        uuid reference_id FK "catalogue entry, optional"
        uuid prescription_id FK
        varchar name
        varchar category "disease-based grouping"
        varchar instructions "shown on every reminder"
        decimal quantity_remaining "decremented on TAKEN"
        decimal quantity_per_refill "pack size"
        decimal low_stock_threshold
        date start_date
        date end_date
        bool is_active
    }

    MEDICATION_SCHEDULE {
        uuid id PK
        uuid medicine_id FK
        varchar slot "MORNING | AFTERNOON | EVENING | NIGHT"
        time time_of_day "local to the patient"
        decimal quantity_per_dose
        varchar frequency "DAILY | SPECIFIC_DAYS | INTERVAL"
        jsonb days_of_week "ISO weekdays for SPECIFIC_DAYS"
        smallint interval_days
        bool reminder_enabled
        bool is_active
    }

    DOSE_EVENT {
        uuid id PK
        uuid schedule_id FK
        uuid medicine_id FK "denormalised"
        uuid patient_id FK "denormalised"
        timestamptz scheduled_for
        varchar slot
        decimal quantity_expected
        varchar status "PENDING | TAKEN | MISSED | SNOOZED | SKIPPED"
        decimal quantity_taken
        timestamptz responded_at
        timestamptz snooze_until
        smallint snooze_count "capped at 3"
        timestamptz reminder_sent_at
        timestamptz caregiver_alerted_at
    }

    PRESCRIPTION {
        uuid id PK
        uuid patient_id FK
        varchar doctor_name
        date issued_on
        date expires_on
        image image "per-patient upload directory"
        varchar status "ACTIVE | EXPIRED | ARCHIVED"
        bool ocr_extracted "written by Milestone 3"
        float ocr_confidence
        timestamptz expiry_reminded_at
    }

    NOTIFICATION_LOG {
        uuid id PK
        uuid recipient_id FK
        uuid dose_event_id FK
        varchar category
        varchar channel "PUSH | EMAIL | SMS"
        varchar status "QUEUED | SENT | FAILED | SKIPPED"
        varchar subject
        text body
        jsonb payload "deep-link data"
        text error
    }
```

### Decisions

**`DoseEvent` is both the reminder and the history record.** One row per
scheduled dose means "what did the patient do about Tuesday's 08:00 dose" has
exactly one answer. Splitting them would leave the two to drift.

**`patient_id` and `medicine_id` are denormalised onto `DoseEvent`.** The
history of a patient survives a schedule being deleted, and today's doses need
no joins.

**Unique `(schedule, scheduled_for)`.** Regenerating the horizon, or two workers
generating at once, cannot produce a doubled dose.

**Nothing is deleted here either.** Stopping a medicine deactivates it and drops
only its untouched future doses; a prescription is archived so the medicines
pointing at it keep their link.

## What Milestone 3 adds

`RefillPrediction` alongside `Medicine`, and OCR extraction results against
`Prescription`. Adherence analytics aggregate `DOSE_EVENT` and need no new
tables.
