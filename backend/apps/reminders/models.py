from django.db import models

from apps.medications.models import MedicationSchedule
from apps.profiles.models import PatientProfile


class Reminder(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        TAKEN = "Taken", "Taken"
        MISSED = "Missed", "Missed"
        SNOOZED = "Snoozed", "Snoozed"

    schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.CASCADE,
        related_name="reminders",
        null=True,
        blank=True,
    )
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="reminders",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    snoozed_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.status}"
