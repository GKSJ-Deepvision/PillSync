from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        CAREGIVER = "caregiver", "Caregiver"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    phone_number = models.CharField(max_length=30, blank=True)
    avatar = models.URLField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.name or self.username} ({self.email}) - {self.role}"

    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT

    @property
    def is_caregiver(self):
        return self.role == self.Role.CAREGIVER

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser
