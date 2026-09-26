from django.db import models

from apps.profiles.models import PatientProfile


class OCRExtractionLog(models.Model):
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="ocr_logs",
        null=True,
        blank=True,
    )
    image_url = models.CharField(max_length=255, blank=True, default="")
    extracted_text = models.TextField(blank=True, default="")
    parsed_medicine_name = models.CharField(max_length=150, blank=True, default="")
    parsed_dosage = models.CharField(max_length=50, blank=True, default="")
    parsed_quantity = models.IntegerField(default=30)
    parsed_frequency = models.CharField(max_length=50, blank=True, default="")
    confidence = models.FloatField(default=0.9)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OCR: {self.parsed_medicine_name} ({self.confidence * 100}%)"
