from datetime import UTC, datetime

from apps.adherence.models import AdherenceLog
from apps.reminders.models import Reminder


def record_dose_action(reminder_id_or_instance, action_type, notes=""):
    """
    Records dose action: TAKEN, MISSED, SNOOZED, or SKIPPED.
    Updates reminder status, logs adherence, and decrements stock if taken.
    """
    if isinstance(reminder_id_or_instance, Reminder):
        reminder = reminder_id_or_instance
    else:
        reminder = Reminder.objects.get(pk=reminder_id_or_instance)

    action_norm = action_type.strip().capitalize()
    if action_norm not in ["Taken", "Missed", "Snoozed", "Skipped"]:
        action_norm = "Taken"

    reminder.status = action_norm
    reminder.save()

    # Determine medicine and dosage
    med_name = reminder.title
    dosage = "1 Tablet"
    medicine = None
    if reminder.schedule:
        medicine = reminder.schedule.medicine
        med_name = medicine.name
        dosage = reminder.schedule.dosage_amount

    # Decrement stock if taken
    if action_norm == "Taken" and medicine:
        if medicine.stock_quantity > 0:
            medicine.stock_quantity -= 1
            medicine.save()

    # Create adherence log
    now = datetime.now(UTC)
    adherence_status = "Taken" if action_norm in ["Taken", "Skipped"] else action_norm
    adherence_log = AdherenceLog.objects.create(
        patient_profile=reminder.patient_profile,
        medicine=medicine,
        medicine_name=med_name,
        dosage=dosage,
        schedule=reminder.schedule,
        action_date=now.date(),
        action_time=now.strftime("%I:%M %p"),
        status=adherence_status,
        notes=notes or f"Action: {action_norm}",
    )

    return {
        "reminder_id": reminder.id,
        "status": reminder.status,
        "adherence_log_id": adherence_log.id,
        "medicine": med_name,
        "action": action_norm,
    }
