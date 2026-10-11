from apps.notifications.models import Notification
from apps.refills.models import RefillPrediction


def check_and_create_refill_alerts(patient_profile, medicine, forecast_data):
    """
    Evaluates refill forecast and triggers notifications/alerts
    for patient and connected caregiver if stock is low or critical.
    """
    days = forecast_data.get("days_remaining", 10)
    refill_needed = forecast_data.get("refill_needed", False)

    if not refill_needed:
        return None

    urgency = "URGENT" if days <= 3 else "NOTICE"
    message = (
        f"[{urgency}] {medicine.name} has only {days} days of doses remaining "
        f"({forecast_data.get('current_stock', 0)} units). Refill order recommended."
    )

    # Patient Notification
    notification = Notification.objects.create(
        patient_profile=patient_profile,
        title=f"Refill Alert: {medicine.name}",
        message=message,
        notification_type=Notification.Type.REFILL,
    )

    # Save prediction record
    prediction, _ = RefillPrediction.objects.update_or_create(
        patient_profile=patient_profile,
        medicine=medicine,
        defaults={
            "medicine_name": medicine.name,
            "days_remaining": days,
            "refill_needed": refill_needed,
            "predicted_depletion_date": forecast_data.get("projected_depletion_date"),
        },
    )

    return {
        "alert_created": True,
        "notification_id": notification.id,
        "prediction_id": prediction.id,
        "urgency": urgency,
        "message": message,
    }
