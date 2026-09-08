from django.conf import settings
from django.db import models


class PatientProfile(models.Model):
    class Relationship(models.TextChoices):
        SELF = "Self", "Self"
        SPOUSE = "Spouse", "Spouse"
        CHILD = "Child", "Child"
        PARENT = "Parent", "Parent / Elderly"
        SIBLING = "Sibling", "Sibling"
        OTHER = "Other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profiles",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    relationship = models.CharField(
        max_length=50,
        choices=Relationship.choices,
        default=Relationship.SELF,
    )
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, default="Unspecified")
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, default="")
    allergies = models.TextField(blank=True, default="")
    emergency_contact_name = models.CharField(max_length=100, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default="")
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.relationship})"
