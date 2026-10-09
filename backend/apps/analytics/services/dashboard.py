from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.adherence.services import calculate_adherence
from apps.medicines.models import MedicationHistory, Medicine
from apps.reminders.models import Reminder


def build_dashboard(user, *, start_date=None, end_date=None):
    history = MedicationHistory.objects.filter(medicine__user=user)
    if start_date:
        history = history.filter(scheduled_at__date__gte=start_date)
    if end_date:
        history = history.filter(scheduled_at__date__lte=end_date)

    history_totals = history.aggregate(
        total=Count("id"),
        taken=Count("id", filter=Q(status=MedicationHistory.Status.TAKEN)),
        missed=Count("id", filter=Q(status=MedicationHistory.Status.MISSED)),
        skipped=Count("id", filter=Q(status=MedicationHistory.Status.SKIPPED)),
    )
    active_medicines = (
        Medicine.objects.filter(user=user, is_active=True)
        .select_related("refill_prediction")
        .order_by("name", "id")
    )
    medicine_data = [
        {
            "id": medicine.id,
            "name": medicine.name,
            "dosage": medicine.dosage,
            "quantity": medicine.quantity,
            "refill_threshold": medicine.refill_threshold,
            "is_low_stock": medicine.quantity <= medicine.refill_threshold,
            "refill_prediction": _prediction_data(medicine),
        }
        for medicine in active_medicines
    ]

    now = timezone.now()
    reminders = (
        Reminder.objects.filter(
            schedule__medicine__user=user,
            status__in=[Reminder.Status.PENDING, Reminder.Status.SNOOZED],
            scheduled_at__gte=now,
            scheduled_at__lt=now + timedelta(days=7),
        )
        .select_related("schedule__medicine")
        .order_by("scheduled_at")[:10]
    )
    reminder_data = [
        {
            "id": reminder.id,
            "medicine_name": reminder.schedule.medicine.name,
            "scheduled_at": reminder.scheduled_at,
            "period": reminder.period,
            "status": reminder.status,
        }
        for reminder in reminders
    ]
    adherence = calculate_adherence(
        user,
        start_date=start_date,
        end_date=end_date,
    )
    return {
        "summary": {
            "active_medicines": len(medicine_data),
            "low_stock_medicines": sum(medicine["is_low_stock"] for medicine in medicine_data),
            "total_scheduled": adherence["total_scheduled"],
            "taken": adherence["taken"],
            "missed": adherence["missed"],
            "adherence_percentage": adherence["adherence_percentage"],
        },
        "adherence": adherence,
        "history": history_totals,
        "active_medicines": medicine_data,
        "upcoming_reminders": reminder_data,
    }


def _prediction_data(medicine):
    prediction = getattr(medicine, "refill_prediction", None)
    if prediction is None:
        return None
    return {
        "daily_consumption": prediction.daily_consumption,
        "days_remaining": prediction.days_remaining,
        "predicted_refill_date": prediction.predicted_refill_date,
        "is_fallback": prediction.is_fallback,
    }
