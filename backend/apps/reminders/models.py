from django.db import models

from apps.medications.models import MedicationSchedule


class Reminder(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        TAKEN = "TAKEN", "Taken"
        MISSED = "MISSED", "Missed"
        SNOOZED = "SNOOZED", "Snoozed"

    schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.CASCADE,
        related_name="reminders",
    )

    reminder_date = models.DateField()
    scheduled_time = models.TimeField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default="PENDING",
    )

    snoozed_until = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.schedule.dosage.medicine.name} - "
            f"{self.reminder_date} - "
            f"{self.scheduled_time} - "
            f"{self.status}"
        )