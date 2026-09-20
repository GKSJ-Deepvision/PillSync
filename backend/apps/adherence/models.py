from django.core.exceptions import ValidationError
from django.db import models


class DoseEventStatus(models.TextChoices):
    TAKEN = "TAKEN", "Taken"
    MISSED = "MISSED", "Missed"
    SNOOZED = "SNOOZED", "Snoozed"


class DoseEvent(models.Model):
    schedule = models.ForeignKey(
        "medications.MedicationSchedule",
        on_delete=models.CASCADE,
        related_name="dose_events",
    )
    dose_date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=DoseEventStatus.choices,
        db_index=True,
    )
    taken_at = models.DateTimeField(blank=True, null=True)
    snoozed_at = models.DateTimeField(blank=True, null=True)
    snoozed_until = models.DateTimeField(blank=True, null=True)
    missed_at = models.DateTimeField(blank=True, null=True)
    note = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-dose_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["schedule", "dose_date"],
                name="unique_dose_event_per_schedule_date",
            )
        ]
        indexes = [
            models.Index(
                fields=["dose_date", "status"],
                name="dose_event_date_status_idx",
            ),
            models.Index(
                fields=["schedule", "dose_date"],
                name="dose_event_schedule_date_idx",
            ),
        ]

    def clean(self):
        if self.status == DoseEventStatus.TAKEN and not self.taken_at:
            raise ValidationError({"taken_at": "Taken doses must have a taken timestamp."})

        if self.status == DoseEventStatus.SNOOZED:
            if not self.snoozed_at:
                raise ValidationError(
                    {"snoozed_at": "Snoozed doses must have a snoozed timestamp."}
                )
            if not self.snoozed_until:
                raise ValidationError(
                    {"snoozed_until": ("Snoozed doses must have a snoozed-until timestamp.")}
                )

        if self.status == DoseEventStatus.MISSED and not self.missed_at:
            raise ValidationError({"missed_at": "Missed doses must have a missed timestamp."})

    def __str__(self):
        return (
            f"{self.schedule.dosage.medicine.medicine_name} - " f"{self.dose_date} - {self.status}"
        )
