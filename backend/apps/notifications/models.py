from django.db import models

from apps.profiles.models import PatientProfile


class Notification(models.Model):
    class Type(models.TextChoices):
        REMINDER = "Reminder", "Reminder"
        REFILL = "Refill", "Refill Alert"
        MISSED_DOSE = "MissedDose", "Missed Dose Alert"
        CAREGIVER_ALERT = "CaregiverAlert", "Caregiver Alert"

    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=Type.choices, default=Type.REMINDER)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification: {self.title} ({self.notification_type})"
