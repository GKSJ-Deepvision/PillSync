from django.db import models

from apps.profiles.models import PatientProfile


class Prescription(models.Model):
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )
    doctor_name = models.CharField(max_length=255)
    clinic_name = models.CharField(max_length=255, blank=True)
    diagnosis = models.CharField(max_length=255, blank=True)
    issue_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    document_url = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issue_date", "-created_at"]

    def __str__(self):
        return f"Prescription for {self.patient} by Dr. {self.doctor_name} ({self.issue_date})"
