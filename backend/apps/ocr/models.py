"""OCR jobs and the medicines extracted from them.

An `OCRJob` is one upload (or one pasted block of text) and everything that
happened to it. Extraction is never applied directly to a patient's medicines:
it produces `ExtractedMedicine` rows for the patient to review, edit and confirm.
OCR is right most of the time, and a wrong strength or a dropped dose on a
medication schedule is a clinical error, so a human always looks first.
"""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import UUIDTimeStampedModel


class JobKind(models.TextChoices):
    PRESCRIPTION = "PRESCRIPTION", "Prescription"
    MEDICINE_LABEL = "MEDICINE_LABEL", "Medicine box or strip"


class JobSource(models.TextChoices):
    IMAGE = "IMAGE", "Uploaded image"
    TEXT = "TEXT", "Typed or pasted text"


class JobStatus(models.TextChoices):
    QUEUED = "QUEUED", "Queued"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Ready to review"
    FAILED = "FAILED", "Failed"
    CONFIRMED = "CONFIRMED", "Added to medicines"
    REJECTED = "REJECTED", "Discarded"


class ItemStatus(models.TextChoices):
    PENDING = "PENDING", "To review"
    CONFIRMED = "CONFIRMED", "Added"
    REJECTED = "REJECTED", "Left out"


class MatchLevel(models.TextChoices):
    AUTO = "AUTO", "Matched"
    POSSIBLE = "POSSIBLE", "Possible match"
    NONE = "NONE", "No match"


def ocr_upload_path(instance: OCRJob, filename: str) -> str:
    """One directory per patient, for the same reason prescriptions have one:
    these are medical records, and deleting a patient's data must be a single
    directory removal, not a hunt through a flat folder."""
    return f"ocr/{instance.patient_id}/{filename}"


class OCRJob(UUIDTimeStampedModel):
    patient = models.ForeignKey(
        "profiles.PatientProfile", on_delete=models.CASCADE, related_name="ocr_jobs"
    )
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="ocr_jobs"
    )
    kind = models.CharField(max_length=16, choices=JobKind.choices, default=JobKind.PRESCRIPTION)
    source = models.CharField(max_length=8, choices=JobSource.choices, default=JobSource.IMAGE)
    image = models.ImageField(upload_to=ocr_upload_path, null=True, blank=True)

    status = models.CharField(
        max_length=12, choices=JobStatus.choices, default=JobStatus.QUEUED, db_index=True
    )
    engine = models.CharField(max_length=64, blank=True)
    raw_text = models.TextField(blank=True)
    ocr_confidence = models.FloatField(
        null=True, blank=True, help_text="Mean word confidence reported by the OCR engine, 0-1."
    )
    confidence = models.FloatField(
        null=True,
        blank=True,
        help_text="Overall confidence in the extraction, 0-1. Combines OCR quality with how "
        "complete and how well matched the extracted medicines are.",
    )
    header = models.JSONField(default=dict, blank=True)
    warnings = models.JSONField(default=list, blank=True)
    error = models.TextField(blank=True)
    processing_ms = models.PositiveIntegerField(null=True, blank=True)

    prescription = models.ForeignKey(
        "prescriptions.Prescription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ocr_jobs",
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("OCR job")
        indexes = [models.Index(fields=["patient", "status"])]

    def __str__(self) -> str:
        return f"{self.get_kind_display()} for {self.patient.full_name} ({self.status})"


class ExtractedMedicine(UUIDTimeStampedModel):
    job = models.ForeignKey(OCRJob, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveSmallIntegerField(default=0)
    raw_line = models.TextField(blank=True)

    name = models.CharField(max_length=255)
    form = models.CharField(max_length=64, blank=True)
    strength = models.CharField(max_length=64, blank=True)
    strength_unit = models.CharField(max_length=64, blank=True)

    # [{"slot": "MORNING", "quantity": "1"}, ...] - a quantity per slot, because
    # "2-0-1" is two in the morning and one at night, not three a day.
    slots = models.JSONField(default=list, blank=True)
    frequency = models.CharField(max_length=16, default="DAILY")
    interval_days = models.PositiveSmallIntegerField(default=1)
    days_of_week = models.JSONField(default=list, blank=True)
    as_needed = models.BooleanField(default=False)
    duration_days = models.PositiveSmallIntegerField(null=True, blank=True)
    total_quantity = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    instructions = models.CharField(max_length=255, blank=True)

    reference = models.ForeignKey(
        "common.MedicineReference",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ocr_items",
        help_text="Set only for a confident match, or once the patient picks one.",
    )
    match_level = models.CharField(
        max_length=8, choices=MatchLevel.choices, default=MatchLevel.NONE
    )
    match_score = models.FloatField(default=0.0)
    suggestions = models.JSONField(
        default=list,
        blank=True,
        help_text="Catalogue candidates the patient can choose between: "
        "[{id, label, category, score}].",
    )

    confidence = models.FloatField(default=0.0)
    reasons = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=10, choices=ItemStatus.choices, default=ItemStatus.PENDING)
    medicine = models.ForeignKey(
        "medications.Medicine",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ocr_items",
    )

    class Meta:
        ordering = ("job", "position")
        verbose_name = _("extracted medicine")

    def __str__(self) -> str:
        return f"{self.name} {self.strength}{self.strength_unit}".strip()

    @property
    def patient(self):
        """Lets the shared object permission find the profile this belongs to."""
        return self.job.patient
