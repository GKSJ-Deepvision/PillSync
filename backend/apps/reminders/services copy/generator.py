from django.db.models import Q
from django.utils import timezone

from apps.medications.models import MedicationSchedule

from ..models import Reminder


def generate_daily_reminders(target_date=None):
    if target_date is None:
        target_date = timezone.localdate()

    schedules = MedicationSchedule.objects.select_related(
        "dosage__medicine"
    ).filter(
        is_active=True,
        dosage__medicine__is_active=True,
        start_date__lte=target_date,
    ).filter(
        Q(end_date__isnull=True) | Q(end_date__gte=target_date)
    )

    created_reminders = []

    for schedule in schedules:
        reminder, created = Reminder.objects.get_or_create(
            schedule=schedule,
            reminder_date=target_date,
            defaults={
                "scheduled_time": schedule.scheduled_time,
                "status": Reminder.Status.PENDING,
            },
        )

        if created:
            created_reminders.append(reminder)

    return created_reminders