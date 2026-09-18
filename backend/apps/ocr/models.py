from django.conf import settings
from django.db import models


class OCRRecord(models.Model):
    class UploadType(models.TextChoices):
        MEDICINE_IMAGE = "medicine_image", "Medicine Image"
        PRESCRIPTION = "prescription", "Prescription"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ocr_records",
    )
    file = models.FileField(upload_to="ocr/")
    upload_type = models.CharField(
        max_length=30,
        choices=UploadType.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    extracted_text = models.TextField(blank=True)
    confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.upload_type} - {self.status}"
