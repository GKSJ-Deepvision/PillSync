from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.medications.models import MedicationSchedule, Medicine

REFILL_LEAD_DAYS = 5


def analyze_dosage(medicine):
    """Normalize active schedules into daily dosage/stock consumption."""
    schedules = (
        MedicationSchedule.objects.filter(
            medicine=medicine,
            is_active=True,
        )
        .select_related("dosage")
        .order_by("time_of_day")
    )

    items = []
    daily_stock_consumption = Decimal("0")
    active_schedule_count = 0

    for schedule in schedules:
        weekly_occurrences = sum(
            schedule.occurs_on(timezone.localdate() + timedelta(days=offset)) for offset in range(7)
        )
        average_per_day = (
            Decimal(str(weekly_occurrences)) / Decimal("7") if weekly_occurrences else Decimal("0")
        )
        consumption = Decimal(str(schedule.quantity_per_dose)) * average_per_day

        if weekly_occurrences:
            active_schedule_count += 1
            daily_stock_consumption += consumption

        items.append(
            {
                "schedule_id": str(schedule.id),
                "medicine": medicine.display_name,
                "strength": f"{medicine.strength} {medicine.strength_unit}".strip(),
                "slot": schedule.slot,
                "time": schedule.time_of_day.strftime("%H:%M"),
                "quantity_per_dose": float(schedule.quantity_per_dose),
                "frequency": schedule.frequency,
                "days_of_week": schedule.days_of_week,
                "weekly_occurrences": weekly_occurrences,
                "average_daily_doses": round(float(average_per_day), 2),
                "daily_stock_consumption": round(float(consumption), 2),
            }
        )

    return {
        "medicine_id": str(medicine.id),
        "medicine": medicine.display_name,
        "strength": f"{medicine.strength} {medicine.strength_unit}".strip(),
        "quantity_remaining": float(medicine.quantity_remaining),
        "active_schedule_count": active_schedule_count,
        "daily_dose_units": round(float(daily_stock_consumption), 2),
        "daily_stock_consumption": round(float(daily_stock_consumption), 2),
        "schedules": items,
    }


def predict_refill(medicine, lead_days=REFILL_LEAD_DAYS):
    """Predict depletion and recommended refill dates from stock + dosage."""
    analysis = analyze_dosage(medicine)
    remaining = Decimal(str(medicine.quantity_remaining))
    daily_consumption = Decimal(str(analysis["daily_stock_consumption"]))
    today = timezone.localdate()

    if remaining <= 0:
        days_remaining = Decimal("0")
        depletion_date = today
        status = "OUT_OF_STOCK"
    elif daily_consumption <= 0:
        days_remaining = None
        depletion_date = None
        status = "NO_ACTIVE_DOSAGE"
    else:
        days_remaining = remaining / daily_consumption
        depletion_date = today + timedelta(days=max(0, int(days_remaining)))
        if days_remaining <= lead_days:
            status = "REFILL_DUE"
        elif remaining <= medicine.low_stock_threshold:
            status = "LOW_STOCK"
        else:
            status = "OK"

    refill_date = depletion_date - timedelta(days=lead_days) if depletion_date is not None else None

    return {
        "medicine_id": str(medicine.id),
        "medicine": medicine.display_name,
        "strength": analysis["strength"],
        "quantity_remaining": float(remaining),
        "daily_stock_consumption": float(daily_consumption),
        "days_remaining": (round(float(days_remaining), 2) if days_remaining is not None else None),
        "predicted_depletion_date": (depletion_date.isoformat() if depletion_date else None),
        "recommended_refill_date": (refill_date.isoformat() if refill_date else None),
        "refill_lead_days": lead_days,
        "status": status,
        "low_stock_threshold": float(medicine.low_stock_threshold),
        "dosage": analysis,
    }


def get_refill_predictions(patient_id, lead_days=REFILL_LEAD_DAYS):
    medicines = Medicine.objects.filter(
        patient_id=patient_id,
        is_active=True,
    ).order_by("name")
    return [predict_refill(medicine, lead_days) for medicine in medicines]


def get_dosage_analysis(patient_id):
    medicines = Medicine.objects.filter(
        patient_id=patient_id,
        is_active=True,
    ).order_by("name")
    return [analyze_dosage(medicine) for medicine in medicines]
