from django.db import models

from apps.medicines.models import MedicineSchedule


class Reminder(models.Model):
    class Period(models.TextChoices):
        MORNING = "morning", "Morning"
        AFTERNOON = "afternoon", "Afternoon"
        NIGHT = "night", "Night"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SNOOZED = "snoozed", "Snoozed"

    schedule = models.ForeignKey(
        MedicineSchedule,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    scheduled_at = models.DateTimeField()
    period = models.CharField(
        max_length=20,
        choices=Period.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    snoozed_until = models.DateTimeField(
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["schedule", "scheduled_at"],
                name="unique_reminder_occurrence",
            ),
        ]

    def __str__(self):
        return f"{self.schedule.medicine.name} - {self.scheduled_at}"
