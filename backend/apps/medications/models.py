from django.db import models
from django.conf import settings


class Medication(models.Model):
    """
    Stores medication records either created manually or extracted via OCR.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='medications',
        null=True,
        blank=True,
        help_text="User/patient associated with this medication"
    )
    medicine_name = models.CharField(max_length=255, help_text="Generic or brand name of medication")
    dosage = models.CharField(max_length=100, blank=True, null=True, help_text="Strength (e.g. 500 mg, 10 mg)")
    quantity = models.CharField(max_length=100, blank=True, null=True, help_text="Pack count (e.g. 10 tablets)")
    frequency = models.CharField(max_length=100, blank=True, null=True, help_text="Schedule (e.g. Twice daily)")
    duration = models.CharField(max_length=100, blank=True, null=True, help_text="Length of therapy (e.g. 5 days)")
    prescription_details = models.TextField(blank=True, null=True, help_text="Clinical instructions (e.g. After food)")
    confidence = models.CharField(max_length=20, default='Medium', help_text="OCR extraction confidence")
    source = models.CharField(max_length=50, default='OCR', help_text="Source of entry (OCR or Manual)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medications'
        ordering = ['-created_at']
        verbose_name = 'Medication'
        verbose_name_plural = 'Medications'

    def __str__(self):
        return f"{self.medicine_name} {self.dosage or ''}".strip()
