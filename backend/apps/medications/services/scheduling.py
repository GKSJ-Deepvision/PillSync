from datetime import timedelta

from django.utils import timezone

from ..models import MedicationSchedule


def get_schedules_for_date(patient_id, target_date=None):
    """Return active medication schedules that occur on a given date."""
    if target_date is None:
        target_date = timezone.localdate()

    schedules = MedicationSchedule.objects.filter(
        medicine__patient_id=patient_id,
        is_active=True,
    ).select_related("medicine", "dosage")

    return [schedule for schedule in schedules if schedule.occurs_on(target_date)]


def get_next_occurrences(patient_id, days=7):
    """Return upcoming medication schedules for the requested number of days."""
    today = timezone.localdate()
    results = []

    schedules = MedicationSchedule.objects.filter(
        medicine__patient_id=patient_id,
        is_active=True,
    ).select_related("medicine", "dosage")

    for schedule in schedules:
        for offset in range(days):
            target_date = today + timedelta(days=offset)

            if schedule.occurs_on(target_date):
                results.append(
                    {
                        "schedule": schedule,
                        "date": target_date,
                        "time": schedule.time_of_day,
                    }
                )

    return sorted(results, key=lambda item: (item["date"], item["time"]))


def update_stock(medicine, quantity_change):
    """Manually increase or decrease medicine stock."""
    new_quantity = medicine.quantity_remaining + quantity_change

    if new_quantity < 0:
        raise ValueError("Stock quantity cannot be negative.")

    medicine.quantity_remaining = new_quantity
    medicine.save(update_fields=["quantity_remaining", "updated_at"])

    return medicine
