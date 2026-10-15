from django.contrib.auth.models import User
from django.db import models


class CaregiverPatientAssignment(models.Model):
    """
    Records which caregiver is assigned to which patient.
    A caregiver can be assigned to multiple patients.
    A patient can have multiple caregivers.
    """

    caregiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assigned_patients_links",
        help_text="The caregiver user.",
    )
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assigned_caregivers_links",
        help_text="The patient user.",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("caregiver", "patient")
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.caregiver.get_full_name() or self.caregiver.username} → {self.patient.get_full_name() or self.patient.username}"
