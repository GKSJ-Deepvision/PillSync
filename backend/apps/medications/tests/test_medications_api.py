"""Medicine management endpoints — the Milestone 2 criterion in full."""

from __future__ import annotations

from datetime import time
from decimal import Decimal

import pytest
from django.urls import reverse

from apps.common.choices import DoseSlot, ScheduleFrequency
from apps.medications.models import MedicationSchedule, Medicine
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db

MEDICINES = "v1:medicine-list"
SCHEDULES = "v1:schedule-list"


@pytest.fixture
def medicine(db, patient):
    return Medicine.objects.create(
        patient=patient.patient_profile,
        name="Metformin",
        category="DIABETES",
        quantity_remaining=Decimal("30"),
        quantity_per_refill=Decimal("60"),
        low_stock_threshold=Decimal("10"),
    )


class TestCreateMedicine:
    def test_a_patient_adds_a_medicine(self, patient_client, patient):
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(patient.patient_profile.id),
                "name": "Amlodipine",
                "category": "BLOOD_PRESSURE",
                "strength": "5",
                "strength_unit": "mg/1",
                "quantity_remaining": "30",
                "instructions": "Morning, with water",
            },
            format="json",
        )
        assert response.status_code == 201, response.data
        assert response.data["name"] == "Amlodipine"
        assert response.data["category_display"] == "Blood Pressure"

    def test_catalogue_details_are_copied_from_the_reference(
        self, patient_client, patient, medicine_reference
    ):
        """Picking from the catalogue should not mean retyping the strength."""
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(patient.patient_profile.id),
                "reference": str(medicine_reference.id),
                "name": "",
                "quantity_remaining": "60",
            },
            format="json",
        )
        assert response.status_code == 201, response.data
        assert response.data["name"] == medicine_reference.generic_name
        assert response.data["strength"] == medicine_reference.strength
        assert response.data["category"] == medicine_reference.category

    def test_a_medicine_and_its_schedules_are_created_together(self, patient_client, patient):
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(patient.patient_profile.id),
                "name": "Levothyroxine",
                "category": "THYROID",
                "quantity_remaining": "30",
                "schedules": [
                    {"slot": "MORNING", "time_of_day": "07:00", "quantity_per_dose": "1"},
                    {"slot": "NIGHT", "time_of_day": "21:00", "quantity_per_dose": "1"},
                ],
            },
            format="json",
        )
        assert response.status_code == 201, response.data

        created = Medicine.objects.get(name="Levothyroxine")
        assert created.schedules.count() == 2
        # Adding a schedule must also produce the doses it implies.
        assert DoseEvent.objects.filter(medicine=created).exists()

    def test_two_schedules_cannot_share_a_slot_and_time(self, patient_client, patient):
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(patient.patient_profile.id),
                "name": "Duplicate",
                "quantity_remaining": "10",
                "schedules": [
                    {"slot": "MORNING", "time_of_day": "08:00", "quantity_per_dose": "1"},
                    {"slot": "MORNING", "time_of_day": "08:00", "quantity_per_dose": "1"},
                ],
            },
            format="json",
        )
        assert response.status_code == 400

    def test_a_medicine_cannot_be_added_to_another_patient(self, patient_client, other_patient):
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(other_patient.patient_profile.id),
                "name": "Intruder",
                "quantity_remaining": "10",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_an_end_date_before_the_start_is_rejected(self, patient_client, patient):
        response = patient_client.post(
            reverse(MEDICINES),
            {
                "patient": str(patient.patient_profile.id),
                "name": "Backwards",
                "quantity_remaining": "10",
                "start_date": "2026-06-10",
                "end_date": "2026-06-01",
            },
            format="json",
        )
        assert response.status_code == 400


class TestMedicineVisibility:
    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse(MEDICINES)).status_code == 401

    def test_a_patient_sees_only_their_own(self, patient_client, medicine, other_patient):
        Medicine.objects.create(
            patient=other_patient.patient_profile, name="Someone else's", quantity_remaining=1
        )
        response = patient_client.get(reverse(MEDICINES))
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == "Metformin"

    def test_an_active_caregiver_can_read_but_not_write(
        self, caregiver_client, active_assignment, medicine
    ):
        assert caregiver_client.get(reverse(MEDICINES)).data["count"] == 1

        url = reverse("v1:medicine-detail", args=[medicine.id])
        assert caregiver_client.patch(url, {"notes": "changed"}).status_code == 403

    def test_deleting_deactivates_and_keeps_the_history(self, patient_client, medicine):
        url = reverse("v1:medicine-detail", args=[medicine.id])
        assert patient_client.delete(url).status_code == 204

        medicine.refresh_from_db()
        assert medicine.is_active is False
        assert Medicine.objects.filter(pk=medicine.pk).exists()


class TestStockAndRefill:
    def test_refill_uses_the_pack_size_by_default(self, patient_client, medicine):
        response = patient_client.post(reverse("v1:medicine-refill", args=[medicine.id]))
        assert response.status_code == 200

        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("90")

    def test_refill_accepts_an_explicit_quantity(self, patient_client, medicine):
        patient_client.post(reverse("v1:medicine-refill", args=[medicine.id]), {"quantity": "15"})
        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("45")

    def test_refill_without_a_pack_size_asks_for_a_quantity(self, patient_client, medicine):
        medicine.quantity_per_refill = None
        medicine.save(update_fields=["quantity_per_refill"])

        response = patient_client.post(reverse("v1:medicine-refill", args=[medicine.id]))
        assert response.status_code == 400

    def test_low_stock_lists_what_is_running_out(self, patient_client, medicine):
        medicine.quantity_remaining = Decimal("4")
        medicine.save(update_fields=["quantity_remaining"])

        response = patient_client.get(reverse("v1:medicine-low-stock"))
        assert len(response.data) == 1
        assert response.data[0]["is_low_stock"] is True

    def test_days_of_stock_left_is_derived_from_the_schedules(self, patient_client, medicine):
        MedicationSchedule.objects.create(
            medicine=medicine, time_of_day=time(8, 0), quantity_per_dose=Decimal("2")
        )
        response = patient_client.get(reverse("v1:medicine-detail", args=[medicine.id]))

        # 30 units at 2 a day.
        assert response.data["daily_consumption"] == 2.0
        assert response.data["days_of_stock_left"] == 15


class TestDiseaseGrouping:
    def test_medicines_are_grouped_by_condition(self, patient_client, patient, medicine):
        Medicine.objects.create(
            patient=patient.patient_profile,
            name="Amlodipine",
            category="BLOOD_PRESSURE",
            quantity_remaining=Decimal("30"),
        )

        response = patient_client.get(reverse("v1:medicine-by-condition"))
        assert response.status_code == 200

        by_code = {group["code"]: group for group in response.data}
        assert set(by_code) == {"DIABETES", "BLOOD_PRESSURE"}
        assert by_code["DIABETES"]["label"] == "Diabetes"
        assert by_code["DIABETES"]["count"] == 1

    def test_empty_categories_are_left_out(self, patient_client, medicine):
        codes = {
            group["code"] for group in patient_client.get(reverse("v1:medicine-by-condition")).data
        }
        assert "THYROID" not in codes


class TestSchedules:
    def test_adding_a_schedule_generates_doses(self, patient_client, medicine):
        response = patient_client.post(
            reverse(SCHEDULES),
            {
                "medicine": str(medicine.id),
                "slot": DoseSlot.MORNING,
                "time_of_day": "08:00",
                "quantity_per_dose": "2",
            },
            format="json",
        )
        assert response.status_code == 201, response.data
        assert DoseEvent.objects.filter(medicine=medicine).exists()

    def test_specific_days_requires_days(self, patient_client, medicine):
        response = patient_client.post(
            reverse(SCHEDULES),
            {
                "medicine": str(medicine.id),
                "time_of_day": "08:00",
                "frequency": ScheduleFrequency.SPECIFIC_DAYS,
                "days_of_week": [],
            },
            format="json",
        )
        assert response.status_code == 400
        assert "days_of_week" in response.data["error"]["details"]

    def test_an_invalid_weekday_is_rejected(self, patient_client, medicine):
        response = patient_client.post(
            reverse(SCHEDULES),
            {
                "medicine": str(medicine.id),
                "time_of_day": "08:00",
                "frequency": ScheduleFrequency.SPECIFIC_DAYS,
                "days_of_week": [0, 9],
            },
            format="json",
        )
        assert response.status_code == 400

    def test_switching_away_from_specific_days_clears_the_day_list(self, patient_client, medicine):
        schedule = MedicationSchedule.objects.create(
            medicine=medicine,
            time_of_day=time(8, 0),
            frequency=ScheduleFrequency.SPECIFIC_DAYS,
            days_of_week=[1, 3],
        )
        response = patient_client.patch(
            reverse("v1:schedule-detail", args=[schedule.id]),
            {"frequency": ScheduleFrequency.DAILY},
            format="json",
        )
        assert response.status_code == 200
        schedule.refresh_from_db()
        assert schedule.days_of_week == []

    def test_a_schedule_cannot_be_added_to_another_patients_medicine(
        self, patient_client, other_patient
    ):
        theirs = Medicine.objects.create(
            patient=other_patient.patient_profile, name="Theirs", quantity_remaining=1
        )
        response = patient_client.post(
            reverse(SCHEDULES),
            {"medicine": str(theirs.id), "time_of_day": "08:00"},
            format="json",
        )
        assert response.status_code == 400

    def test_editing_the_time_moves_the_upcoming_doses(self, patient_client, medicine):
        schedule = MedicationSchedule.objects.create(
            medicine=medicine, time_of_day=time(8, 0), quantity_per_dose=Decimal("1")
        )
        patient_client.post(reverse("v1:schedule-regenerate", args=[schedule.id]))

        response = patient_client.patch(
            reverse("v1:schedule-detail", args=[schedule.id]),
            {"time_of_day": "21:30"},
            format="json",
        )
        assert response.status_code == 200

        from django.utils import timezone

        hours = {
            timezone.localtime(d.scheduled_for).hour
            for d in DoseEvent.objects.filter(schedule=schedule)
        }
        assert hours == {21}
