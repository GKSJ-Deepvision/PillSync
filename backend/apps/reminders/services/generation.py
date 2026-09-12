from datetime import date, datetime, time, timedelta

from django.utils import timezone

from apps.medicines.models import Medicine, MedicineSchedule

from ..models import Reminder


def get_period(schedule_time: time) -> str:
    """Return the reminder period for a scheduled dose."""
    if time(5, 0) <= schedule_time < time(12, 0):
        return Reminder.Period.MORNING

    if time(12, 0) <= schedule_time < time(17, 0):
        return Reminder.Period.AFTERNOON

    return Reminder.Period.NIGHT


def schedule_occurs_on(schedule: MedicineSchedule, day: date) -> bool:
    """Return whether a schedule occurs on the given date."""
    if not schedule.is_active:
        return False

    if day < schedule.start_date:
        return False

    if schedule.end_date is not None and day > schedule.end_date:
        return False

    if schedule.frequency == MedicineSchedule.Frequency.DAILY:
        return True

    if schedule.frequency == MedicineSchedule.Frequency.WEEKLY:
        return day.weekday() == schedule.day_of_week

    return False


def generate_for_schedule(
    schedule: MedicineSchedule,
    *,
    start_date: date,
    days: int = 14,
) -> list[Reminder]:
    """Generate reminders for a schedule over a future date range."""
    if not schedule.is_active:
        return []

    reminders = []

    for offset in range(days):
        day = start_date + timedelta(days=offset)

        if not schedule_occurs_on(schedule, day):
            continue

        scheduled_at = datetime.combine(day, schedule.time)
        scheduled_at = timezone.make_aware(
            scheduled_at,
            timezone.get_current_timezone(),
        )

        reminder, created = Reminder.objects.get_or_create(
            schedule=schedule,
            scheduled_at=scheduled_at,
            defaults={
                "period": get_period(schedule.time),
            },
        )

        if created:
            reminders.append(reminder)

    return reminders


def generate_for_medicine(
    medicine: Medicine,
    *,
    start_date: date,
    days: int = 14,
) -> list[Reminder]:
    """Generate reminders for all active schedules of a medicine."""
    reminders = []

    schedules = MedicineSchedule.objects.filter(
        medicine=medicine,
        is_active=True,
    )

    for schedule in schedules:
        reminders.extend(
            generate_for_schedule(
                schedule,
                start_date=start_date,
                days=days,
            )
        )

    return reminders


def generate_all(
    *,
    start_date: date,
    days: int = 14,
) -> list[Reminder]:
    """Generate reminders for all active medicine schedules."""
    reminders = []

    schedules = MedicineSchedule.objects.filter(
        is_active=True,
        medicine__is_active=True,
    )

    for schedule in schedules:
        reminders.extend(
            generate_for_schedule(
                schedule,
                start_date=start_date,
                days=days,
            )
        )

    return reminders
