"""Adherence endpoints against real dose history."""

from __future__ import annotations

from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.common.choices import DoseSlot, DoseStatus
from apps.medications.models import MedicationSchedule, Medicine
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db


def history(patient, *, days=30, missed_every=0, name="Metformin", slot=DoseSlot.MORNING):
    medicine = Medicine.objects.create(
        patient=patient.patient_profile, name=name, quantity_remaining=Decimal("100")
    )
    schedule = MedicationSchedule.objects.create(
        medicine=medicine, slot=slot, time_of_day=time(8, 0), quantity_per_dose=Decimal("1")
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
            slot=slot,
            quantity_expected=Decimal("1"),
            status=DoseStatus.MISSED if missed else DoseStatus.TAKEN,
            responded_at=when + timedelta(minutes=10),
            quantity_taken=None if missed else Decimal("1"),
        )
    return medicine


class TestSummary:
    def test_headline_numbers(self, patient_client, patient):
        # The window is today and the 29 days before it, so day 30 falls outside:
        # misses on days 5, 10, ... 25 (five), takes on the other 24.
        history(patient, days=30, missed_every=5)
        response = patient_client.get(reverse("v1:adherence-summary"))

        assert response.status_code == 200
        assert response.data["taken"] == 24
        assert response.data["missed"] == 5
        assert response.data["adherence_rate"] == 82.8
        assert response.data["on_time_rate"] == 100.0
        assert len(response.data["daily"]) == 30

    def test_a_patient_with_no_history_gets_nulls_not_a_perfect_score(
        self, patient_client, patient
    ):
        response = patient_client.get(reverse("v1:adherence-summary"))
        assert response.status_code == 200
        assert response.data["adherence_rate"] is None
        assert response.data["streaks"] == {"current": 0, "longest": 0}

    def test_the_streak_is_reported(self, patient_client, patient):
        history(patient, days=20)
        assert patient_client.get(reverse("v1:adherence-summary")).data["streaks"]["current"] == 20

    def test_a_pattern_is_surfaced_as_an_insight(self, patient_client, patient):
        history(patient, days=30, missed_every=1, slot=DoseSlot.NIGHT, name="Statin")
        history(patient, days=30, name="Metformin")
        response = patient_client.get(reverse("v1:adherence-summary"))
        assert any("night" in line for line in response.data["missed_analysis"]["insights"])

    def test_filter_by_medicine(self, patient_client, patient):
        a = history(patient, days=14, name="A")
        history(patient, days=14, missed_every=2, name="B")
        response = patient_client.get(reverse("v1:adherence-summary"), {"medicine": str(a.id)})
        assert response.data["adherence_rate"] == 100.0

    def test_days_is_bounded(self, patient_client):
        assert (
            patient_client.get(reverse("v1:adherence-summary"), {"days": 5000}).status_code == 400
        )


class TestAccess:
    def test_anonymous_is_refused(self, api_client):
        assert api_client.get(reverse("v1:adherence-summary")).status_code == 401

    def test_you_never_see_another_patients_history(self, patient_client, other_patient):
        history(other_patient, days=10, missed_every=1)
        response = patient_client.get(reverse("v1:adherence-summary"))
        assert response.data["adherence_rate"] is None

    def test_asking_for_someone_elses_profile_is_a_404(self, patient_client, other_patient):
        response = patient_client.get(
            reverse("v1:adherence-summary"), {"patient": str(other_patient.patient_profile.id)}
        )
        assert response.status_code == 404

    def test_an_assigned_caregiver_can_read_it(self, caregiver_client, patient, active_assignment):
        history(patient, days=10)
        response = caregiver_client.get(
            reverse("v1:adherence-summary"), {"patient": str(patient.patient_profile.id)}
        )
        assert response.status_code == 200
        assert response.data["adherence_rate"] == 100.0

    def test_an_unassigned_caregiver_cannot(self, caregiver_client, patient):
        history(patient, days=10)
        response = caregiver_client.get(
            reverse("v1:adherence-summary"), {"patient": str(patient.patient_profile.id)}
        )
        assert response.status_code == 404


class TestReports:
    def test_weekly_report_compares_with_the_week_before(self, patient_client, patient):
        # Last 7 days perfect; the 7 before that missed every day.
        medicine = history(patient, days=6)  # today and the 6 days before it
        schedule = medicine.schedules.first()
        base = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
        for day in range(7, 14):
            DoseEvent.objects.create(
                schedule=schedule,
                medicine=medicine,
                patient=medicine.patient,
                scheduled_for=base - timedelta(days=day),
                slot=DoseSlot.MORNING,
                status=DoseStatus.MISSED,
            )

        response = patient_client.get(reverse("v1:adherence-report"), {"period": "weekly"})
        assert response.data["adherence_rate"] == 100.0
        assert response.data["previous"]["adherence_rate"] == 0.0
        assert response.data["change_from_previous"] == 100.0
        assert len(response.data["daily"]) == 7

    def test_monthly_report(self, patient_client, patient):
        history(patient, days=30)
        response = patient_client.get(reverse("v1:adherence-report"), {"period": "monthly"})
        assert response.data["period"] == "monthly"
        assert len(response.data["daily"]) == 30

    def test_unknown_period_is_refused(self, patient_client):
        assert (
            patient_client.get(reverse("v1:adherence-report"), {"period": "yearly"}).status_code
            == 400
        )

    def test_csv_export(self, patient_client, patient):
        history(patient, days=7, missed_every=7)
        response = patient_client.get(
            reverse("v1:adherence-report"), {"period": "weekly", "export": "csv"}
        )

        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/csv")
        assert "attachment" in response["Content-Disposition"]
        body = response.content.decode()
        assert "adherence_rate_percent" in body
        assert body.count("\n") > 15  # header block + 7 daily rows

    def test_csv_only_contains_the_callers_data(self, patient_client, other_patient):
        history(other_patient, days=7, missed_every=1)
        body = patient_client.get(
            reverse("v1:adherence-report"), {"period": "weekly", "export": "csv"}
        ).content.decode()
        assert "\nmissed,0\n" in body.replace("\r", "")

    def test_a_bad_patient_id_is_a_400_not_a_500(self, patient_client):
        response = patient_client.get(reverse("v1:adherence-report"), {"patient": "not-a-uuid"})
        assert response.status_code == 400
