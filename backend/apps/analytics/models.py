from django.db import models

from apps.profiles.models import PatientProfile


class AdherenceAnalyticsReport(models.Model):
    class Period(models.TextChoices):
        DAILY = "Daily", "Daily"
        WEEKLY = "Weekly", "Weekly"
        MONTHLY = "Monthly", "Monthly"

    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="analytics_reports",
        null=True,
        blank=True,
    )
    period = models.CharField(max_length=20, choices=Period.choices, default=Period.WEEKLY)
    taken_doses = models.IntegerField(default=0)
    missed_doses = models.IntegerField(default=0)
    snoozed_doses = models.IntegerField(default=0)
    adherence_percentage = models.FloatField(default=0.0)
    consistency_score = models.FloatField(default=100.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.period} - {self.adherence_percentage}% ({self.patient_profile})"
