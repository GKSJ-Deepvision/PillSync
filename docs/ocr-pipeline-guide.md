# PillSync — Prescription OCR & Medicine Information Extraction Guide
## Infosys Springboard Internship — Milestone 3 (Tasks 1 & 2)

---

## 1. Executive Summary & Review Demo Pitch

> **Infosys Springboard Review / Demo Pitch:**
> *"For Milestone 3 of the PillSync medication management platform, I have implemented an operational, end-to-end OCR and clinical medicine information extraction pipeline. The system allows patients and caregivers to upload prescription images in standard formats (JPG, PNG, WEBP). It applies adaptive computer vision preprocessing—including resolution scaling, grayscale conversion, contrast enhancement, and binarization—to maximize character legibility.
>
> Text recognition is powered by a real, localized installation of Tesseract OCR v5.4 wrapped via `pytesseract`. The extracted raw text is then processed by a multi-medicine clinical NLP extraction engine that combines regular expressions, word boundary normalization, and a curated medical drug lexicon of over 1,000 common brand and generic medications with fuzzy edit distance tolerance for OCR misspellings.
>
> For every recognized medicine, the system distinctly extracts the Medicine Name, Dosage strength, Quantity count, Frequency schedule, Duration of therapy, and Prescription instructions, while estimating extraction confidence without ever hallucinating missing values. The result is presented on an interactive web UI where users can inspect raw OCR text, review and edit extracted fields, and save them directly to the database. All 15 automated test cases, covering 13 distinct clinical scenarios plus API integration, pass with 100% success alongside the existing 17 authentication tests with zero regressions."*

---

## 2. OCR Technology & Justification

- **Engine**: **Tesseract OCR v5.4.0** (UB-Mannheim 64-bit build) via `pytesseract` 0.3.13 and `Pillow` 12.3.0.
- **Why Tesseract was selected**:
  1. **Internship Spec Alignment**: The PillSync project specification (`INTERN_GUIDE.md`, `backend/requirements/base.txt`, and Milestone 3 evaluation criteria) explicitly designates Tesseract OCR 5.x as the primary recognition engine.
  2. **Local Execution & Privacy**: Operates fully offline on the host machine without transmitting sensitive patient prescription imagery across external paid APIs (e.g. Google Cloud Vision or AWS Textract), adhering to healthcare data security best practices.
  3. **High Character Accuracy**: Tesseract 5.4 uses an LSTM-based deep neural network sequence recognition model trained on English medical and printed texts.
  4. **Multi-tier Dynamic Discovery**: The application detects Tesseract across environment variables, Django settings, standard Windows directories (`C:\Users\hp\tesseract-ocr\tesseract.exe`, `C:\Program Files\Tesseract-OCR\tesseract.exe`), and system PATH.

---

## 3. End-to-End Workflow Architecture

```
User Uploads Prescription Image
          ↓
[1. File Validation]
  - Extension check (JPG, JPEG, PNG, WEBP, PDF)
  - Size check (≤ 10 MB)
  - Image integrity verification via PIL
          ↓
[2. Image Preprocessing]
  - EXIF orientation auto-rotation
  - Resolution normalization (800px – 2500px DPI scaling)
  - Grayscale conversion
  - Contrast enhancement (1.8x factor)
  - Median smoothing & adaptive thresholding / binarization
          ↓
[3. Tesseract OCR Engine]
  - PSM 6 / PSM 3 page segmentation
  - Word-level confidence extraction via image_to_data
  - Dual-pass fallback: if preprocessed confidence is low, retry with original image
          ↓
[4. Text Cleaning & Normalization]
  - Clean merged tokens (e.g., "5daysafter" → "5 days after", "500mg" → "500 mg")
  - Hyphen and whitespace normalization
          ↓
[5. Clinical Medicine Information Extraction]
  - Multi-medicine segmentation (numbered lists, bullet points, line blocks)
  - Medicine Name: matched against 1,000+ drug lexicon with Levenshtein distance ≤ 2
  - Dosage: strength extraction (mg, mcg, g, ml, iu, puff, drops)
  - Quantity: separated from dosage (tablets, capsules, bottles, strips, units)
  - Frequency: normalized (Once daily, Twice daily, Every 8 hours, Night, etc.)
  - Duration: distinct timeframes (5 days, 7 days, 2 weeks, 1 month)
  - Prescription Details: administration timing (After food, Before food, With food)
          ↓
[6. Missing Data Rule & Safety Check]
  - Missing fields set to null ("Not detected") — NEVER hallucinate
  - Prominent Medical Disclaimer displayed
          ↓
[7. Display & Review UI]
  - Live thumbnail preview
  - Collapsible Raw OCR text drawer with confidence badge & copy button
  - Responsive table/cards with editable fields for each medicine
  - "+ Add Another Medicine" button
          ↓
[8. Database Persistence]
  - One-click save to Medication model via POST /api/ocr/save/
```

---

## 4. API Reference

### 1. Extract Prescription OCR
- **Endpoint**: `POST /api/ocr/extract/` (alias: `POST /api/prescription/ocr/`)
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `prescription_image` (File, required): The prescription image file (`.jpg`, `.jpeg`, `.png`, `.webp`).
- **Response Format (`200 OK`)**:
```json
{
  "success": true,
  "upload_id": 1,
  "raw_text": "Dr. Arthur Vance, MD\nRx:\n1. Paracetamol 500 mg - 1 tablet twice daily for 5 days after food\n2. Cetirizine 10 mg - 1 tablet once daily at night for 5 days",
  "mean_confidence": 85.5,
  "confidence_level": "High",
  "medicines": [
    {
      "medicine_name": "Paracetamol",
      "dosage": "500 mg",
      "quantity": "1 tablet",
      "frequency": "Twice daily",
      "duration": "5 days",
      "prescription_details": "After food",
      "confidence": "High"
    },
    {
      "medicine_name": "Cetirizine",
      "dosage": "10 mg",
      "quantity": "1 tablet",
      "frequency": "Once daily",
      "duration": "5 days",
      "prescription_details": "At night / bedtime",
      "confidence": "High"
    }
  ],
  "message": "Successfully recognized 2 medication(s) from prescription."
}
```

### 2. Save Reviewed Medications
- **Endpoint**: `POST /api/ocr/save/`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "medicines": [
    {
      "medicine_name": "Paracetamol",
      "dosage": "500 mg",
      "quantity": "1 tablet",
      "frequency": "Twice daily",
      "duration": "5 days",
      "prescription_details": "After food"
    }
  ]
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "saved_count": 1,
  "message": "Successfully saved 1 medication(s) to your medication tracker."
}
```

### 3. OCR Health Status
- **Endpoint**: `GET /api/ocr/status/`
- **Response (`200 OK`)**:
```json
{
  "status": "operational",
  "tesseract_installed": true,
  "tesseract_version": "5.4.0.20240606",
  "tesseract_path": "C:\\Users\\hp\\tesseract-ocr\\tesseract.exe",
  "engine": "Tesseract OCR v5.4"
}
```

---

## 5. Database Schema Changes

Two clean models were introduced without altering `authentication.User` or existing tables:

1. **`Medication` (`backend/apps/medications/models.py`)**:
   - `id`: Primary key
   - `user`: ForeignKey to User (optional)
   - `medicine_name`: CharField(255)
   - `dosage`: CharField(100, nullable)
   - `quantity`: CharField(100, nullable)
   - `frequency`: CharField(100, nullable)
   - `duration`: CharField(100, nullable)
   - `prescription_details`: TextField(nullable)
   - `confidence`: CharField(20)
   - `source`: CharField(50, default='OCR')
   - `created_at`, `updated_at`: DateTimeField

2. **`PrescriptionUpload` (`backend/apps/ocr/models.py`)**:
   - `id`: Primary key
   - `user`: ForeignKey to User (optional)
   - `image`: ImageField
   - `original_filename`: CharField(255)
   - `raw_text`: TextField
   - `status`: CharField (pending, completed, failed)
   - `confidence`: FloatField
   - `confidence_level`: CharField(20)
   - `extracted_data`: JSONField
   - `created_at`: DateTimeField

---

## 6. How to Run & Test

### Running the Application
```bash
# 1. Activate Virtual Environment
cd "C:\Users\hp\OneDrive\Documents\Milestone 3"
& "C:\Users\hp\OneDrive\Documents\PillSync1\venv\Scripts\Activate.ps1"

# 2. Run Django Development Server
python manage.py runserver 127.0.0.1:8000
```
Open your browser and navigate to:
👉 **`http://127.0.0.1:8000/ocr/`**

### Running the Automated Tests
```bash
# Run the complete test suite (Authentication + OCR Pipeline)
python test_runner.py

# Or run OCR pipeline tests specifically:
python test_runner.py backend.tests.test_ocr_pipeline
```

---

## 7. Automated Test Results Summary

| Test ID | Test Scenario | Status | Result |
|---|---|---|---|
| **TEST 1** | Single medicine prescription (`Paracetamol 500 mg`) | **PASSED** | Extracted name, dosage, qty, freq, duration, details |
| **TEST 2** | Multiple medicines in one prescription (3 Rx items) | **PASSED** | Segmented into 3 distinct records |
| **TEST 3** | Varied dosage formats (`500 mg`, `650mg`, `10 mg`, `5 ml`, `250 mcg`) | **PASSED** | Correct metric strength extracted |
| **TEST 4** | Frequency normalization (`Once daily`, `Twice daily`, `Every 8h`, `Night`) | **PASSED** | Normalized to canonical labels |
| **TEST 5** | Duration extraction (`5 days`, `7 days`, `2 weeks`, `1 month`) | **PASSED** | Separated distinctly from frequency |
| **TEST 6** | Before/After food instructions | **PASSED** | Extracted into prescription details |
| **TEST 7** | Blurred / low-quality image | **PASSED** | Handled gracefully with low confidence flag |
| **TEST 8** | Blank image / image with no prescription | **PASSED** | 422 Unprocessable Entity with clear error message |
| **TEST 9** | Unsupported file format (`.exe`, `.txt`) | **PASSED** | 400 Bad Request rejection with helpful alert |
| **TEST 10**| Missing dosage in prescription | **PASSED** | Returned as `null`, not guessed |
| **TEST 11**| Missing quantity in prescription | **PASSED** | Returned as `null`, not guessed |
| **TEST 12**| Missing frequency in prescription | **PASSED** | Returned as `null`, not guessed |
| **TEST 13**| Handwritten / stylized prescription | **PASSED** | Fuzzy drug dictionary resolved typos |
| **TEST 14**| End-to-end API upload and DB save flow | **PASSED** | Persisted to PostgreSQL `medications` table |
| **TEST 15**| Health check status endpoint | **PASSED** | Returned operational Tesseract status |
| **REGRESSION**| Existing Authentication tests (17 tests) | **PASSED** | Zero regressions across authentication app |

---

## 8. Known Limitations
1. **Extreme Doctor Cursive Handwriting**: Highly stylized cursive handwriting with illegible letterforms cannot be 100% deciphered by any OCR engine without clinical human review. The system handles this gracefully by showing the raw recognized text, flagging low confidence, and allowing users to edit fields before saving.
2. **Complex Multi-Column Tables**: Unconventional tabular forms may require minor manual review on the editable table before final submission.
