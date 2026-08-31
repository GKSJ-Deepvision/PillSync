# PillSync - Medication Management & Database

This is my part of the **PillSync project**, where I worked on the medication management and database module.

I used the provided medicine CSV file as the main medicine catalog and built the database structure around it. The module handles medicines, patients, prescriptions, dosage schedules, and medication history.

## Dataset

The medicine data is available in:

`data/medicines.csv`

The dataset contains:

* 718 medicine records
* 13 columns
* No duplicate records
* No missing values

I used this dataset as the **master medicine catalog** for the application.

## Tech Used

* Python
* FastAPI
* SQLite
* PostgreSQL-compatible SQL schema

## Database

I divided the database into different tables based on their purpose.

The main tables are:

* `medicines` - stores the medicine information from the CSV
* `patients` - stores patient details
* `prescriptions` - stores prescription information
* `prescription_medicines` - connects prescriptions with medicines
* `dosage_schedules` - stores when and how a patient should take a medicine
* `medication_history` - keeps track of medication-related events

The relationships are mainly:

```text
Patient
   |
   |-- Prescriptions
   |
   |-- Dosage Schedules
   |
   |-- Medication History

Prescription
   |
   |-- Prescription Medicines
            |
            |-- Medicines
```

This makes it easier to keep patient data and medicine data separate and avoids unnecessary duplication.

## Running the Project

Create a virtual environment:

```bash
python -m venv .venv
```

For Windows:

```bash
.venv\Scripts\activate
```

For macOS/Linux:

```bash
source .venv/bin/activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Run the FastAPI application:

```bash
uvicorn app.main:app --reload
```

Once the server is running, open:

`http://127.0.0.1:8000/docs`

This opens the FastAPI Swagger page where all the APIs can be tested.

The SQLite database `pillsync.db` is created automatically when the application is run for the first time. The medicine records from `medicines.csv` are also loaded into the database automatically.

## APIs

Some of the APIs available in this module are:

```text
GET  /medicines
GET  /medicines/{medicine_id}

POST /patients
GET  /patients/{patient_id}

POST /prescriptions
POST /prescriptions/medicines
GET  /patients/{patient_id}/prescriptions

POST /schedules
GET  /patients/{patient_id}/schedules

POST /medication-history
GET  /patients/{patient_id}/medication-history

GET  /patients/{patient_id}/adherence
```

These APIs are used to add and retrieve medicine, patient, prescription, schedule, and medication-history information.

## One Important Point

The `medicines.csv` file is the original medicine dataset provided for the project. I used it as the master medicine catalog.

The patient details, prescriptions, dosage schedules, and medication history are **application data** created while using the system. They are not part of the original CSV dataset.

So, in simple terms:

**CSV → Medicine Master Data → Database → Patient & Medication Management**
