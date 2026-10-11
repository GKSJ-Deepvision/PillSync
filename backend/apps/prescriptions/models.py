from django.db import models

from apps.profiles.models import PatientProfile


class Prescription(models.Model):
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )
    doctor_name = models.CharField(max_length=120)
    clinic_name = models.CharField(max_length=150, blank=True, default="")
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    file_url = models.CharField(max_length=500, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    ocr_status = models.CharField(max_length=30, default="PENDING")
    ocr_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rx {self.doctor_name} for {self.patient_profile.name} ({self.issue_date})"
