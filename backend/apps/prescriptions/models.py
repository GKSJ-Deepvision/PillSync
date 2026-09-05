"""Prescription records.

Milestone 2 stores and tracks them; Milestone 3 adds the OCR pipeline that
fills these fields in from an uploaded photo instead of by hand.
"""

from __future__ import annotations

from datetime import date

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.choices import PrescriptionStatus
from apps.common.models import UUIDTimeStampedModel
from apps.common.validators import validate_not_future


def prescription_upload_path(instance: Prescription, filename: str) -> str:
    """Keep every patient's uploads in their own directory.

    Prescription images are medical records: a flat upload directory would let
    one guessed filename expose someone else's, and makes deleting a patient's
    data on request far harder than it needs to be.
    """
    return f"prescriptions/{instance.patient_id}/{filename}"


class Prescription(UUIDTimeStampedModel):
    patient = models.ForeignKey(
        "profiles.PatientProfile", on_delete=models.CASCADE, related_name="prescriptions"
    )
    doctor_name = models.CharField(max_length=150, blank=True)
    clinic_name = models.CharField(max_length=200, blank=True)
    reference_number = models.CharField(max_length=64, blank=True)

    issued_on = models.DateField(null=True, blank=True, validators=[validate_not_future])
    expires_on = models.DateField(
        null=True,
        blank=True,
        help_text="Repeat prescriptions run out; the patient is reminded before they do.",
    )

    image = models.ImageField(upload_to=prescription_upload_path, null=True, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=16, choices=PrescriptionStatus.choices, default=PrescriptionStatus.ACTIVE
    )

    # Set by the OCR pipeline in Milestone 3; untouched for a manual entry.
    ocr_extracted = models.BooleanField(default=False)
    ocr_confidence = models.FloatField(
        null=True,
        blank=True,
        help_text="0-1. Low confidence means a human should check the extracted fields.",
    )
    ocr_raw_text = models.TextField(blank=True)

    expiry_reminded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the expiry reminder went out, so it is not sent twice.",
    )

    class Meta:
        ordering = ("-issued_on", "-created_at")
        verbose_name = _("prescription")
        indexes = [
            models.Index(fields=["patient", "status"]),
            models.Index(fields=["expires_on"]),
        ]

    def __str__(self) -> str:
        who = self.doctor_name or "Unknown prescriber"
        when = self.issued_on.isoformat() if self.issued_on else "undated"
        return f"{who} — {when}"

    @property
    def is_expired(self) -> bool:
        return bool(self.expires_on and self.expires_on < timezone.localdate())

    def days_until_expiry(self, today: date | None = None) -> int | None:
        if not self.expires_on:
            return None
        return (self.expires_on - (today or timezone.localdate())).days

    def refresh_status(self) -> None:
        """Move an expired prescription out of ACTIVE.

        Archived prescriptions are left alone: a patient who filed one away
        should not see it reappear as "expired".
        """
        if self.status == PrescriptionStatus.ARCHIVED:
            return
        wanted = PrescriptionStatus.EXPIRED if self.is_expired else PrescriptionStatus.ACTIVE
        if self.status != wanted:
            self.status = wanted
            self.save(update_fields=["status", "updated_at"])
