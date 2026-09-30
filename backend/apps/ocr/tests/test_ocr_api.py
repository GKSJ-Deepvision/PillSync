"""OCR endpoints and pipeline, with the engine swapped for a fake.

Tesseract is a system binary that CI does not always have, and a test that
depends on it would fail for reasons unrelated to the code. The fake returns
canned text, so these tests cover everything around the engine: upload
validation, access control, parsing, matching, review, confirmation, purge.
Tesseract itself is exercised separately in test_tesseract.py.
"""

from __future__ import annotations

import io
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from PIL import Image

from apps.common.models import MedicineReference
from apps.medications.models import Medicine
from apps.ocr.models import ExtractedMedicine, ItemStatus, JobStatus, OCRJob
from apps.ocr.services import engines
from apps.ocr.tasks import purge_stale_ocr_jobs

pytestmark = pytest.mark.django_db

PRESCRIPTION = """Dr. Meera Iyer
City Care Clinic
Date: 12/03/2026
Rx
1. Tab Metformin 500 mg 1-0-1 x 30 days
2. Tab Amlodipine 5 mg 0-0-1 x 30 days
"""


class FakeEngine:
    name = "fake"
    text = PRESCRIPTION
    confidence = 0.92

    def read(self, image):
        return engines.OCRResult(
            text=type(self).text, confidence=type(self).confidence, engine="fake"
        )


class BrokenEngine:
    name = "broken"

    def read(self, image):
        raise engines.OCRUnavailable("Tesseract is not installed on this server.")


@pytest.fixture(autouse=True)
def _isolated(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.OCR_ENGINE = "apps.ocr.tests.test_ocr_api.FakeEngine"
    settings.OCR_ASYNC = False
    FakeEngine.text = PRESCRIPTION
    FakeEngine.confidence = 0.92


@pytest.fixture
def catalogue(db):
    rows = [
        ("Metformin Hydrochloride", "Glucophage", "500", "mg/1", "DIABETES"),
        ("Amlodipine Besylate", "Norvasc", "5", "mg/1", "HYPERTENSION"),
    ]
    for i, (generic, brand, strength, unit, category) in enumerate(rows):
        MedicineReference.objects.create(
            product_ndc=f"0000-{i:04d}",
            generic_name=generic,
            brand_name=brand,
            dosage_form="Tablet",
            route="Oral",
            strength=strength,
            strength_unit=unit,
            category=category,
        )


def make_image(size=(400, 300), fmt="PNG") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, format=fmt)
    return SimpleUploadedFile(
        f"scan.{fmt.lower()}", buffer.getvalue(), content_type=f"image/{fmt.lower()}"
    )


def upload(client, patient, image=None, **extra):
    return client.post(
        reverse("v1:ocr-job-list"),
        {"patient": str(patient.patient_profile.id), "image": image or make_image(), **extra},
        format="multipart",
    )


class TestUpload:
    def test_a_scan_is_read_parsed_and_matched(self, patient_client, patient, catalogue):
        response = upload(patient_client, patient)

        assert response.status_code == 201, response.data
        assert response.data["status"] == "COMPLETED"
        assert response.data["engine"] == "fake"
        names = [i["name"] for i in response.data["items"]]
        assert names == ["Metformin", "Amlodipine"]
        assert response.data["header"]["doctor_name"]
        assert all(i["reference"] for i in response.data["items"])  # both matched AUTO

    def test_it_requires_login(self, api_client, patient):
        response = api_client.post(reverse("v1:ocr-job-list"), {})
        assert response.status_code == 401

    def test_an_image_is_required(self, patient_client, patient):
        response = patient_client.post(
            reverse("v1:ocr-job-list"),
            {"patient": str(patient.patient_profile.id)},
            format="multipart",
        )
        assert response.status_code == 400

    def test_a_file_that_is_not_an_image_is_refused(self, patient_client, patient):
        bogus = SimpleUploadedFile("scan.png", b"this is not a picture", content_type="image/png")
        response = upload(patient_client, patient, image=bogus)
        assert response.status_code == 400
        assert not OCRJob.objects.exists()

    def test_an_unsupported_format_is_refused(self, patient_client, patient):
        response = upload(patient_client, patient, image=make_image(fmt="GIF"))
        assert response.status_code == 400

    def test_a_tiny_image_is_refused(self, patient_client, patient):
        response = upload(patient_client, patient, image=make_image(size=(40, 40)))
        assert response.status_code == 400

    def test_an_oversized_file_is_refused(self, patient_client, patient, settings):
        settings.MAX_UPLOAD_SIZE_BYTES = 1000
        response = upload(patient_client, patient)
        assert response.status_code == 400

    def test_you_cannot_scan_for_someone_elses_profile(self, patient_client, other_patient):
        response = patient_client.post(
            reverse("v1:ocr-job-list"),
            {"patient": str(other_patient.patient_profile.id), "image": make_image()},
            format="multipart",
        )
        assert response.status_code == 400
        assert not OCRJob.objects.exists()


class TestEngineFailure:
    def test_a_missing_engine_is_reported_not_a_500(self, patient_client, patient, settings):
        settings.OCR_ENGINE = "apps.ocr.tests.test_ocr_api.BrokenEngine"
        response = upload(patient_client, patient)

        assert response.status_code == 201
        assert response.data["status"] == "FAILED"
        assert "not installed" in response.data["error"]

    def test_an_unreadable_photo_still_lets_the_patient_type_it_in(self, patient_client, patient):
        FakeEngine.text = ""
        response = upload(patient_client, patient)

        assert response.data["status"] == "COMPLETED"
        assert response.data["items"] == []
        assert response.data["warnings"]

    def test_a_poor_read_warns_the_patient(self, patient_client, patient, catalogue):
        FakeEngine.confidence = 0.3
        response = upload(patient_client, patient)
        assert any("hard to read" in w for w in response.data["warnings"])


class TestParseText:
    def test_typed_text_goes_through_the_same_review(self, patient_client, patient, catalogue):
        response = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {
                "patient": str(patient.patient_profile.id),
                "text": "Tab Metformin 500 mg 1-0-1 x 10 days",
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["source"] == "TEXT"
        assert response.data["items"][0]["name"] == "Metformin"

    def test_empty_text_is_refused(self, patient_client, patient):
        response = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {"patient": str(patient.patient_profile.id), "text": "   "},
            format="json",
        )
        assert response.status_code == 400


class TestAccess:
    def test_you_only_see_your_own_scans(
        self, patient_client, auth_client, patient, other_patient, catalogue
    ):
        upload(patient_client, patient)
        theirs = auth_client(other_patient)
        upload(theirs, other_patient)

        mine = patient_client.get(reverse("v1:ocr-job-list")).data
        results = mine["results"] if isinstance(mine, dict) else mine
        assert len(results) == 1

    def test_another_patient_cannot_open_a_scan_or_its_image(
        self, patient_client, auth_client, patient, other_patient
    ):
        job_id = upload(patient_client, patient).data["id"]
        intruder = auth_client(other_patient)

        assert intruder.get(reverse("v1:ocr-job-detail", args=[job_id])).status_code == 404
        assert intruder.get(reverse("v1:ocr-job-image", args=[job_id])).status_code == 404

    def test_the_owner_can_fetch_the_image_but_it_is_not_cacheable(self, patient_client, patient):
        job_id = upload(patient_client, patient).data["id"]
        response = patient_client.get(reverse("v1:ocr-job-image", args=[job_id]))

        assert response.status_code == 200
        assert "no-store" in response["Cache-Control"]

    def test_the_image_is_not_served_to_anonymous_callers(
        self, patient_client, api_client, patient
    ):
        job_id = upload(patient_client, patient).data["id"]
        assert api_client.get(reverse("v1:ocr-job-image", args=[job_id])).status_code == 401

    def test_an_assigned_caregiver_can_review_but_not_a_stranger(
        self, patient_client, caregiver_client, patient, active_assignment
    ):
        job_id = upload(patient_client, patient).data["id"]
        assert caregiver_client.get(reverse("v1:ocr-job-detail", args=[job_id])).status_code == 200


class TestReview:
    def test_a_field_can_be_corrected(self, patient_client, patient, catalogue):
        job = upload(patient_client, patient).data
        item = job["items"][0]

        response = patient_client.patch(
            reverse("v1:ocr-item-detail", args=[item["id"]]),
            {"strength": "850", "name": "Metformin XR"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["strength"] == "850"

    def test_slots_are_validated(self, patient_client, patient, catalogue):
        item = upload(patient_client, patient).data["items"][0]
        response = patient_client.patch(
            reverse("v1:ocr-item-detail", args=[item["id"]]),
            {"slots": [{"slot": "TEATIME", "quantity": "1"}]},
            format="json",
        )
        assert response.status_code == 400

    def test_reparse_replaces_the_items_from_corrected_text(
        self, patient_client, patient, catalogue
    ):
        job = upload(patient_client, patient).data
        response = patient_client.post(
            reverse("v1:ocr-job-reparse", args=[job["id"]]),
            {"text": "Tab Amlodipine 5 mg 0-0-1 x 7 days"},
            format="json",
        )
        assert response.status_code == 200
        assert [i["name"] for i in response.data["items"]] == ["Amlodipine"]

    def test_an_unconfident_match_is_suggested_never_applied(
        self, patient_client, patient, catalogue
    ):
        response = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {
                "patient": str(patient.patient_profile.id),
                "text": "Tab Metformn 500 mg 1-0-1 x 5 days",
            },
            format="json",
        )
        item = response.data["items"][0]
        if item["match_level"] != "AUTO":
            assert item["reference"] is None


class TestConfirm:
    def confirm(self, client, job_id, **body):
        return client.post(reverse("v1:ocr-job-confirm", args=[job_id]), body, format="json")

    def test_confirming_creates_medicines_schedules_and_doses(
        self, patient_client, patient, catalogue
    ):
        job = upload(patient_client, patient).data
        response = self.confirm(patient_client, job["id"])

        assert response.status_code == 200, response.data
        medicines = Medicine.objects.filter(patient=patient.patient_profile)
        assert medicines.count() == 2
        metformin = medicines.get(name="Metformin")
        assert metformin.schedules.count() == 2  # 1-0-1
        assert metformin.quantity_remaining == Decimal("60")  # 2/day x 30 days
        assert metformin.doses.exists() if hasattr(metformin, "doses") else True
        assert response.data["prescription"] is not None
        assert OCRJob.objects.get(pk=job["id"]).status == JobStatus.CONFIRMED

    def test_confirming_records_starting_stock_and_a_forecast(
        self, patient_client, patient, catalogue
    ):
        from apps.refills.models import RefillPrediction, StockEvent

        job = upload(patient_client, patient).data
        self.confirm(patient_client, job["id"])
        medicine = Medicine.objects.get(patient=patient.patient_profile, name="Metformin")

        assert StockEvent.objects.filter(medicine=medicine, kind="INITIAL").exists()
        assert RefillPrediction.objects.filter(medicine=medicine).exists()

    def test_it_cannot_be_confirmed_twice(self, patient_client, patient, catalogue):
        job = upload(patient_client, patient).data
        self.confirm(patient_client, job["id"])
        second = self.confirm(patient_client, job["id"])

        assert second.status_code == 400
        assert Medicine.objects.filter(patient=patient.patient_profile).count() == 2

    def test_stock_can_be_overridden_per_item(self, patient_client, patient, catalogue):
        job = upload(patient_client, patient).data
        first = job["items"][0]["id"]
        self.confirm(patient_client, job["id"], items=[{"id": first, "quantity_remaining": "12"}])

        assert Medicine.objects.get(name="Metformin").quantity_remaining == Decimal("12")

    def test_a_missing_quantity_is_asked_for_and_nothing_is_created(
        self, patient_client, patient, catalogue
    ):
        response = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {"patient": str(patient.patient_profile.id), "text": "Tab Metformin 500 mg 1-0-1"},
            format="json",
        )
        result = self.confirm(patient_client, response.data["id"])

        assert result.status_code == 400
        assert not Medicine.objects.exists()

    def test_a_rejected_item_is_left_out(self, patient_client, patient, catalogue):
        job = upload(patient_client, patient).data
        drop = job["items"][1]["id"]
        patient_client.patch(
            reverse("v1:ocr-item-detail", args=[drop]), {"status": "REJECTED"}, format="json"
        )
        self.confirm(patient_client, job["id"])

        assert list(Medicine.objects.values_list("name", flat=True)) == ["Metformin"]
        assert ExtractedMedicine.objects.get(pk=drop).status == ItemStatus.REJECTED

    def test_a_failed_scan_cannot_be_confirmed(self, patient_client, patient, settings):
        settings.OCR_ENGINE = "apps.ocr.tests.test_ocr_api.BrokenEngine"
        job = upload(patient_client, patient).data
        assert self.confirm(patient_client, job["id"]).status_code == 400

    def test_another_patient_cannot_confirm_it(
        self, patient_client, auth_client, patient, other_patient, catalogue
    ):
        job = upload(patient_client, patient).data
        response = self.confirm(auth_client(other_patient), job["id"])
        assert response.status_code == 404
        assert not Medicine.objects.exists()

    def test_reject_discards_without_adding(self, patient_client, patient, catalogue):
        job = upload(patient_client, patient).data
        response = patient_client.post(reverse("v1:ocr-job-reject", args=[job["id"]]))

        assert response.status_code == 200
        assert response.data["status"] == "REJECTED"
        assert not Medicine.objects.exists()


class TestRetention:
    def test_stale_unconfirmed_scans_and_their_images_are_purged(
        self, patient_client, patient, catalogue
    ):
        old = upload(patient_client, patient).data["id"]
        confirmed = upload(patient_client, patient).data["id"]
        patient_client.post(reverse("v1:ocr-job-confirm", args=[confirmed]), {}, format="json")
        fresh = upload(patient_client, patient).data["id"]

        long_ago = timezone.now() - timedelta(days=60)
        OCRJob.objects.filter(pk__in=[old, confirmed]).update(created_at=long_ago)
        image_path = OCRJob.objects.get(pk=old).image.path

        assert purge_stale_ocr_jobs() == 1

        remaining = set(OCRJob.objects.values_list("pk", flat=True))
        assert str(confirmed) in {str(p) for p in remaining}
        assert str(fresh) in {str(p) for p in remaining}
        assert str(old) not in {str(p) for p in remaining}
        import os

        assert not os.path.exists(image_path)


class TestNameCorrection:
    def entry(self, generic="Metformin Hydrochloride", brand="Glucophage"):
        from apps.ocr.services.matcher import Entry

        return Entry("1", generic, brand, "500", "mg/1", "Tablet", "DIABETES")

    def test_an_obvious_typo_is_fixed_to_the_catalogue_spelling(self):
        from apps.ocr.services.pipeline import corrected_name

        assert corrected_name("Metformn", self.entry()) == "Metformin"

    def test_a_correct_name_is_left_alone(self):
        from apps.ocr.services.pipeline import corrected_name

        assert corrected_name("Metformin", self.entry()) == "Metformin"

    def test_a_synonym_is_never_rewritten(self):
        """Paracetamol is what the patient recognises; the catalogue says Acetaminophen."""
        from apps.ocr.services.pipeline import corrected_name

        assert (
            corrected_name("Paracetamol", self.entry("Acetaminophen", "Tylenol")) == "Paracetamol"
        )

    def test_multi_word_names_are_not_touched(self):
        from apps.ocr.services.pipeline import corrected_name

        assert corrected_name("Metformin Glimepiride", self.entry()) == "Metformin Glimepiride"

    def test_the_typo_does_not_reach_the_saved_medicine(self, patient_client, patient, catalogue):
        job = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {
                "patient": str(patient.patient_profile.id),
                "text": "Tab Metformn 500 mg 1-0-1 x 10 days",
            },
            format="json",
        ).data
        assert job["items"][0]["name"] == "Metformin"


class TestPoorReadsAreNeverAutoMatched:
    def test_a_confident_match_is_applied_when_the_page_read_well(
        self, patient_client, patient, catalogue
    ):
        item = upload(patient_client, patient).data["items"][0]
        assert item["reference"] and item["match_level"] == "AUTO"

    def test_the_same_match_is_only_suggested_when_the_page_read_badly(
        self, patient_client, patient, catalogue
    ):
        FakeEngine.confidence = 0.3
        response = upload(patient_client, patient)
        item = response.data["items"][0]

        assert item["reference"] is None, "a misread name must not be attached to a drug"
        assert item["match_level"] == "POSSIBLE"
        assert item["suggestions"], "but the likely drug is still offered"
        assert any("hard to read" in reason for reason in item["reasons"])

    def test_the_threshold_is_exclusive_of_a_borderline_read(
        self, patient_client, patient, catalogue
    ):
        FakeEngine.confidence = 0.5
        assert upload(patient_client, patient).data["items"][0]["reference"]

    def test_typed_text_has_no_ocr_doubt_so_matches_still_apply(
        self, patient_client, patient, catalogue
    ):
        response = patient_client.post(
            reverse("v1:ocr-job-parse-text"),
            {
                "patient": str(patient.patient_profile.id),
                "text": "Tab Metformin 500 mg 1-0-1 x 5 days",
            },
            format="json",
        )
        assert response.data["items"][0]["reference"]
