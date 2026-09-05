"""Deciding who gets told what, and writing down whether it worked.

Providers know *how* to send. This module knows *whether* to send: it applies
the recipient's preferences and quiet hours, picks the channels, records a log
row per attempt, and never lets one failed delivery stop the rest.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from apps.common.choices import (
    AssignmentStatus,
    NotificationCategory,
    NotificationChannel,
)
from apps.notifications.models import DeviceToken, NotificationLog, NotificationPreference
from apps.notifications.providers.base import Message
from apps.notifications.providers.channels import provider_for

logger = logging.getLogger(__name__)

#: Which channels each category uses when the recipient has not narrowed it.
DEFAULT_CHANNELS = {
    NotificationCategory.DOSE_REMINDER: (NotificationChannel.PUSH,),
    NotificationCategory.DOSE_MISSED: (NotificationChannel.PUSH,),
    NotificationCategory.CAREGIVER_ALERT: (NotificationChannel.PUSH, NotificationChannel.EMAIL),
    NotificationCategory.LOW_STOCK: (NotificationChannel.PUSH,),
    NotificationCategory.REFILL_DUE: (NotificationChannel.PUSH, NotificationChannel.EMAIL),
    NotificationCategory.PRESCRIPTION_EXPIRY: (NotificationChannel.EMAIL,),
}


def preferences_for(user) -> NotificationPreference:
    preference, _ = NotificationPreference.objects.get_or_create(user=user)
    return preference


def send(
    *,
    recipient,
    category: str,
    subject: str,
    body: str,
    payload: dict | None = None,
    channels: tuple[str, ...] | None = None,
    dose_event=None,
) -> list[NotificationLog]:
    """Deliver one notification across every channel that is allowed.

    Returns a log row per channel attempted, including the ones skipped by
    preference — "why didn't I get a reminder" is a question the platform has
    to be able to answer.
    """
    if not recipient.is_active:
        return []

    preference = preferences_for(recipient)
    wanted = channels or DEFAULT_CHANNELS.get(category, (NotificationChannel.PUSH,))
    payload = payload or {}

    logs: list[NotificationLog] = []
    for channel in wanted:
        log = NotificationLog.objects.create(
            recipient=recipient,
            category=category,
            channel=channel,
            subject=subject[:200],
            body=body,
            payload=payload,
            dose_event=dose_event,
        )
        logs.append(log)

        if not preference.should_send(category, channel, at=timezone.localtime()):
            log.mark_skipped("Blocked by the recipient's notification preferences.")
            continue

        tokens = ()
        if channel == NotificationChannel.PUSH:
            tokens = tuple(
                DeviceToken.objects.filter(user=recipient, is_active=True).values_list(
                    "token", flat=True
                )
            )

        message = Message(
            recipient_email=recipient.email,
            recipient_phone=recipient.phone_number,
            subject=subject,
            body=body,
            payload=payload,
            device_tokens=tokens,
        )

        result = provider_for(channel).send(message)
        if result.ok:
            log.mark_sent(result.provider_message_id)
        else:
            log.mark_failed(result.error)

    return logs


# ---------------------------------------------------------------------------
# The notifications the platform actually raises
# ---------------------------------------------------------------------------


def _patient_recipients(patient) -> list:
    """Who to tell about this patient's own medicines.

    A dependent profile has no login, so its reminders go to the family member
    who manages it.
    """
    recipients = []
    if patient.user_id:
        recipients.append(patient.user)
    if patient.managed_by_id and patient.managed_by_id != patient.user_id:
        recipients.append(patient.managed_by)
    return recipients


def _caregivers_for(patient, *, needing_alerts: bool = True) -> list:
    """Caregivers with an active assignment who asked to be alerted."""
    from apps.accounts.models import CaregiverAssignment

    patient_user_ids = [uid for uid in (patient.user_id, patient.managed_by_id) if uid]
    assignments = CaregiverAssignment.objects.filter(
        patient_id__in=patient_user_ids, status=AssignmentStatus.ACTIVE
    ).select_related("caregiver")
    if needing_alerts:
        assignments = assignments.filter(can_receive_alerts=True)
    return [assignment.caregiver for assignment in assignments]


def notify_dose_due(dose) -> list[NotificationLog]:
    """The reminder itself."""
    medicine = dose.medicine
    instructions = f" ({medicine.instructions})" if medicine.instructions else ""
    body = f"Time to take {dose.quantity_expected:g} × {medicine.display_name}" f"{instructions}."

    logs: list[NotificationLog] = []
    for recipient in _patient_recipients(dose.patient):
        logs += send(
            recipient=recipient,
            category=NotificationCategory.DOSE_REMINDER,
            subject=f"{dose.get_slot_display()} medicine",
            body=body,
            payload={
                "type": "dose_reminder",
                "dose_event_id": str(dose.pk),
                "medicine_id": str(medicine.pk),
                "patient_id": str(dose.patient_id),
            },
            dose_event=dose,
        )

    if logs:
        dose.reminder_sent_at = timezone.now()
        dose.save(update_fields=["reminder_sent_at", "updated_at"])
    return logs


def notify_missed_dose(dose) -> list[NotificationLog]:
    """Tell the patient, and any caregiver who asked, about a missed dose."""
    medicine = dose.medicine
    when = timezone.localtime(dose.scheduled_for)
    logs: list[NotificationLog] = []

    for recipient in _patient_recipients(dose.patient):
        logs += send(
            recipient=recipient,
            category=NotificationCategory.DOSE_MISSED,
            subject="Missed dose",
            body=(f"The {when:%H:%M} dose of {medicine.display_name} was not recorded as taken."),
            payload={"type": "dose_missed", "dose_event_id": str(dose.pk)},
            dose_event=dose,
        )

    caregivers = _caregivers_for(dose.patient)
    for caregiver in caregivers:
        logs += send(
            recipient=caregiver,
            category=NotificationCategory.CAREGIVER_ALERT,
            subject=f"{dose.patient.full_name} missed a dose",
            body=(
                f"{dose.patient.full_name} did not take the {when:%H:%M} dose of "
                f"{medicine.display_name} on {when:%d %b}."
            ),
            payload={
                "type": "caregiver_alert",
                "dose_event_id": str(dose.pk),
                "patient_id": str(dose.patient_id),
            },
            dose_event=dose,
        )

    if caregivers:
        dose.caregiver_alerted_at = timezone.now()
        dose.save(update_fields=["caregiver_alerted_at", "updated_at"])
    return logs


def notify_low_stock(medicine) -> list[NotificationLog]:
    """Warn once per top-up that a medicine is running out.

    Guarded against repeating: every dose taken below the threshold would
    otherwise raise another alert, and a patient who is warned six times a day
    stops reading the warnings.
    """
    already_warned = NotificationLog.objects.filter(
        category=NotificationCategory.LOW_STOCK,
        payload__medicine_id=str(medicine.pk),
        created_at__gte=timezone.now() - timedelta(days=1),
    ).exists()
    if already_warned:
        return []

    remaining = f"{medicine.quantity_remaining:g}"
    body = (
        f"{medicine.display_name} is down to {remaining} left. "
        "Arrange a refill so you do not run out."
    )

    logs: list[NotificationLog] = []
    for recipient in _patient_recipients(medicine.patient):
        logs += send(
            recipient=recipient,
            category=NotificationCategory.LOW_STOCK,
            subject="Running low",
            body=body,
            payload={
                "type": "low_stock",
                "medicine_id": str(medicine.pk),
                "patient_id": str(medicine.patient_id),
            },
        )
    return logs


def notify_prescription_expiring(prescription, days_left: int) -> list[NotificationLog]:
    body = (
        f"The prescription from {prescription.doctor_name or 'your doctor'} expires in "
        f"{days_left} day{'s' if days_left != 1 else ''}. Renew it before it runs out."
    )
    logs: list[NotificationLog] = []
    for recipient in _patient_recipients(prescription.patient):
        logs += send(
            recipient=recipient,
            category=NotificationCategory.PRESCRIPTION_EXPIRY,
            subject="Prescription expiring",
            body=body,
            payload={"type": "prescription_expiry", "prescription_id": str(prescription.pk)},
        )
    if logs:
        prescription.expiry_reminded_at = timezone.now()
        prescription.save(update_fields=["expiry_reminded_at", "updated_at"])
    return logs
