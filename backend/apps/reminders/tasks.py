from django.utils import timezone

from .services.generation import generate_all


def generate_upcoming_reminders(days: int = 14):
    """Generate reminders for active medicine schedules."""
    start_date = timezone.localdate()

    return generate_all(
        start_date=start_date,
        days=days,
    )
