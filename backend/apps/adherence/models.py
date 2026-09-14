from django.db import models

from apps.medications.models import Medication, MedicationSchedule


class DoseEvent(models.Model):
    class Status(models.TextChoices):
        TAKEN = "taken", "Taken"
        MISSED = "missed", "Missed"
        SNOOZED = "snoozed", "Snoozed"

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="dose_events")
    schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.SET_NULL,
        related_name="dose_events",
        null=True,
        blank=True,
    )
    scheduled_for = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices)
    recorded_at = models.DateTimeField(auto_now_add=True)
    acted_at = models.DateTimeField(null=True, blank=True)
    snoozed_until = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-scheduled_for", "-id"]
        indexes = [
            models.Index(fields=["medication", "scheduled_for"]),
            models.Index(fields=["status", "scheduled_for"]),
        ]

    def __str__(self):
        return f"{self.medication.name} at {self.scheduled_for} ({self.status})"
