from django.db import models
from apps.medications.models import Medication

class Reminder(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("taken", "Taken"),
        ("missed", "Missed"),
    )
    PERIOD_CHOICES = (
        ("Morning", "Morning"),
        ("Afternoon", "Afternoon"),
        ("Night", "Night"),
    )

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="reminders", null=True, blank=True)
    name = models.CharField(max_length=255)
    time = models.CharField(max_length=50, default="08:00 AM")
    period = models.CharField(max_length=50, choices=PERIOD_CHOICES, default="Morning")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    disease = models.CharField(max_length=100, default="General")
    scheduled_date = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.time} ({self.status})"
