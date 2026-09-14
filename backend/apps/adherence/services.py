from datetime import date

from django.db.models import Count, Q

from .models import DoseEvent


def history_queryset(queryset, start_date=None, end_date=None, medication_id=None):
    if start_date:
        queryset = queryset.filter(scheduled_for__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(scheduled_for__date__lte=end_date)
    if medication_id:
        queryset = queryset.filter(medication_id=medication_id)
    return queryset


def parse_date(value):
    if not value:
        return None
    return date.fromisoformat(value)


def history_summary(queryset):
    counts = queryset.aggregate(
        total=Count("id"),
        taken=Count("id", filter=Q(status=DoseEvent.Status.TAKEN)),
        missed=Count("id", filter=Q(status=DoseEvent.Status.MISSED)),
        snoozed=Count("id", filter=Q(status=DoseEvent.Status.SNOOZED)),
    )
    total = counts["total"] or 0
    counts["adherence_percentage"] = round((counts["taken"] / total) * 100, 2) if total else 0
    return counts
