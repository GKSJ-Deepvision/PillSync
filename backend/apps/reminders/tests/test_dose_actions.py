"""Taken / Missed / Snooze, the sweeper, and what each does to stock and alerts."""

from __future__ import annotations

from datetime import time, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.common.choices import DoseSlot, DoseStatus, NotificationCategory
from apps.medications.models import MedicationSchedule, Medicine
from apps.notifications.models import NotificationLog
from apps.reminders.models import MAX_SNOOZES, MISSED_AFTER, DoseEvent
from apps.reminders.services import actions

pytestmark = pytest.mark.django_db


@pytest.fixture
def medicine(db, patient):
    return Medicine.objects.create(
        patient=patient.patient_profile,
        name="Metformin",
        category="DIABETES",
        quantity_remaining=Decimal("30"),
        low_stock_threshold=Decimal("5"),
    )


@pytest.fixture
def schedule(medicine):
    return MedicationSchedule.objects.create(
        medicine=medicine,
        slot=DoseSlot.MORNING,
        time_of_day=time(8, 0),
        quantity_per_dose=Decimal("2"),
    )


@pytest.fixture
def dose(schedule, medicine):
    return DoseEvent.objects.create(
        schedule=schedule,
        medicine=medicine,
        patient=medicine.patient,
        scheduled_for=timezone.now(),
        slot=DoseSlot.MORNING,
        quantity_expected=Decimal("2"),
    )


class TestMarkTaken:
    def test_it_records_the_dose_and_removes_stock(self, dose, medicine):
        actions.mark_taken(dose)

        dose.refresh_from_db()
        medicine.refresh_from_db()
        assert dose.status == DoseStatus.TAKEN
        assert dose.quantity_taken == Decimal("2")
        assert dose.responded_at is not None
        assert medicine.quantity_remaining == Decimal("28")

    def test_a_partial_dose_only_removes_what_was_taken(self, dose, medicine):
        actions.mark_taken(dose, quantity=Decimal("1"))

        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("29")
        assert dose.quantity_taken == Decimal("1")

    def test_stock_floors_at_zero_rather_than_going_negative(self, dose, medicine):
        """Recorded stock can be wrong; a dose is never blocked because of it."""
        medicine.quantity_remaining = Decimal("1")
        medicine.save(update_fields=["quantity_remaining"])

        actions.mark_taken(dose)

        medicine.refresh_from_db()
        assert medicine.quantity_remaining == Decimal("0")
        assert dose.status == DoseStatus.TAKEN

    def test_a_dose_cannot_be_taken_twice(self, dose):
        actions.mark_taken(dose)
        with pytest.raises(ValidationError):
            actions.mark_taken(dose)

    def test_it_warns_when_the_pack_runs_low(self, dose, medicine):
        medicine.quantity_remaining = Decimal("6")
        medicine.save(update_fields=["quantity_remaining"])

        actions.mark_taken(dose)

        assert NotificationLog.objects.filter(category=NotificationCategory.LOW_STOCK).exists()

    def test_it_does_not_warn_while_stock_is_healthy(self, dose):
        actions.mark_taken(dose)
        assert not NotificationLog.objects.filter(category=NotificationCategory.LOW_STOCK).exists()

    def test_the_low_stock_warning_is_not_repeated_all_day(self, schedule, medicine):
        """Every dose below the threshold would otherwise raise another alert."""
        medicine.quantity_remaining = Decimal("6")
        medicine.save(update_fields=["quantity_remaining"])

        for offset in range(3):
            dose = DoseEvent.objects.create(
                schedule=schedule,
                medicine=medicine,
                patient=medicine.patient,
                scheduled_for=timezone.now() + timedelta(minutes=offset),
                quantity_expected=Decimal("1"),
            )
            actions.mark_taken(dose)

        warnings = NotificationLog.objects.filter(category=NotificationCategory.LOW_STOCK)
        assert warnings.count() == 1


class TestMarkMissed:
    def test_it_records_the_dose_without_touching_stock(self, dose, medicine):
        actions.mark_missed(dose)

        dose.refresh_from_db()
        medicine.refresh_from_db()
        assert dose.status == DoseStatus.MISSED
        assert medicine.quantity_remaining == Decimal("30")

    def test_it_notifies_the_patient(self, dose):
        actions.mark_missed(dose)
        assert NotificationLog.objects.filter(category=NotificationCategory.DOSE_MISSED).exists()

    def test_it_alerts_an_active_caregiver(self, dose, active_assignment):
        actions.mark_missed(dose)

        alerts = NotificationLog.objects.filter(category=NotificationCategory.CAREGIVER_ALERT)
        assert alerts.count() >= 1
        assert alerts.first().recipient == active_assignment.caregiver

        dose.refresh_from_db()
        assert dose.caregiver_alerted_at is not None

    def test_a_pending_caregiver_is_not_alerted(self, dose, patient, caregiver):
        """Access is granted by the patient; a pending link confers nothing."""
        from apps.accounts.models import CaregiverAssignment

        CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        actions.mark_missed(dose)

        assert not NotificationLog.objects.filter(
            category=NotificationCategory.CAREGIVER_ALERT
        ).exists()

    def test_a_caregiver_who_opted_out_is_not_alerted(self, dose, active_assignment):
        active_assignment.can_receive_alerts = False
        active_assignment.save(update_fields=["can_receive_alerts"])

        actions.mark_missed(dose)
        assert not NotificationLog.objects.filter(
            category=NotificationCategory.CAREGIVER_ALERT
        ).exists()


class TestSkip:
    def test_a_skipped_dose_is_not_an_adherence_failure(self, dose):
        actions.mark_skipped(dose, notes="Doctor said to stop")

        dose.refresh_from_db()
        assert dose.status == DoseStatus.SKIPPED
        assert dose.notes == "Doctor said to stop"
        assert not NotificationLog.objects.filter(
            category=NotificationCategory.CAREGIVER_ALERT
        ).exists()


class TestSnooze:
    def test_it_pushes_the_reminder_back(self, dose):
        actions.snooze(dose, minutes=15)

        dose.refresh_from_db()
        assert dose.status == DoseStatus.SNOOZED
        assert dose.snooze_count == 1
        assert dose.snooze_until > timezone.now()
        assert dose.effective_time == dose.snooze_until

    def test_a_snoozed_dose_is_still_open(self, dose):
        actions.snooze(dose)
        assert dose.is_open

    def test_it_is_capped(self, dose):
        for _ in range(MAX_SNOOZES):
            actions.snooze(dose)

        assert not dose.can_snooze
        with pytest.raises(ValidationError, match="Mark it taken or missed"):
            actions.snooze(dose)

    def test_a_snoozed_dose_can_still_be_taken(self, dose, medicine):
        actions.snooze(dose)
        actions.mark_taken(dose)

        dose.refresh_from_db()
        assert dose.status == DoseStatus.TAKEN
        assert dose.snooze_until is None

    def test_an_absurd_snooze_is_rejected(self, dose):
        with pytest.raises(ValidationError):
            actions.snooze(dose, minutes=0)
        with pytest.raises(ValidationError):
            actions.snooze(dose, minutes=999)


class TestSweepOverdue:
    def _overdue_dose(self, schedule, medicine, hours_ago):
        return DoseEvent.objects.create(
            schedule=schedule,
            medicine=medicine,
            patient=medicine.patient,
            scheduled_for=timezone.now() - timedelta(hours=hours_ago),
            quantity_expected=Decimal("1"),
        )

    def test_it_closes_out_doses_nobody_answered(self, schedule, medicine):
        stale = self._overdue_dose(schedule, medicine, MISSED_AFTER.total_seconds() / 3600 + 1)

        assert actions.sweep_overdue() == 1
        stale.refresh_from_db()
        assert stale.status == DoseStatus.MISSED

    def test_a_dose_still_inside_its_window_is_left_alone(self, schedule, medicine):
        recent = self._overdue_dose(schedule, medicine, 1)

        assert actions.sweep_overdue() == 0
        recent.refresh_from_db()
        assert recent.status == DoseStatus.PENDING

    def test_an_answered_dose_is_never_swept(self, schedule, medicine):
        answered = self._overdue_dose(schedule, medicine, 24)
        actions.mark_taken(answered)

        assert actions.sweep_overdue() == 0
        answered.refresh_from_db()
        assert answered.status == DoseStatus.TAKEN

    def test_an_overdue_snooze_is_swept_too(self, schedule, medicine):
        """A snooze must not become a way to keep a dose open indefinitely."""
        dose = self._overdue_dose(schedule, medicine, 24)
        actions.snooze(dose)

        assert actions.sweep_overdue() == 1
        dose.refresh_from_db()
        assert dose.status == DoseStatus.MISSED
