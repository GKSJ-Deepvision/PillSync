# Milestone 2 — Medication Management & Reminder System (Week 3–4)

* **Intern:** Ruchitha Puru
* **Branch:** `intern/20-ruchitha-puru`
* **Submitted on:** 2026-09-15

## Evaluation criteria

| Criterion                                                | Status        | Evidence                                                                                                                                                          |
| -------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medicine management operational                          | ✅ Done        | `backend/apps/medications/` — medicine model, CRUD APIs, stock quantity, disease categories, patient ownership, validation, and connected React medicine workflow |
| Dosage scheduling (morning / afternoon / night, repeats) | — Not my task | Assigned to the dosage scheduling intern                                                                                                                          |
| Reminder scheduling system functional                    | — Not my task | Assigned to the reminder system intern                                                                                                                            |
| Reminder actions: Taken / Missed / Snooze                | — Not my task | Assigned to the reminder system intern                                                                                                                            |
| Medication history tracking implemented                  | — Not my task | Assigned to the medication tracking intern                                                                                                                        |
| Notification workflows integrated (push / email / SMS)   | — Not my task | Assigned to the notification integration intern                                                                                                                   |
| Multiple patient profiles for families                   | — Not my task | Assigned to the relevant profile/family workflow intern                                                                                                           |

## What I built

My assigned Milestone 2 task was the **Medicine Management Workflow**.

I implemented the medicine management feature using **Django REST Framework**.

The Medicine model stores:

* Medicine name
* Generic name
* Dosage
* Dosage form
* Quantity
* Disease category
* Active/inactive status
* Patient ownership

I implemented the complete medicine workflow:

* Create medicine
* View all medicines
* View one medicine
* Update medicine
* Partially update medicine
* Delete medicine
* Search medicines by name or disease category from the webpage

I also added:

* Patient ownership
* Role-based access protection
* Quantity/stock tracking
* Disease-based categorization
* Input validation

The six disease categories used are:

* Blood Pressure
* Diabetes
* Thyroid
* Antibiotics
* Vitamins
* Heart Conditions

The medicine pages in the React frontend were connected to the Django backend, so the medicine data is stored and retrieved from the backend instead of using only mock data.

## Backend implementation

The main backend files are:

```text
backend/apps/medications/models.py
backend/apps/medications/serializers.py
backend/apps/medications/views.py
backend/apps/medications/urls.py
backend/apps/medications/migrations/0001_initial.py
backend/apps/medications/tests/test_api.py
backend/apps/medications/tests/test_models.py
```

### API workflow

```text
POST   /api/medications/
GET    /api/medications/
GET    /api/medications/{id}/
PUT    /api/medications/{id}/
PATCH  /api/medications/{id}/
DELETE /api/medications/{id}/
```

The authenticated patient's ID is assigned automatically by the backend when a medicine is created.

## Frontend integration

The medicine frontend uses:

```text
frontend/src/api/medications.js
frontend/src/features/medications/pages/MedicationsPage.jsx
frontend/src/features/medications/pages/MedicationFormPage.jsx
frontend/src/features/medications/pages/MedicationDetailPage.jsx
```

The React frontend sends requests to the Django API:

```text
React webpage
    ↓
medications.js
    ↓
Django REST API
    ↓
MedicineViewSet
    ↓
MedicineSerializer
    ↓
Medicine model
    ↓
Database
```

The result is returned to the webpage and displayed to the user.

## Reminder and notification design

Reminder scheduling, reminder actions, notification delivery, and medication history were not part of my assigned task.

These features are assigned to other team members.

## How to run and verify it

### Backend

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

For local development, set the Django secret in the terminal before starting the server if it is not already configured:

```cmd
set SECRET_KEY=your-local-development-secret
python manage.py runserver
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173/
```

### Medicine Management workflow

1. Log in as a patient.
2. Open **Prescriptions / My Medicines**.
3. Click **Add Medicine**.
4. Enter the medicine details.
5. Save the medicine.
6. Verify that it appears in **My Medicines**.
7. Use the search box to find a medicine.
8. Open **View Details**.
9. Edit the medicine details.
10. Verify the updated information.
11. Delete the medicine.
12. Verify that it is removed.

## Tests

### Backend tests

Test files:

```text
backend/apps/medications/tests/test_api.py
backend/apps/medications/tests/test_models.py
```

The tests cover:

* Medicine creation
* Viewing all medicines
* Viewing one medicine
* Updating medicine
* Partial updates
* Deleting medicine
* Patient ownership
* Role protection
* Negative quantity validation
* Negative dosage validation
* Required medicine name validation
* Invalid disease category validation

### Test result

```text
19 passed
```

### Security scan

```text
No credentials detected.
```

### Frontend verification

The Medicine Management webpage was verified for:

```text
Add → View → Search → Update → Delete
```

## Blockers and open questions

None for the Medicine Management Workflow.

Dosage scheduling, reminder scheduling, reminder actions, medication history, notification workflows, and multiple patient profiles are outside the scope of my assigned task.
