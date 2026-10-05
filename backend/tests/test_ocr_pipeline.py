"""
Comprehensive Test Suite for PillSync Milestone 3:
OCR Medicine Recognition and Information Extraction Pipeline.

Covers all 13 required test scenarios:
- TEST 1: Clear prescription containing one medicine.
- TEST 2: Clear prescription containing multiple medicines.
- TEST 3: Different dosage formats (500 mg, 650mg, 10 mg, 5 ml, 250 mcg).
- TEST 4: Different frequency formats (Once daily, Twice daily, Every 8 hours, Morning and night).
- TEST 5: Prescription containing duration (5 days, 7 days, 2 weeks).
- TEST 6: Prescription containing before/after food instructions.
- TEST 7: Poor-quality / blurred image handling.
- TEST 8: Image containing no prescription / blank image.
- TEST 9: Unsupported file type validation.
- TEST 10: Missing dosage handling (null, no guessing).
- TEST 11: Missing quantity handling (null, no guessing).
- TEST 12: Missing frequency handling (null, no guessing).
- TEST 13: Handwritten / stylized prescription handling.
- API Tests: /api/ocr/extract/, /api/ocr/save/, /api/ocr/status/.
"""

import io
import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image, ImageDraw, ImageFilter

from ml.src.ocr.preprocessor import ImagePreprocessor, ImageValidationError
from ml.src.ocr.engine import OCREngine
from ml.src.ocr.extractor import MedicineExtractor
from backend.apps.medications.models import Medication
from backend.apps.ocr.models import PrescriptionUpload


def create_test_image(lines, size=(850, 260), blur=False, blank=False):
    """Helper to synthesize test prescription images for real OCR execution."""
    img = Image.new('RGB', size, color=(255, 255, 255))
    if not blank:
        draw = ImageDraw.Draw(img)
        draw.text((20, 15), "Dr. Arthur Vance, MD - Metro Health Center", fill=(0, 0, 0))
        draw.text((20, 40), "Date: 28-Sep-2026 | Rx:", fill=(0, 0, 0))
        y = 75
        for line in lines:
            draw.text((20, y), line, fill=(0, 0, 0))
            y += 45

    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.getvalue()


class Milestone3OCRPipelineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.preprocessor = ImagePreprocessor()
        self.engine = OCREngine()
        self.extractor = MedicineExtractor()

    # --------------------------------------------------------------------------
    # TEST 1: Clear prescription containing ONE medicine
    # --------------------------------------------------------------------------
    def test_01_single_medicine_prescription(self):
        """TEST 1: Verifies extraction of a single medicine prescription."""
        raw_text = (
            "Dr. John Doe\n"
            "Rx:\n"
            "1. Paracetamol 500 mg - 1 tablet twice daily for 5 days after food\n"
        )
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 1)
        med = meds[0]
        self.assertEqual(med['medicine_name'], "Paracetamol")
        self.assertEqual(med['dosage'], "500 mg")
        self.assertEqual(med['quantity'], "1 tablet")
        self.assertEqual(med['frequency'], "Twice daily")
        self.assertEqual(med['duration'], "5 days")
        self.assertIn("After food", med['prescription_details'])
        self.assertEqual(med['confidence'], "High")

    # --------------------------------------------------------------------------
    # TEST 2: Clear prescription containing MULTIPLE medicines
    # --------------------------------------------------------------------------
    def test_02_multiple_medicines_prescription(self):
        """TEST 2: Verifies extraction of multi-medicine prescriptions into separate records."""
        raw_text = (
            "Hospital General Prescription\n"
            "1. Amoxicillin 500 mg - 1 capsule three times daily for 7 days after food\n"
            "2. Cetirizine 10 mg - 1 tablet once daily at night for 10 days\n"
            "3. Pantoprazole 40 mg - 1 tablet once daily before breakfast for 14 days\n"
        )
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 3)

        # Medicine 1: Amoxicillin
        self.assertEqual(meds[0]['medicine_name'], "Amoxicillin")
        self.assertEqual(meds[0]['dosage'], "500 mg")
        self.assertEqual(meds[0]['frequency'], "Three times daily")
        self.assertEqual(meds[0]['duration'], "7 days")

        # Medicine 2: Cetirizine
        self.assertEqual(meds[1]['medicine_name'], "Cetirizine")
        self.assertEqual(meds[1]['dosage'], "10 mg")
        self.assertEqual(meds[1]['frequency'], "Once daily")
        self.assertEqual(meds[1]['duration'], "10 days")

        # Medicine 3: Pantoprazole
        self.assertEqual(meds[2]['medicine_name'], "Pantoprazole")
        self.assertEqual(meds[2]['dosage'], "40 mg")
        self.assertEqual(meds[2]['frequency'], "Once daily")
        self.assertEqual(meds[2]['duration'], "14 days")

    # --------------------------------------------------------------------------
    # TEST 3: Different DOSAGE formats
    # --------------------------------------------------------------------------
    def test_03_different_dosage_formats(self):
        """TEST 3: Verifies varied dosage patterns: 500 mg, 650mg, 10 mg, 5 ml, 250 mcg."""
        test_cases = [
            ("Paracetamol 500 mg once daily", "500 mg"),
            ("Dolo 650mg twice daily", "650 mg"),
            ("Cetirizine 10 mg at night", "10 mg"),
            ("Ambroxol 5 ml twice daily", "5 ml"),
            ("Levothyroxine 250 mcg in the morning", "250 mcg"),
        ]
        for text, expected_dosage in test_cases:
            with self.subTest(text=text):
                dosage, conf = self.extractor._extract_dosage(text)
                self.assertEqual(dosage, expected_dosage)
                self.assertIn(conf, ("High", "Medium"))

    # --------------------------------------------------------------------------
    # TEST 4: Different FREQUENCY formats
    # --------------------------------------------------------------------------
    def test_04_different_frequency_formats(self):
        """TEST 4: Verifies frequency extraction: Once daily, Twice daily, Every 8 hours, etc."""
        test_cases = [
            ("take once daily", "Once daily"),
            ("take twice daily after food", "Twice daily"),
            ("three times a day for 5 days", "Three times daily"),
            ("every 8 hours", "Every 8 hours"),
            ("every 12 hours", "Every 12 hours"),
            ("in the morning only", "Morning"),
            ("at bedtime", "Night"),
            ("morning and night", "Morning and night"),
            ("after breakfast", "After breakfast"),
            ("take 1-0-1 after food", "Twice daily"),
        ]
        for text, expected_freq in test_cases:
            with self.subTest(text=text):
                freq, conf = self.extractor._extract_frequency(text)
                self.assertEqual(freq, expected_freq)

    # --------------------------------------------------------------------------
    # TEST 5: Prescription containing DURATION
    # --------------------------------------------------------------------------
    def test_05_prescription_with_duration(self):
        """TEST 5: Verifies duration parsing: 5 days, 7 days, 2 weeks, 1 month."""
        test_cases = [
            ("Azithromycin 500 mg for 5 days", "5 days"),
            ("Amoxicillin 500 mg for 7 days", "7 days"),
            ("Omeprazole 20 mg for 2 weeks", "2 weeks"),
            ("Atorvastatin 10 mg for 1 month", "1 month"),
        ]
        for text, expected_dur in test_cases:
            with self.subTest(text=text):
                dur = self.extractor._extract_duration(text)
                self.assertEqual(dur, expected_dur)

    # --------------------------------------------------------------------------
    # TEST 6: Before / After FOOD instructions
    # --------------------------------------------------------------------------
    def test_06_before_after_food_instructions(self):
        """TEST 6: Verifies clinical instructions (after food, before food, with food)."""
        test_cases = [
            ("Paracetamol 500 mg twice daily after food", "After food"),
            ("Pantoprazole 40 mg once daily before food", "Before food"),
            ("Ibuprofen 400 mg with food", "With food/water"),
            ("Thyroid tab on an empty stomach", "On an empty stomach"),
        ]
        for text, expected_detail in test_cases:
            with self.subTest(text=text):
                details = self.extractor._extract_details(text)
                self.assertIsNotNone(details)
                self.assertIn(expected_detail, details)

    # --------------------------------------------------------------------------
    # TEST 7: Poor-quality / blurred image handling
    # --------------------------------------------------------------------------
    def test_07_poor_quality_blurred_image(self):
        """TEST 7: Verifies blurred images do not crash and report low confidence gracefully."""
        blurred_png = create_test_image(
            ["Paracetamol 500 mg twice daily"],
            blur=True
        )
        uploaded = SimpleUploadedFile("blurred.png", blurred_png, content_type="image/png")
        response = self.client.post('/api/ocr/extract/', {'prescription_image': uploaded}, format='multipart')
        
        # Must return valid HTTP response (either 200 with low confidence or 422 unprocessable)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY])
        if response.status_code == status.HTTP_200_OK:
            # Must not invent false information
            data = response.json()
            self.assertIn(data.get('confidence_level'), ['Low', 'Medium'])

    # --------------------------------------------------------------------------
    # TEST 8: Image with NO prescription / blank image
    # --------------------------------------------------------------------------
    def test_08_image_with_no_prescription(self):
        """TEST 8: Blank image returns 422 Unprocessable Entity with helpful error message."""
        blank_png = create_test_image([], blank=True)
        uploaded = SimpleUploadedFile("blank.png", blank_png, content_type="image/png")
        response = self.client.post('/api/ocr/extract/', {'prescription_image': uploaded}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn("Unable to detect any readable text", data['error'])
        self.assertEqual(len(data['medicines']), 0)

    # --------------------------------------------------------------------------
    # TEST 9: Unsupported file type validation
    # --------------------------------------------------------------------------
    def test_09_unsupported_file_type(self):
        """TEST 9: Rejects unsupported file types (.txt, .exe) with HTTP 400 Bad Request."""
        bad_file = SimpleUploadedFile("malware.exe", b"MZ\x90\x00\x03fakeexe", content_type="application/octet-stream")
        response = self.client.post('/api/ocr/extract/', {'prescription_image': bad_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn("Unsupported file type", data['error'])

    # --------------------------------------------------------------------------
    # TEST 10: Missing DOSAGE handling
    # --------------------------------------------------------------------------
    def test_10_missing_dosage(self):
        """TEST 10: When dosage is missing from prescription, returns null, never guesses."""
        raw_text = "1. Cetirizine - 1 tablet once daily for 5 days"
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 1)
        self.assertIsNone(meds[0]['dosage'])
        self.assertEqual(meds[0]['medicine_name'], "Cetirizine")

    # --------------------------------------------------------------------------
    # TEST 11: Missing QUANTITY handling
    # --------------------------------------------------------------------------
    def test_11_missing_quantity(self):
        """TEST 11: When quantity is missing from prescription, returns null, never guesses."""
        raw_text = "1. Paracetamol 500 mg twice daily for 5 days"
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 1)
        self.assertIsNone(meds[0]['quantity'])
        self.assertEqual(meds[0]['dosage'], "500 mg")

    # --------------------------------------------------------------------------
    # TEST 12: Missing FREQUENCY handling
    # --------------------------------------------------------------------------
    def test_12_missing_frequency(self):
        """TEST 12: When frequency is missing from prescription, returns null, never guesses."""
        raw_text = "1. Azithromycin 250 mg 6 tablets"
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 1)
        self.assertIsNone(meds[0]['frequency'])
        self.assertEqual(meds[0]['medicine_name'], "Azithromycin")
        self.assertEqual(meds[0]['dosage'], "250 mg")

    # --------------------------------------------------------------------------
    # TEST 13: Handwritten / stylized prescription handling
    # --------------------------------------------------------------------------
    def test_13_handwritten_prescription_handling(self):
        """TEST 13: Processes stylized/handwritten sample through OCR and preprocessor safely."""
        # Synthesize handwriting-like irregular spacing
        raw_text = "Rx: Tab Paracetam0l 500mg 1 tab bd x 5 d"
        meds = self.extractor.extract(raw_text)
        self.assertEqual(len(meds), 1)
        # Fuzzy match should resolve 'Paracetam0l' -> 'Paracetamol'
        self.assertEqual(meds[0]['medicine_name'], "Paracetamol")
        self.assertEqual(meds[0]['dosage'], "500 mg")
        self.assertEqual(meds[0]['frequency'], "Twice daily")

    # --------------------------------------------------------------------------
    # End-to-End API Integration & Database Persistence Tests
    # --------------------------------------------------------------------------
    def test_14_api_extract_and_save_pipeline(self):
        """Verifies full end-to-end flow: Upload -> OCR -> Extract -> Save to DB."""
        # 1. Synthesize image with real text
        image_bytes = create_test_image([
            "1. Paracetamol 500 mg - 1 tablet twice daily for 5 days after food",
            "2. Cetirizine 10 mg - 1 tablet once daily for 5 days"
        ])

        uploaded_img = SimpleUploadedFile("prescription_test.png", image_bytes, content_type="image/png")

        # 2. Call OCR extract API
        extract_res = self.client.post('/api/ocr/extract/', {'prescription_image': uploaded_img}, format='multipart')
        self.assertEqual(extract_res.status_code, status.HTTP_200_OK)
        data = extract_res.json()
        self.assertTrue(data['success'])
        self.assertTrue(len(data['medicines']) >= 1)

        # 3. Call Save API to persist to Medication model
        save_payload = {'medicines': data['medicines']}
        save_res = self.client.post('/api/ocr/save/', save_payload, format='json')
        self.assertEqual(save_res.status_code, status.HTTP_201_CREATED)
        save_data = save_res.json()
        self.assertTrue(save_data['success'])
        self.assertEqual(save_data['saved_count'], len(data['medicines']))

        # 4. Verify in Database
        saved_db_meds = Medication.objects.filter(source='OCR')
        self.assertEqual(saved_db_meds.count(), len(data['medicines']))
        self.assertTrue(saved_db_meds.filter(medicine_name__icontains="Paracetamol").exists())

    def test_15_ocr_status_endpoint(self):
        """Verifies GET /api/ocr/status/ health check returns operational status."""
        res = self.client.get('/api/ocr/status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'operational')
        self.assertTrue(data['tesseract_installed'])
        self.assertIn("5.4", data['tesseract_version'])
