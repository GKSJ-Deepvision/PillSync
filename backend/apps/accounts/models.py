from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        CAREGIVER = "caregiver", "Caregiver"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
    )

    def __str__(self):
        return self.username


class CaregiverPatientRelationship(models.Model):
    caregiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_relationships",
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="caregiver_relationships",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["caregiver", "patient"],
                name="unique_caregiver_patient_relationship",
            ),
            models.CheckConstraint(
                check=~models.Q(caregiver=models.F("patient")),
                name="caregiver_patient_not_self",
            ),
        ]
        ordering = ["-created_at", "-id"]

    def clean(self):
        errors = {}
        if self.caregiver_id == self.patient_id:
            errors["patient"] = "A user cannot be their own caregiver."
        if self.caregiver_id and self.caregiver.role != User.Role.CAREGIVER:
            errors["caregiver"] = "The caregiver must have the caregiver role."
        if self.patient_id and self.patient.role != User.Role.PATIENT:
            errors["patient"] = "The patient must have the patient role."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.caregiver.username} -> {self.patient.username}"
