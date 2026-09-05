"""Prescription records and expiry handling."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.common.choices import NotificationCategory, PrescriptionStatus
from apps.medications.models import Medicine
from apps.notifications.models import NotificationLog
from apps.prescriptions.models import Prescription
from apps.reminders import tasks

pytestmark = pytest.mark.django_db

PRESCRIPTIONS = "v1:prescription-list"


@pytest.fixture
def prescription(db, patient):
    return Prescription.objects.create(
        patient=patient.patient_profile,
        doctor_name="Dr Mehta",
        clinic_name="Sunrise Clinic",
        issued_on=timezone.localdate() - timedelta(days=10),
        expires_on=timezone.localdate() + timedelta(days=20),
    )


class TestPrescriptionApi:
    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse(PRESCRIPTIONS)).status_code == 401

    def test_a_patient_records_a_prescription(self, patient_client, patient):
        response = patient_client.post(
            reverse(PRESCRIPTIONS),
            {
                "patient": str(patient.patient_profile.id),
                "doctor_name": "Dr Rao",
                "issued_on": str(timezone.localdate()),
                "expires_on": str(timezone.localdate() + timedelta(days=90)),
            },
            format="json",
        )
        assert response.status_code == 201, response.data
        assert response.data["status"] == PrescriptionStatus.ACTIVE

    def test_a_patient_sees_only_their_own(self, patient_client, prescription, other_patient):
        Prescription.objects.create(
            patient=other_patient.patient_profile, doctor_name="Someone else's"
        )
        response = patient_client.get(reverse(PRESCRIPTIONS))
        assert response.data["count"] == 1

    def test_an_expiry_before_the_issue_date_is_rejected(self, patient_client, patient):
        response = patient_client.post(
            reverse(PRESCRIPTIONS),
            {
                "patient": str(patient.patient_profile.id),
                "issued_on": "2026-06-10",
                "expires_on": "2026-06-01",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_a_future_issue_date_is_rejected(self, patient_client, patient):
        response = patient_client.post(
            reverse(PRESCRIPTIONS),
            {
                "patient": str(patient.patient_profile.id),
                "issued_on": str(timezone.localdate() + timedelta(days=5)),
            },
            format="json",
        )
        assert response.status_code == 400

    def test_a_prescription_cannot_be_filed_for_another_patient(
        self, patient_client, other_patient
    ):
        response = patient_client.post(
            reverse(PRESCRIPTIONS),
            {"patient": str(other_patient.patient_profile.id), "doctor_name": "Intruder"},
            format="json",
        )
        assert response.status_code == 400

    def test_deleting_archives_so_linked_medicines_survive(
        self, patient_client, prescription, patient
    ):
        Medicine.objects.create(
            patient=patient.patient_profile,
            prescription=prescription,
            name="Amoxicillin",
            quantity_remaining=Decimal("21"),
        )
        url = reverse("v1:prescription-detail", args=[prescription.id])
        assert patient_client.delete(url).status_code == 204

        prescription.refresh_from_db()
        assert prescription.status == PrescriptionStatus.ARCHIVED
        assert Medicine.objects.filter(prescription=prescription).exists()

    def test_the_medicine_count_is_reported(self, patient_client, prescription, patient):
        Medicine.objects.create(
            patient=patient.patient_profile,
            prescription=prescription,
            name="Amoxicillin",
            quantity_remaining=Decimal("21"),
        )
        response = patient_client.get(reverse("v1:prescription-detail", args=[prescription.id]))
        assert response.data["medicine_count"] == 1

    def test_ocr_fields_cannot_be_set_by_a_client(self, patient_client, prescription):
        """Milestone 3 writes these; a client claiming 100% confidence must not."""
        response = patient_client.patch(
            reverse("v1:prescription-detail", args=[prescription.id]),
            {"ocr_extracted": True, "ocr_confidence": 1.0},
            format="json",
        )
        assert response.status_code == 200

        prescription.refresh_from_db()
        assert prescription.ocr_extracted is False
        assert prescription.ocr_confidence is None


class TestExpiry:
    def test_days_until_expiry_is_reported(self, patient_client, prescription):
        response = patient_client.get(reverse("v1:prescription-detail", args=[prescription.id]))
        assert response.data["days_until_expiry"] == 20
        assert response.data["is_expired"] is False

    def test_a_lapsed_prescription_reads_as_expired(self, patient, patient_client):
        lapsed = Prescription.objects.create(
            patient=patient.patient_profile,
            issued_on=timezone.localdate() - timedelta(days=200),
            expires_on=timezone.localdate() - timedelta(days=1),
        )
        response = patient_client.get(reverse("v1:prescription-detail", args=[lapsed.id]))
        assert response.data["is_expired"] is True

    def test_the_expiring_list_only_covers_the_next_month(
        self, patient_client, patient, prescription
    ):
        Prescription.objects.create(
            patient=patient.patient_profile,
            doctor_name="Far future",
            expires_on=timezone.localdate() + timedelta(days=200),
        )
        response = patient_client.get(reverse("v1:prescription-expiring"))
        assert len(response.data) == 1
        assert response.data[0]["doctor_name"] == "Dr Mehta"

    def test_refresh_status_leaves_an_archived_prescription_alone(self, patient):
        """Something the patient filed away must not reappear as 'expired'."""
        archived = Prescription.objects.create(
            patient=patient.patient_profile,
            expires_on=timezone.localdate() - timedelta(days=1),
            status=PrescriptionStatus.ARCHIVED,
        )
        archived.refresh_status()
        assert archived.status == PrescriptionStatus.ARCHIVED


class TestExpiryTask:
    def test_it_warns_before_a_prescription_runs_out(self, patient):
        soon = Prescription.objects.create(
            patient=patient.patient_profile,
            doctor_name="Dr Mehta",
            expires_on=timezone.localdate() + timedelta(days=3),
        )

        assert tasks.notify_expiring_prescriptions() == 1

        soon.refresh_from_db()
        assert soon.expiry_reminded_at is not None
        assert NotificationLog.objects.filter(
            category=NotificationCategory.PRESCRIPTION_EXPIRY
        ).exists()

    def test_it_does_not_warn_twice(self, patient):
        Prescription.objects.create(
            patient=patient.patient_profile,
            expires_on=timezone.localdate() + timedelta(days=3),
        )
        assert tasks.notify_expiring_prescriptions() == 1
        assert tasks.notify_expiring_prescriptions() == 0

    def test_it_ignores_prescriptions_that_are_not_close_yet(self, prescription):
        assert tasks.notify_expiring_prescriptions() == 0

    def test_it_retires_prescriptions_that_have_already_lapsed(self, patient):
        lapsed = Prescription.objects.create(
            patient=patient.patient_profile,
            expires_on=timezone.localdate() - timedelta(days=1),
        )
        tasks.notify_expiring_prescriptions()

        lapsed.refresh_from_db()
        assert lapsed.status == PrescriptionStatus.EXPIRED
