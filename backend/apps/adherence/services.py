from datetime import date, datetime, time, timedelta

from django.utils import timezone

from apps.medicines.models import MedicationHistory, Medicine


def calculate_adherence(
    user,
    *,
    medicine: Medicine | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    """Calculate adherence from the user's recorded medication history."""
    history = MedicationHistory.objects.filter(medicine__user=user)

    if medicine is not None:
        history = history.filter(medicine=medicine)

    if start_date is not None:
        history = history.filter(scheduled_at__gte=_start_of_day(start_date))

    if end_date is not None:
        history = history.filter(scheduled_at__lt=_start_of_day(end_date + timedelta(days=1)))

    history = history.order_by("scheduled_at", "id")
    daily = {}
    total_scheduled = 0
    taken = 0

    for event in history:
        event_date = timezone.localtime(event.scheduled_at).date()
        day = daily.setdefault(event_date, {"scheduled": 0, "taken": 0})
        day["scheduled"] += 1
        total_scheduled += 1

        if event.status == MedicationHistory.Status.TAKEN:
            day["taken"] += 1
            taken += 1

    missed = total_scheduled - taken
    return {
        "total_scheduled": total_scheduled,
        "taken": taken,
        "missed": missed,
        "adherence_percentage": _percentage(taken, total_scheduled),
        "daily_breakdown": [
            _daily_result(event_date, values) for event_date, values in daily.items()
        ],
    }


def _start_of_day(day: date) -> datetime:
    return timezone.make_aware(datetime.combine(day, time.min))


def _percentage(taken: int, total: int) -> float:
    if total == 0:
        return 0.0

    return round(taken / total * 100, 2)


def _daily_result(event_date: date, values: dict[str, int]) -> dict:
    scheduled = values["scheduled"]
    taken = values["taken"]
    return {
        "date": event_date.isoformat(),
        "scheduled": scheduled,
        "taken": taken,
        "missed": scheduled - taken,
        "adherence_percentage": _percentage(taken, scheduled),
    }
