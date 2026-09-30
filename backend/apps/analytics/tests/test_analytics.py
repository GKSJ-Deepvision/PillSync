"""Dashboards, monitoring, admin analytics and the latency metrics."""

from __future__ import annotations

from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.analytics import metrics
from apps.common.choices import DoseSlot, DoseStatus
from apps.medications.models import MedicationSchedule, Medicine
from apps.refills.services import prediction
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db


def medicine_with_history(
    patient, *, name="Metformin", stock="100", days=10, missed_every=0, today_status=None
):
    medicine = Medicine.objects.create(
        patient=patient.patient_profile, name=name, quantity_remaining=Decimal(stock)
    )
    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        slot=DoseSlot.MORNING,
        time_of_day=time(8, 0),
        quantity_per_dose=Decimal("1"),
    )
    base = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
    for day in range(1, days + 1):
        missed = bool(missed_every) and day % missed_every == 0
        when = base - timedelta(days=day)
        DoseEvent.objects.create(
            schedule=schedule,
            medicine=medicine,
            patient=medicine.patient,
            scheduled_for=when,
            slot=DoseSlot.MORNING,
            status=DoseStatus.MISSED if missed else DoseStatus.TAKEN,
            responded_at=when + timedelta(minutes=5),
            quantity_taken=None if missed else Decimal("1"),
        )
    if today_status:
        DoseEvent.objects.create(
            schedule=schedule,
            medicine=medicine,
            patient=medicine.patient,
            scheduled_for=timezone.now() + timedelta(hours=1),
            slot=DoseSlot.MORNING,
            status=today_status,
        )
    prediction.recompute(medicine)
    return medicine


class TestPatientDashboard:
    def test_the_dashboard_pulls_everything_together(self, patient_client, patient, pinned_now):
        medicine_with_history(patient, days=10, today_status=DoseStatus.PENDING)
        medicine_with_history(patient, name="Low one", stock="2", days=3)

        response = patient_client.get(reverse("v1:analytics-dashboard"))

        assert response.status_code == 200
        data = response.data
        assert data["adherence"]["week"] == 100.0
        assert data["adherence"]["streaks"]["current"] >= 3
        assert data["active_medicines"] == 2
        assert data["refills"]["needs_attention"] == 1
        assert data["refills"]["urgent"][0]["medicine"] == "Low one"
        assert len(data["daily"]) == 30
        assert data["today"]["next"]["medicine"] == "Metformin"

    def test_a_new_patient_sees_empty_not_error(self, patient_client, patient):
        response = patient_client.get(reverse("v1:analytics-dashboard"))
        assert response.status_code == 200
        assert response.data["adherence"]["week"] is None
        assert response.data["today"]["total"] == 0

    def test_scoped_to_one_profile(self, patient_client, patient):
        medicine_with_history(patient)
        response = patient_client.get(
            reverse("v1:analytics-dashboard"), {"patient": str(patient.patient_profile.id)}
        )
        assert response.status_code == 200

    def test_someone_elses_profile_is_a_404(self, patient_client, other_patient):
        response = patient_client.get(
            reverse("v1:analytics-dashboard"), {"patient": str(other_patient.patient_profile.id)}
        )
        assert response.status_code == 404

    def test_a_malformed_id_is_a_404_not_a_500(self, patient_client):
        assert (
            patient_client.get(reverse("v1:analytics-dashboard"), {"patient": "nope"}).status_code
            == 404
        )

    def test_login_is_required(self, api_client):
        assert api_client.get(reverse("v1:analytics-dashboard")).status_code == 401


class TestCaregiverOverview:
    def test_patients_are_ranked_by_how_much_they_need_a_call(
        self, caregiver_client, caregiver, patient, other_patient, active_assignment
    ):
        from apps.accounts.models import CaregiverAssignment
        from apps.common.choices import AssignmentStatus

        CaregiverAssignment.objects.create(
            caregiver=caregiver,
            patient=other_patient,
            status=AssignmentStatus.ACTIVE,
            invited_by=other_patient,
        )
        medicine_with_history(patient, days=14)  # fine
        medicine_with_history(
            other_patient, days=14, missed_every=2, stock="3"
        )  # struggling, low stock

        response = caregiver_client.get(reverse("v1:analytics-caregiver"))

        assert response.status_code == 200
        names = [row["name"] for row in response.data["patients"]]
        assert names == ["Ravi Patient", "Asha Patient"]
        worst = response.data["patients"][0]
        assert worst["attention"]["score"] > 0
        assert worst["attention"]["reasons"]
        assert response.data["totals"] == {"patients": 2, "needing_attention": 1}

    def test_pending_or_revoked_assignments_are_not_shown(
        self, caregiver_client, caregiver, patient
    ):
        from apps.accounts.models import CaregiverAssignment
        from apps.common.choices import AssignmentStatus

        CaregiverAssignment.objects.create(
            caregiver=caregiver,
            patient=patient,
            status=AssignmentStatus.PENDING,
            invited_by=patient,
        )
        assert caregiver_client.get(reverse("v1:analytics-caregiver")).data["patients"] == []

    def test_patients_and_admins_are_not_caregivers(self, patient_client):
        assert patient_client.get(reverse("v1:analytics-caregiver")).status_code == 403


class TestAdminOverview:
    def test_platform_figures(self, admin_client, patient, caregiver):
        medicine_with_history(patient, days=10, missed_every=5)
        response = admin_client.get(reverse("v1:analytics-admin"))

        assert response.status_code == 200
        data = response.data
        assert data["users"]["patients"] == 1
        assert data["users"]["caregivers"] == 1
        assert data["doses"]["missed"] == 2
        assert data["doses"]["adherence_rate"] == 80.0
        assert data["ocr"]["total"] == 0
        assert data["ocr"]["success_rate"] is None
        assert "refill_forecast_accuracy" in data

    def test_notification_delivery_rate_excludes_skipped(self, admin_client, patient):
        from apps.common.choices import (
            NotificationCategory,
            NotificationChannel,
            NotificationStatus,
        )
        from apps.notifications.models import NotificationLog

        def log(status):
            NotificationLog.objects.create(
                recipient=patient,
                category=NotificationCategory.DOSE_REMINDER,
                channel=NotificationChannel.PUSH,
                status=status,
                body="x",
            )

        for status in ("SENT", "SENT", "SENT", "FAILED", "SKIPPED", "SKIPPED"):
            log(getattr(NotificationStatus, status))

        data = admin_client.get(reverse("v1:analytics-admin")).data
        assert data["notifications"]["delivery_rate"] == 75.0
        assert data["notifications"]["by_channel"]["PUSH"]["failed"] == 1

    def test_ocr_statistics(self, admin_client, patient):
        from apps.ocr.models import JobStatus, OCRJob

        profile = patient.patient_profile
        OCRJob.objects.create(
            patient=profile, status=JobStatus.CONFIRMED, confidence=0.9, processing_ms=1000
        )
        OCRJob.objects.create(
            patient=profile, status=JobStatus.COMPLETED, confidence=0.7, processing_ms=3000
        )
        OCRJob.objects.create(patient=profile, status=JobStatus.FAILED)

        ocr = admin_client.get(reverse("v1:analytics-admin")).data["ocr"]
        assert ocr["total"] == 3
        assert ocr["success_rate"] == pytest.approx(66.7)
        assert ocr["confirm_rate"] == 50.0
        assert ocr["average_confidence"] == 0.8

    def test_only_administrators(self, patient_client, caregiver_client):
        assert patient_client.get(reverse("v1:analytics-admin")).status_code == 403
        assert caregiver_client.get(reverse("v1:analytics-admin")).status_code == 403


class TestPerformanceMetrics:
    @pytest.fixture(autouse=True)
    def _clean(self):
        metrics.store.clear()
        yield
        metrics.store.clear()

    def test_percentiles_use_nearest_rank(self):
        values = list(map(float, range(1, 101)))
        assert metrics.percentile(values, 50) == 50
        assert metrics.percentile(values, 95) == 95
        assert metrics.percentile(values, 99) == 99
        assert metrics.percentile([], 95) is None

    def test_summary_ranks_routes_by_tail_latency(self):
        for ms in (10, 12, 11):
            metrics.store.record("a/", "GET", 200, ms)
        for ms in (100, 900, 120):
            metrics.store.record("b/", "GET", 200, ms)
        metrics.store.record("b/", "GET", 500, 50)

        summary = metrics.summarise(metrics.store.snapshot())
        assert summary["requests"] == 7
        assert summary["slowest_routes"][0]["route"] == "GET b/"
        assert summary["server_error_rate"] == pytest.approx(14.29)

    def test_the_window_is_bounded(self):
        store = metrics.LatencyStore(size=5)
        for i in range(20):
            store.record("x", "GET", 200, i)
        assert len(store.snapshot()) == 5

    def test_the_middleware_times_real_requests_by_route_template(self, patient_client, patient):
        patient_client.get(reverse("v1:analytics-dashboard"))
        patient_client.get(reverse("v1:analytics-dashboard"))

        rows = metrics.summarise(metrics.store.snapshot())["slowest_routes"]
        route = next(r for r in rows if "analytics/dashboard" in r["route"])
        assert route["count"] == 2

    def test_responses_carry_a_server_timing_header(self, patient_client):
        response = patient_client.get(reverse("v1:analytics-dashboard"))
        assert response["Server-Timing"].startswith("app;dur=")

    def test_health_checks_do_not_pollute_the_figures(self, client):
        client.get("/health/")
        assert metrics.store.snapshot() == []

    def test_the_endpoint_is_admin_only(self, admin_client, patient_client):
        patient_client.get(reverse("v1:analytics-dashboard"))
        assert patient_client.get(reverse("v1:analytics-performance")).status_code == 403
        assert admin_client.get(reverse("v1:analytics-performance")).data["requests"] >= 1
