from django.db import models

from apps.medications.models import MedicationSchedule


class ReminderStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SENT = "SENT", "Sent"
    TAKEN = "TAKEN", "Taken"
    MISSED = "MISSED", "Missed"
    CANCELLED = "CANCELLED", "Cancelled"


class Reminder(models.Model):
    schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    dose_datetime = models.DateTimeField(null=True, blank=True)
    reminder_datetime = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=16,
        choices=ReminderStatus.choices,
        default=ReminderStatus.PENDING,
        db_index=True,
    )

    message = models.CharField(max_length=255, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    taken_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["dose_datetime"]
        constraints = [
            models.UniqueConstraint(
                fields=["schedule", "dose_datetime"],
                name="uniq_reminder_per_schedule_dose",
            )
        ]
        indexes = [
            models.Index(fields=["dose_datetime", "status"]),
            models.Index(fields=["reminder_datetime", "status"]),
        ]

    def __str__(self):
        return f"{self.schedule.medicine.name} - " f"{self.dose_datetime:%Y-%m-%d %H:%M}"
