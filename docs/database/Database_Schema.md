# PillSync Database Schema

## Overview

The PillSync backend uses SQLAlchemy ORM with PostgreSQL as the database.

The database schema is designed to support:

- User authentication and roles
- Patient profiles
- Caregiver-patient assignments
- Medicine management
- Dosage scheduling
- Prescription management
- Medical condition tracking
- Medication history and adherence tracking

---

## Database Tables

The finalized database contains the following tables:

1. `users`
2. `patient_profiles`
3. `caregiver_patient`
4. `medicines`
5. `dosage_schedules`
6. `prescriptions`
7. `medical_conditions`
8. `medication_history`

---

## 1. Users

### Table: `users`

Stores authentication and basic account information.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Unique user identifier |
| `username` | String(50) | Unique, Not Null | User login name |
| `email` | String(255) | Unique, Not Null | User email address |
| `hashed_password` | String(255) | Not Null | Securely hashed password |
| `role` | String(30) | Not Null | User role such as patient, caregiver, or admin |
| `is_active` | Boolean | Not Null | Indicates whether the account is active |
| `created_at` | DateTime | Not Null | Account creation timestamp |

---

## 2. Patient Profiles

### Table: `patient_profiles`

Stores additional profile information for patients.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Profile identifier |
| `user_id` | Integer | Foreign Key → `users.id`, Unique | Associated user |
| `full_name` | String(100) | Not Null | Patient's full name |
| `date_of_birth` | Date | Nullable | Patient's date of birth |
| `phone` | String(20) | Nullable | Contact number |
| `address` | String(255) | Nullable | Patient address |

### Relationship

```text
users 1 ───── 1 patient_profiles

---

## 3. Caregiver-Patient Assignment

### Table: `caregiver_patient`

Maps caregivers to the patients they are responsible for.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Assignment identifier |
| `caregiver_id` | Integer | Foreign Key → `users.id` | Caregiver user |
| `patient_id` | Integer | Foreign Key → `users.id` | Patient user |

### Relationship

```text
users (caregiver)
        │
        └──── caregiver_patient ────┐
                                    │
                              users (patient)

## 4. Medicines

### Table: `medicines`

Stores medicines assigned to patients.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Medicine identifier |
| `patient_id` | Integer | Foreign Key → `users.id` | Patient receiving the medicine |
| `name` | String(100) | Not Null | Medicine name |
| `dosage` | String(100) | Not Null | Prescribed dosage |
| `quantity` | Integer | Not Null | Available quantity |
| `frequency` | String(100) | Not Null | Medicine frequency |
| `start_date` | Date | Nullable | Medication start date |
| `end_date` | Date | Nullable | Medication end date |

### Relationship

```text
users 1 ───── N medicines

## 5. Dosage Schedules

### Table: `dosage_schedules`

Stores scheduled medication timings and dosage amounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Schedule identifier |
| `medicine_id` | Integer | Foreign Key → `medicines.id` | Associated medicine |
| `dosage_amount` | Integer | Not Null | Number of units/doses |
| `time_of_day` | Time | Not Null | Scheduled time |
| `frequency` | String(50) | Not Null | Schedule frequency |

### Relationship

```text
medicines 1 ───── N dosage_schedules

## 6. Prescriptions

### Table: `prescriptions`

Stores prescription information associated with patients and medicines.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Prescription identifier |
| `patient_id` | Integer | Foreign Key → `users.id` | Patient associated with prescription |
| `medicine_id` | Integer | Foreign Key → `medicines.id`, Nullable | Associated medicine |
| `prescription_number` | String(100) | Nullable | Prescription reference number |
| `doctor_name` | String(100) | Nullable | Prescribing doctor's name |
| `issue_date` | Date | Nullable | Prescription issue date |
| `expiry_date` | Date | Nullable | Prescription expiry date |

### Relationships

```text
users 1 ───── N prescriptions
medicines 1 ───── N prescriptions

## 7. Medical Conditions

### Table: `medical_conditions`

Stores diseases and medical conditions associated with patients.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | Condition identifier |
| `patient_id` | Integer | Foreign Key → `users.id` | Patient associated with condition |
| `condition_name` | String(100) | Not Null | Name of medical condition |
| `description` | String(255) | Nullable | Additional information |

### Relationship

```text
users 1 ───── N medical_conditions

## 8. Medication History

### Table: `medication_history`

Stores medication adherence history.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key | History record identifier |
| `patient_id` | Integer | Foreign Key → `users.id` | Patient associated with the record |
| `medicine_id` | Integer | Foreign Key → `medicines.id` | Medicine associated with the record |
| `scheduled_time` | DateTime | Not Null | Scheduled medication time |
| `taken` | Boolean | Not Null | Indicates whether the medicine was taken |
| `status` | String(20) | Not Null | Medication status such as pending |

### Relationships

```text
users 1 ───── N medication_history
medicines 1 ───── N medication_history
---

# Entity Relationship Overview

The main database relationships are:

```text
                         ┌──────────────────┐
                         │      users       │
                         │──────────────────│
                         │ id               │
                         │ username         │
                         │ email            │
                         │ role             │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
                    ▼             ▼              ▼
          ┌────────────────┐  ┌───────────┐  ┌──────────────────┐
          │patient_profiles│  │ medicines │  │medical_conditions│
          └────────────────┘  └─────┬─────┘  └──────────────────┘
                                     │
                       ┌─────────────┼─────────────┐
                       │             │             │
                       ▼             ▼             ▼
               ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
               │   dosage_    │ │prescriptions│ │medication_history│
               │  schedules   │ │             │ │                  │
               └──────────────┘ └─────────────┘ └──────────────────┘

                         ┌───────────────────┐
                         │ caregiver_patient │
                         └───────────────────┘
                           │             │
                           ▼             ▼
                     caregiver        patient
                        users            users

---

## Foreign Key Summary

| Table | Foreign Key | References |
|---|---|---|
| `patient_profiles` | `user_id` | `users.id` |
| `caregiver_patient` | `caregiver_id` | `users.id` |
| `caregiver_patient` | `patient_id` | `users.id` |
| `medicines` | `patient_id` | `users.id` |
| `dosage_schedules` | `medicine_id` | `medicines.id` |
| `prescriptions` | `patient_id` | `users.id` |
| `prescriptions` | `medicine_id` | `medicines.id` |
| `medical_conditions` | `patient_id` | `users.id` |
| `medication_history` | `patient_id` | `users.id` |
| `medication_history` | `medicine_id` | `medicines.id` |

---

## Database Initialization

The database tables are created using SQLAlchemy metadata:

```python
Base.metadata.create_all(bind=engine)
The database can be initialized using:

```powershell
python -m app.db.init_db
```

The database initialization completed successfully.

---

## PostgreSQL Verification

The finalized schema was verified against the PostgreSQL database.

The following tables were successfully detected:

```text
users
caregiver_patient
medical_conditions
medicines
patient_profiles
dosage_schedules
medication_history
prescriptions
```

All eight required database tables are available in PostgreSQL.

---

## Schema Status

**Status: Finalized**

The database schema provides the foundation for:

- Authentication
- Role-based access control
- Patient profile management
- Caregiver-patient assignments
- Medication management
- Dosage scheduling
- Prescription management
- Medical condition tracking
- Medication adherence history