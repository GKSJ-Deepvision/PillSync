from django.utils import timezone

from ..models import Reminder


def mark_overdue_reminders():
    now = timezone.localtime()

    reminders = Reminder.objects.filter(
        reminder_date=now.date(),
        status=Reminder.Status.PENDING,
        scheduled_time__lt=now.time(),
    )

    updated_count = reminders.update(
        status=Reminder.Status.MISSED,
        snoozed_until=None,
    )

    return updated_count