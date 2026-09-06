from datetime import date, datetime, timedelta

from django.utils import timezone

from apps.medications.models import MedicationSchedule

from ..models import Reminder, ReminderStatus


def create_reminder_for_schedule(
    schedule: MedicationSchedule,
    dose_date: date,
) -> Reminder | None:
    """
    Create a reminder for a scheduled dose on a specific date.

    Returns None when the schedule does not require a reminder
    on the requested date.
    """
    if not schedule.is_active:
        return None

    if not schedule.reminder_enabled:
        return None

    if not schedule.occurs_on(dose_date):
        return None

    dose_datetime = datetime.combine(
        dose_date,
        schedule.time_of_day,
    )

    dose_datetime = timezone.make_aware(dose_datetime)

    reminder_datetime = dose_datetime - timedelta(minutes=schedule.remind_minutes_before)

    medicine = schedule.medicine

    message = f"Time to take {medicine.display_name} " f"({schedule.quantity_per_dose} dose)"

    reminder, _ = Reminder.objects.get_or_create(
        schedule=schedule,
        dose_datetime=dose_datetime,
        defaults={
            "reminder_datetime": reminder_datetime,
            "status": ReminderStatus.PENDING,
            "message": message,
        },
    )

    return reminder


def create_today_reminders(
    patient_id: int,
    target_date: date | None = None,
):
    """
    Create reminders for all eligible schedules belonging to a patient
    for the requested date.
    """
    target_date = target_date or timezone.localdate()

    schedules = MedicationSchedule.objects.filter(
        medicine__patient_id=patient_id,
        is_active=True,
        reminder_enabled=True,
    ).select_related("medicine", "dosage")

    reminders = []

    for schedule in schedules:
        reminder = create_reminder_for_schedule(schedule, target_date)

        if reminder is not None:
            reminders.append(reminder)

    return reminders
