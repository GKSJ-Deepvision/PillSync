from datetime import datetime, time, timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from apps.notifications.models import Notification
from apps.reminders.models import Reminder

from .models import Prescription


@shared_task
def generate_prescription_expiry_reminders():
    """Create one notification for each prescription nearing expiry."""
    today = timezone.localdate()
    reminder_days = getattr(settings, "PRESCRIPTION_EXPIRY_REMINDER_DAYS", 30)
    expiry_limit = today + timedelta(days=reminder_days)
    prescriptions = Prescription.objects.filter(
        expiry_date__range=(today, expiry_limit),
    )
    created_count = 0

    for prescription in prescriptions:
        reminder, reminder_created = Reminder.objects.get_or_create(
            prescription=prescription,
            defaults={
                "scheduled_at": timezone.make_aware(
                    datetime.combine(prescription.expiry_date, time.min)
                ),
                "period": Reminder.Period.MORNING,
            },
        )
        _, notification_created = Notification.objects.get_or_create(
            reminder=reminder,
            channel=Notification.Channel.EMAIL,
            defaults={
                "message": (
                    f"Your prescription from {prescription.doctor_name} "
                    f"expires on {prescription.expiry_date}."
                ),
            },
        )
        if reminder_created or notification_created:
            created_count += 1

    return created_count
