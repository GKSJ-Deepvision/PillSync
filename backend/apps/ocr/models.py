import uuid

from django.db import models


class PrescriptionScan(models.Model):
    """
    One uploaded prescription/medicine-label image and what OCR extracted from it.
    patient_id is a UUID, not a FK - it refers to the profiles.id row that lives in
    Supabase's Postgres, not a local Django user model.

    `result` holds the full multi-medicine scan result (one entry per medicine).
    The flat medicine_name/dosage/quantity/frequency columns mirror the FIRST medicine
    for backwards compatibility with earlier milestones.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField()
    image = models.ImageField(upload_to="prescription_scans/")

    source = models.CharField(max_length=20, blank=True, default="")  # "tesseract" | "vision"
    result = models.JSONField(blank=True, default=dict)

    raw_text = models.TextField(blank=True, default="")
    medicine_name = models.CharField(max_length=255, blank=True, default="")
    dosage = models.CharField(max_length=100, blank=True, default="")
    quantity = models.CharField(max_length=100, blank=True, default="")
    frequency = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        count = (self.result or {}).get("medicine_count", 0)
        return f"Scan {self.id} ({count} medicine{'s' if count != 1 else ''})"
