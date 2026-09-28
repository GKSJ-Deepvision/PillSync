from django.db import models
from django.db.models import Q

from apps.medicines.models import MedicineSchedule
from apps.prescriptions.models import Prescription


class Reminder(models.Model):
    class Period(models.TextChoices):
        MORNING = "morning", "Morning"
        AFTERNOON = "afternoon", "Afternoon"
        NIGHT = "night", "Night"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        TAKEN = "taken", "Taken"
        MISSED = "missed", "Missed"
        SNOOZED = "snoozed", "Snoozed"

    schedule = models.ForeignKey(
        MedicineSchedule,
        on_delete=models.CASCADE,
        related_name="reminders",
        null=True,
        blank=True,
    )
    prescription = models.OneToOneField(
        Prescription,
        on_delete=models.CASCADE,
        related_name="expiry_reminder",
        null=True,
        blank=True,
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
            models.CheckConstraint(
                check=(
                    Q(schedule__isnull=False, prescription__isnull=True)
                    | Q(schedule__isnull=True, prescription__isnull=False)
                ),
                name="reminder_has_one_source",
            ),
        ]

    def __str__(self):
        if self.prescription_id:
            return f"Prescription expiry - {self.scheduled_at}"
        return f"{self.schedule.medicine.name} - {self.scheduled_at}"
