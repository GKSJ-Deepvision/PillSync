"""The reminder and history endpoints, and the tasks that drive them."""

from __future__ import annotations

from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.common.choices import DoseSlot, DoseStatus, NotificationCategory
from apps.medications.models import MedicationSchedule, Medicine
from apps.notifications.models import NotificationLog
from apps.reminders import tasks
from apps.reminders.models import MISSED_AFTER, DoseEvent
from apps.reminders.services import actions

pytestmark = pytest.mark.django_db


@pytest.fixture
def medicine(db, patient):
    return Medicine.objects.create(
        patient=patient.patient_profile,
        name="Metformin",
        category="DIABETES",
        quantity_remaining=Decimal("30"),
        instructions="After food",
    )


@pytest.fixture
def schedule(medicine):
    return MedicationSchedule.objects.create(
        medicine=medicine,
        slot=DoseSlot.MORNING,
        time_of_day=time(8, 0),
        quantity_per_dose=Decimal("2"),
    )


def make_dose(schedule, *, when=None, slot=DoseSlot.MORNING, status=DoseStatus.PENDING):
    return DoseEvent.objects.create(
        schedule=schedule,
        medicine=schedule.medicine,
        patient=schedule.medicine.patient,
        scheduled_for=when or timezone.now(),
        slot=slot,
        quantity_expected=Decimal("2"),
        status=status,
    )


class TestDoseAccess:
    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse("v1:dose-list")).status_code == 401

    def test_a_patient_sees_their_own_doses(self, patient_client, schedule):
        make_dose(schedule)
        response = patient_client.get(reverse("v1:dose-list"))
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_another_patient_sees_nothing(self, auth_client, other_patient, schedule):
        make_dose(schedule)
        response = auth_client(other_patient).get(reverse("v1:dose-list"))
        assert response.data["count"] == 0

    def test_an_active_caregiver_sees_the_doses(
        self, caregiver_client, active_assignment, schedule
    ):
        make_dose(schedule)
        response = caregiver_client.get(reverse("v1:dose-list"))
        assert response.data["count"] == 1

    def test_a_dose_cannot_be_edited_directly(self, patient_client, schedule):
        """Status changes go through the actions, so stock and alerts cannot be skipped."""
        dose = make_dose(schedule)
        url = reverse("v1:dose-detail", args=[dose.id])
        assert patient_client.patch(url, {"status": "TAKEN"}).status_code == 405


class TestDoseActionsApi:
    def test_take(self, patient_client, schedule, medicine):
        dose = make_dose(schedule)
        response = patient_client.post(reverse("v1:dose-take", args=[dose.id]))

        assert response.status_code == 200
        assert response.data["status"] == DoseStatus.TAKEN
        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("28")

    def test_take_a_partial_dose(self, patient_client, schedule, medicine):
        dose = make_dose(schedule)
        response = patient_client.post(
            reverse("v1:dose-take", args=[dose.id]), {"quantity_taken": "1"}
        )
        assert response.status_code == 200
        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("29")

    def test_taking_twice_is_rejected(self, patient_client, schedule):
        dose = make_dose(schedule)
        url = reverse("v1:dose-take", args=[dose.id])
        assert patient_client.post(url).status_code == 200
        assert patient_client.post(url).status_code == 400

    def test_miss(self, patient_client, schedule):
        dose = make_dose(schedule)
        response = patient_client.post(reverse("v1:dose-miss", args=[dose.id]))
        assert response.status_code == 200
        assert response.data["status"] == DoseStatus.MISSED

    def test_snooze(self, patient_client, schedule):
        dose = make_dose(schedule)
        response = patient_client.post(reverse("v1:dose-snooze", args=[dose.id]), {"minutes": 20})
        assert response.status_code == 200
        assert response.data["status"] == DoseStatus.SNOOZED
        assert response.data["snooze_count"] == 1

    def test_skip(self, patient_client, schedule):
        dose = make_dose(schedule)
        response = patient_client.post(reverse("v1:dose-skip", args=[dose.id]))
        assert response.status_code == 200
        assert response.data["status"] == DoseStatus.SKIPPED

    def test_a_caregiver_with_view_access_cannot_act_on_a_dose(
        self, caregiver_client, active_assignment, schedule
    ):
        dose = make_dose(schedule)
        response = caregiver_client.post(reverse("v1:dose-take", args=[dose.id]))
        assert response.status_code == 403

    def test_an_unrelated_user_gets_a_404_not_a_403(self, auth_client, other_patient, schedule):
        dose = make_dose(schedule)
        response = auth_client(other_patient).post(reverse("v1:dose-take", args=[dose.id]))
        assert response.status_code == 404


class TestTodayView:
    def test_it_groups_doses_by_slot(self, patient_client, schedule, medicine):
        morning = MedicationSchedule.objects.create(
            medicine=medicine, slot=DoseSlot.NIGHT, time_of_day=time(21, 0)
        )
        make_dose(schedule, slot=DoseSlot.MORNING)
        make_dose(morning, slot=DoseSlot.NIGHT)

        response = patient_client.get(reverse("v1:dose-today"))
        assert response.status_code == 200
        assert len(response.data["slots"]["MORNING"]) == 1
        assert len(response.data["slots"]["NIGHT"]) == 1
        assert response.data["slots"]["AFTERNOON"] == []

    def test_the_summary_counts_the_day(self, patient_client, schedule):
        taken = make_dose(schedule)
        make_dose(schedule, when=timezone.now() + timedelta(minutes=5))
        actions.mark_taken(taken)

        summary = patient_client.get(reverse("v1:dose-today")).data["summary"]
        assert summary["total"] == 2
        assert summary["taken"] == 1
        assert summary["pending"] == 1
        assert summary["adherence_percent"] == 100.0

    def test_a_dose_carries_the_instructions_the_patient_needs(self, patient_client, schedule):
        make_dose(schedule)
        dose = patient_client.get(reverse("v1:dose-today")).data["slots"]["MORNING"][0]
        assert dose["instructions"] == "After food"
        assert dose["medicine_name"] == "Metformin"


class TestUpcomingAndHistory:
    def test_upcoming_only_returns_open_future_doses(self, patient_client, schedule):
        make_dose(schedule, when=timezone.now() + timedelta(days=1))
        past = make_dose(schedule, when=timezone.now() - timedelta(days=1))
        actions.mark_taken(past)

        response = patient_client.get(reverse("v1:dose-upcoming"))
        assert len(response.data) == 1

    def test_history_returns_one_entry_per_day(self, patient_client, schedule):
        response = patient_client.get(reverse("v1:dose-history"), {"days": 5})
        assert response.status_code == 200
        assert len(response.data["days"]) == 5

    def test_history_counts_what_happened(self, patient_client, schedule):
        taken = make_dose(schedule)
        missed = make_dose(schedule, when=timezone.now() + timedelta(minutes=1))
        actions.mark_taken(taken)
        actions.mark_missed(missed)

        today = patient_client.get(reverse("v1:dose-history"), {"days": 1}).data["days"][0]
        assert today["taken"] == 1
        assert today["missed"] == 1
        assert today["adherence_percent"] == 50.0

    def test_a_skipped_dose_is_left_out_of_the_percentage(self, patient_client, schedule):
        taken = make_dose(schedule)
        skipped = make_dose(schedule, when=timezone.now() + timedelta(minutes=1))
        actions.mark_taken(taken)
        actions.mark_skipped(skipped)

        today = patient_client.get(reverse("v1:dose-history"), {"days": 1}).data["days"][0]
        assert today["adherence_percent"] == 100.0

    def test_the_history_range_is_capped(self, patient_client):
        response = patient_client.get(reverse("v1:dose-history"), {"days": 5000})
        assert len(response.data["days"]) <= 92


class TestReminderTasks:
    def test_dispatch_sends_a_reminder_for_a_due_dose(self, schedule):
        dose = make_dose(schedule, when=timezone.now() - timedelta(minutes=1))

        assert tasks.dispatch_due_reminders() == 1

        dose.refresh_from_db()
        assert dose.reminder_sent_at is not None
        assert NotificationLog.objects.filter(category=NotificationCategory.DOSE_REMINDER).exists()

    def test_dispatch_does_not_send_the_same_reminder_twice(self, schedule):
        make_dose(schedule, when=timezone.now() - timedelta(minutes=1))

        assert tasks.dispatch_due_reminders() == 1
        assert tasks.dispatch_due_reminders() == 0

    def test_dispatch_ignores_doses_that_are_not_due_yet(self, schedule):
        make_dose(schedule, when=timezone.now() + timedelta(hours=2))
        assert tasks.dispatch_due_reminders() == 0

    def test_a_snoozed_dose_is_reminded_again_when_the_snooze_ends(self, schedule):
        dose = make_dose(schedule, when=timezone.now() - timedelta(minutes=1))
        tasks.dispatch_due_reminders()

        actions.snooze(dose, minutes=1)
        dose.snooze_until = timezone.now() - timedelta(seconds=1)
        dose.save(update_fields=["snooze_until"])

        assert tasks.dispatch_due_reminders() == 1

    def test_the_sweeper_marks_unanswered_doses_missed(self, schedule):
        stale = make_dose(schedule, when=timezone.now() - MISSED_AFTER - timedelta(minutes=1))

        assert tasks.sweep_overdue_doses() == 1
        stale.refresh_from_db()
        assert stale.status == DoseStatus.MISSED

    def test_generation_tops_up_the_horizon(self, schedule):
        created = tasks.generate_dose_events(horizon_days=3)
        assert created == 4
        assert tasks.generate_dose_events(horizon_days=3) == 0
