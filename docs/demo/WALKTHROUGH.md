# PillSync End-to-End Walkthrough Script

This script walks through the complete end-to-end medication management workflow in PillSync.

## Demo Sequence

### Step 1: User Login & Authentication
1. Navigate to `http://localhost:5173/login`.
2. Login with patient credentials (`patient@pillsync.com` / `Password123!`).
3. Verify landing on main Dashboard with live stats and upcoming doses.

### Step 2: Prescription OCR Upload
1. Navigate to **Upload Prescription** (`/ocr-upload`).
2. Upload a prescription document image or sample text.
3. Observe automatic extraction of medicine name, dosage, frequency, and food timing.
4. Click **Confirm & Add to My Medications** to save to database.

### Step 3: Medication Inventory Management
1. Navigate to **My Medications** (`/medications`).
2. Search OpenFDA drug database using search input (e.g., `Lisinopril` or `Metformin`).
3. Click **Add Medication** to manually register a new prescription.
4. Test taking a dose manually using **Take Dose** button (stock decreases by 1 unit).

### Step 4: Reminders & Dosage Confirmations
1. Navigate to **Reminders** (`/reminders`).
2. View dosage time slots grouped by Morning, Afternoon, Evening, and Night.
3. Click **Mark Taken** to log dose intake in database.
4. Test **Snooze (+15m)** functionality.

### Step 5: AI Stock Depletion & Refill Predictions
1. Navigate to **Refill Engine** (`/refills`).
2. Inspect stock progress bars showing current stock vs total capacity and calculated depletion date.
3. Click **Request Refill Order** to place automated pharmacy refill order.
4. Adjust stock manually using **Update Stock** button.

### Step 6: Analytics Dashboard & Reports
1. Navigate to **Analytics** (`/analytics`).
2. Review 7-day adherence area chart, dose status distribution pie chart, and medication compliance breakdown.
3. Click **Export Report** to generate Adherence Compliance summary report.
