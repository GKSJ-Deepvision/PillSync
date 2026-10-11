from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = "PATIENT", "Patient"
        CAREGIVER = "CAREGIVER", "Caregiver"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def accessible_patient_profiles(self):
        """Return patient profiles accessible to this user based on role."""
        from apps.profiles.models import PatientProfile

        if not self.is_authenticated:
            return PatientProfile.objects.none()
        if self.is_superuser or self.role == self.Role.ADMIN or self.is_staff:
            return PatientProfile.objects.all()
        if self.role == self.Role.CAREGIVER:
            return PatientProfile.objects.filter(models.Q(user=self) | models.Q(caregiver=self))
        return self.patient_profiles.all()
