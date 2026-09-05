"""Enumerations shared across the platform.

Keeping these in one place stops the same concept being spelled three different
ways in three apps, and gives the frontend a single source for its dropdowns
(they are exposed through /api/v1/reference/enums/).
"""

from __future__ import annotations

from django.db import models


class UserRole(models.TextChoices):
    """The three roles the specification defines."""

    PATIENT = "PATIENT", "Patient"
    CAREGIVER = "CAREGIVER", "Caregiver"
    ADMIN = "ADMIN", "Admin"


class AuthProvider(models.TextChoices):
    LOCAL = "LOCAL", "Email and password"
    GOOGLE = "GOOGLE", "Google"


class MedicineCategory(models.TextChoices):
    """Disease-based medicine organisation, straight from the specification."""

    BLOOD_PRESSURE = "BLOOD_PRESSURE", "Blood Pressure"
    DIABETES = "DIABETES", "Diabetes"
    THYROID = "THYROID", "Thyroid"
    ANTIBIOTICS = "ANTIBIOTICS", "Antibiotics"
    VITAMINS = "VITAMINS", "Vitamins"
    HEART = "HEART", "Heart Medications"
    OTHER = "OTHER", "Other"


class Gender(models.TextChoices):
    FEMALE = "FEMALE", "Female"
    MALE = "MALE", "Male"
    OTHER = "OTHER", "Other"
    UNDISCLOSED = "UNDISCLOSED", "Prefer not to say"


class BloodGroup(models.TextChoices):
    A_POS = "A+", "A+"
    A_NEG = "A-", "A-"
    B_POS = "B+", "B+"
    B_NEG = "B-", "B-"
    AB_POS = "AB+", "AB+"
    AB_NEG = "AB-", "AB-"
    O_POS = "O+", "O+"
    O_NEG = "O-", "O-"
    UNKNOWN = "UNKNOWN", "Unknown"


class AssignmentStatus(models.TextChoices):
    """Lifecycle of a caregiver's access to a patient.

    A caregiver never gets access by asserting it: the patient (or an admin)
    moves the assignment to ACTIVE, and either side can REVOKE it later.
    """

    PENDING = "PENDING", "Pending patient approval"
    ACTIVE = "ACTIVE", "Active"
    REVOKED = "REVOKED", "Revoked"
    DECLINED = "DECLINED", "Declined"


class CaregiverRelationship(models.TextChoices):
    FAMILY = "FAMILY", "Family member"
    SPOUSE = "SPOUSE", "Spouse"
    PARENT = "PARENT", "Parent"
    CHILD = "CHILD", "Child"
    PROFESSIONAL = "PROFESSIONAL", "Professional caregiver"
    NURSE = "NURSE", "Nurse"
    DOCTOR = "DOCTOR", "Doctor"
    OTHER = "OTHER", "Other"


class ConditionSeverity(models.TextChoices):
    MILD = "MILD", "Mild"
    MODERATE = "MODERATE", "Moderate"
    SEVERE = "SEVERE", "Severe"
    UNKNOWN = "UNKNOWN", "Not assessed"
