from celery import shared_task
from django.utils import timezone

from .services.generation import generate_all


@shared_task
def generate_upcoming_reminders(days: int = 14):
    """Generate reminders for active medicine schedules."""
    start_date = timezone.localdate()

    return len(
        generate_all(
            start_date=start_date,
            days=days,
        )
    )
