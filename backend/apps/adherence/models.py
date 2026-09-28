from django.db import models

from apps.medications.models import Medication
from apps.reminders.models import Reminder


class AdherenceLog(models.Model):
    STATUS_CHOICES = (
        ("taken", "Taken"),
        ("missed", "Missed"),
        ("snoozed", "Snoozed"),
    )

    PERIOD_CHOICES = (
        ("Morning", "Morning"),
        ("Afternoon", "Afternoon"),
        ("Night", "Night"),
    )

    medication = models.ForeignKey(
        Medication, on_delete=models.CASCADE, related_name="adherence_logs"
    )
    reminder = models.ForeignKey(
        Reminder, on_delete=models.SET_NULL, null=True, blank=True, related_name="adherence_logs"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="taken")
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default="Morning")
    scheduled_time = models.CharField(max_length=50, default="08:00 AM")
    logged_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return (
            f"{self.medication.name} - {self.status} on {self.logged_at.strftime('%Y-%m-%d %H:%M')}"
        )
