from django.db import models

from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile


class AdherenceLog(models.Model):
    class Status(models.TextChoices):
        TAKEN = "Taken", "Taken"
        MISSED = "Missed", "Missed"
        SNOOZED = "Snoozed", "Snoozed"

    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="adherence_logs",
        null=True,
        blank=True,
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.SET_NULL,
        related_name="adherence_logs",
        null=True,
        blank=True,
    )
    medicine_name = models.CharField(max_length=150)
    dosage = models.CharField(max_length=50, default="1 Tablet")
    schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.SET_NULL,
        related_name="adherence_logs",
        null=True,
        blank=True,
    )
    action_date = models.DateField()
    action_time = models.CharField(max_length=20, default="08:00 AM")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TAKEN)
    notes = models.TextField(blank=True, default="")
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-action_date", "-logged_at"]

    def __str__(self):
        return f"{self.medicine_name} - {self.status} on {self.action_date}"
