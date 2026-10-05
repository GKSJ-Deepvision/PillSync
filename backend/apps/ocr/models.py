from django.db import models
from django.conf import settings


class PrescriptionUpload(models.Model):
    """
    Tracks prescription image uploads, raw OCR text, processing status, and extracted data.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prescription_uploads',
        null=True,
        blank=True
    )
    image = models.ImageField(upload_to='prescriptions/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255, blank=True)
    raw_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confidence = models.FloatField(default=0.0)
    confidence_level = models.CharField(max_length=20, default='Medium')
    extracted_data = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescription_uploads'
        ordering = ['-created_at']
        verbose_name = 'Prescription Upload'
        verbose_name_plural = 'Prescription Uploads'

    def __str__(self):
        return f"Prescription #{self.id} ({self.status}) - {self.original_filename or 'No Name'}"
