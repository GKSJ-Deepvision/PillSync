"""Schedule rules and dose-event generation.

These are the calculations everything else in Milestone 2 rests on: get
`occurs_on` wrong and a patient is reminded on the wrong days; get generation
wrong and they are reminded twice, or not at all.
"""

from __future__ import annotations

from datetime import date, time, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.common.choices import DoseSlot, DoseStatus, ScheduleFrequency
from apps.medications.models import MedicationSchedule, Medicine
from apps.reminders.models import DoseEvent
from apps.reminders.services import generation

pytestmark = pytest.mark.django_db


@pytest.fixture
def medicine(db, patient):
    profile = patient.patient_profile
    return Medicine.objects.create(
        patient=profile,
        name="Metformin Hydrochloride",
        brand_name="Glucophage",
        strength="500",
        strength_unit="mg/1",
        category="DIABETES",
        quantity_remaining=Decimal("60"),
        low_stock_threshold=Decimal("10"),
        start_date=date(2026, 1, 1),
    )


def make_schedule(medicine, **overrides):
    defaults = {
        "slot": DoseSlot.MORNING,
        "time_of_day": time(8, 0),
        "quantity_per_dose": Decimal("2"),
        "frequency": ScheduleFrequency.DAILY,
        "start_date": date(2026, 1, 1),
    }
    return MedicationSchedule.objects.create(medicine=medicine, **{**defaults, **overrides})


class TestOccursOn:
    def test_daily_fires_every_day(self, medicine):
        schedule = make_schedule(medicine)
        for offset in range(7):
            assert schedule.occurs_on(date(2026, 6, 1) + timedelta(days=offset))

    def test_specific_days_fires_only_on_those_days(self, medicine):
        # Monday and Thursday.
        schedule = make_schedule(
            medicine, frequency=ScheduleFrequency.SPECIFIC_DAYS, days_of_week=[1, 4]
        )
        monday = date(2026, 6, 1)
        assert monday.isoweekday() == 1

        assert schedule.occurs_on(monday)
        assert not schedule.occurs_on(monday + timedelta(days=1))
        assert schedule.occurs_on(monday + timedelta(days=3))
        assert not schedule.occurs_on(monday + timedelta(days=5))

    def test_interval_counts_from_the_start_date(self, medicine):
        schedule = make_schedule(
            medicine,
            frequency=ScheduleFrequency.INTERVAL,
            interval_days=3,
            start_date=date(2026, 6, 1),
        )
        assert schedule.occurs_on(date(2026, 6, 1))
        assert not schedule.occurs_on(date(2026, 6, 2))
        assert not schedule.occurs_on(date(2026, 6, 3))
        assert schedule.occurs_on(date(2026, 6, 4))

    def test_nothing_fires_before_the_start_date(self, medicine):
        schedule = make_schedule(medicine, start_date=date(2026, 6, 10))
        assert not schedule.occurs_on(date(2026, 6, 9))
        assert schedule.occurs_on(date(2026, 6, 10))

    def test_nothing_fires_after_the_end_date(self, medicine):
        schedule = make_schedule(medicine, end_date=date(2026, 6, 10))
        assert schedule.occurs_on(date(2026, 6, 10))
        assert not schedule.occurs_on(date(2026, 6, 11))

    def test_an_inactive_schedule_never_fires(self, medicine):
        schedule = make_schedule(medicine, is_active=False)
        assert not schedule.occurs_on(date(2026, 6, 1))

    def test_a_finished_course_stops_the_schedule(self, medicine):
        """The medicine's own end date wins over the schedule's."""
        medicine.end_date = date(2026, 6, 5)
        medicine.save(update_fields=["end_date"])
        schedule = make_schedule(medicine)

        assert schedule.occurs_on(date(2026, 6, 5))
        assert not schedule.occurs_on(date(2026, 6, 6))


class TestDosesPerDay:
    def test_daily_is_the_dose_itself(self, medicine):
        assert make_schedule(medicine).doses_per_day() == Decimal("2")

    def test_specific_days_is_prorated_over_the_week(self, medicine):
        schedule = make_schedule(
            medicine,
            quantity_per_dose=Decimal("1"),
            frequency=ScheduleFrequency.SPECIFIC_DAYS,
            days_of_week=[1, 4],
        )
        assert schedule.doses_per_day() == pytest.approx(Decimal(2) / Decimal(7))

    def test_interval_divides_by_the_gap(self, medicine):
        schedule = make_schedule(
            medicine,
            quantity_per_dose=Decimal("1"),
            frequency=ScheduleFrequency.INTERVAL,
            interval_days=2,
        )
        assert schedule.doses_per_day() == Decimal("0.5")


class TestGeneration:
    def test_creates_one_dose_per_day_in_the_horizon(self, medicine):
        schedule = make_schedule(medicine)
        created = generation.generate_for_schedule(schedule, horizon_days=6)

        # Today plus six days ahead.
        assert len(created) == 7
        assert DoseEvent.objects.filter(schedule=schedule).count() == 7

    def test_running_twice_creates_nothing_extra(self, medicine):
        schedule = make_schedule(medicine)
        generation.generate_for_schedule(schedule, horizon_days=6)
        second = generation.generate_for_schedule(schedule, horizon_days=6)

        assert second == []
        assert DoseEvent.objects.filter(schedule=schedule).count() == 7

    def test_extending_the_horizon_only_adds_the_new_days(self, medicine):
        schedule = make_schedule(medicine)
        generation.generate_for_schedule(schedule, horizon_days=3)
        generation.generate_for_schedule(schedule, horizon_days=6)

        assert DoseEvent.objects.filter(schedule=schedule).count() == 7

    def test_it_never_back_fills_the_past(self, medicine):
        """A schedule added today must not invent doses the patient never had."""
        schedule = make_schedule(medicine, start_date=timezone.localdate() - timedelta(days=30))
        generation.generate_for_schedule(schedule, horizon_days=2)

        earliest = DoseEvent.objects.filter(schedule=schedule).earliest("scheduled_for")
        assert timezone.localtime(earliest.scheduled_for).date() >= timezone.localdate()

    def test_the_dose_carries_the_scheduled_quantity_and_slot(self, medicine):
        schedule = make_schedule(medicine, slot=DoseSlot.NIGHT, quantity_per_dose=Decimal("1.5"))
        generation.generate_for_schedule(schedule, horizon_days=1)

        dose = DoseEvent.objects.filter(schedule=schedule).first()
        assert dose.slot == DoseSlot.NIGHT
        assert dose.quantity_expected == Decimal("1.5")
        assert dose.patient_id == medicine.patient_id

    def test_an_inactive_schedule_generates_nothing(self, medicine):
        schedule = make_schedule(medicine, is_active=False)
        assert generation.generate_for_schedule(schedule, horizon_days=6) == []

    def test_specific_days_only_generates_those_days(self, medicine):
        schedule = make_schedule(
            medicine, frequency=ScheduleFrequency.SPECIFIC_DAYS, days_of_week=[1, 2, 3, 4, 5]
        )
        generation.generate_for_schedule(schedule, horizon_days=13)

        weekdays = {
            timezone.localtime(d.scheduled_for).isoweekday()
            for d in DoseEvent.objects.filter(schedule=schedule)
        }
        assert weekdays <= {1, 2, 3, 4, 5}

    def test_the_dose_time_follows_the_patients_timezone(self, medicine):
        """08:00 means 08:00 where the patient is, not on the server."""
        profile = medicine.patient
        profile.timezone_name = "Asia/Kolkata"
        profile.save(update_fields=["timezone_name"])

        schedule = make_schedule(medicine, time_of_day=time(8, 0))
        generation.generate_for_schedule(schedule, horizon_days=2)

        dose = DoseEvent.objects.filter(schedule=schedule).first()
        local = dose.scheduled_for.astimezone(generation.patient_timezone(profile))
        assert local.hour == 8 and local.minute == 0

    def test_an_unusable_timezone_falls_back_instead_of_crashing(self, medicine):
        profile = medicine.patient
        profile.timezone_name = "Not/AZone"
        profile.save(update_fields=["timezone_name"])

        schedule = make_schedule(medicine)
        assert generation.generate_for_schedule(schedule, horizon_days=1)


class TestRegeneration:
    def test_editing_a_schedule_moves_the_untouched_future_doses(self, medicine):
        schedule = make_schedule(medicine, time_of_day=time(8, 0))
        generation.generate_for_schedule(schedule, horizon_days=5)

        schedule.time_of_day = time(21, 30)
        schedule.save(update_fields=["time_of_day"])
        generation.regenerate_for_schedule(schedule, horizon_days=5)

        hours = {
            timezone.localtime(d.scheduled_for).hour
            for d in DoseEvent.objects.filter(schedule=schedule, status=DoseStatus.PENDING)
        }
        assert hours == {21}

    def test_a_dose_already_answered_survives_regeneration(self, medicine):
        schedule = make_schedule(medicine)
        generation.generate_for_schedule(schedule, horizon_days=5)

        answered = DoseEvent.objects.filter(schedule=schedule).latest("scheduled_for")
        answered.status = DoseStatus.TAKEN
        answered.save(update_fields=["status"])

        generation.regenerate_for_schedule(schedule, horizon_days=5)
        assert DoseEvent.objects.filter(pk=answered.pk).exists()

    def test_a_dose_whose_reminder_already_went_out_survives(self, medicine):
        schedule = make_schedule(medicine)
        generation.generate_for_schedule(schedule, horizon_days=5)

        sent = DoseEvent.objects.filter(schedule=schedule).latest("scheduled_for")
        sent.reminder_sent_at = timezone.now()
        sent.save(update_fields=["reminder_sent_at"])

        generation.drop_future_events(schedule)
        assert DoseEvent.objects.filter(pk=sent.pk).exists()
