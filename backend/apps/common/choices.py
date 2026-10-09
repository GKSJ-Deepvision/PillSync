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


class DoseSlot(models.TextChoices):
    """The parts of the day the specification groups reminders into."""

    MORNING = "MORNING", "Morning"
    AFTERNOON = "AFTERNOON", "Afternoon"
    EVENING = "EVENING", "Evening"
    NIGHT = "NIGHT", "Night"


class ScheduleFrequency(models.TextChoices):
    DAILY = "DAILY", "Every day"
    SPECIFIC_DAYS = "SPECIFIC_DAYS", "On chosen days"
    INTERVAL = "INTERVAL", "Every N days"


class Weekday(models.IntegerChoices):
    """ISO weekday numbers, so `date.isoweekday()` can be compared directly."""

    MONDAY = 1, "Monday"
    TUESDAY = 2, "Tuesday"
    WEDNESDAY = 3, "Wednesday"
    THURSDAY = 4, "Thursday"
    FRIDAY = 5, "Friday"
    SATURDAY = 6, "Saturday"
    SUNDAY = 7, "Sunday"


class DoseStatus(models.TextChoices):
    """Lifecycle of a single scheduled dose - the medication history record."""

    PENDING = "PENDING", "Due"
    TAKEN = "TAKEN", "Taken"
    MISSED = "MISSED", "Missed"
    SNOOZED = "SNOOZED", "Snoozed"
    SKIPPED = "SKIPPED", "Skipped on purpose"


class PrescriptionStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    EXPIRED = "EXPIRED", "Expired"
    ARCHIVED = "ARCHIVED", "Archived"


class NotificationChannel(models.TextChoices):
    PUSH = "PUSH", "Push notification"
    EMAIL = "EMAIL", "Email"
    SMS = "SMS", "SMS"


class NotificationCategory(models.TextChoices):
    """What a notification is about. Drives templates and per-category opt-out."""

    DOSE_REMINDER = "DOSE_REMINDER", "Medicine reminder"
    DOSE_MISSED = "DOSE_MISSED", "Missed dose"
    CAREGIVER_ALERT = "CAREGIVER_ALERT", "Caregiver alert"
    LOW_STOCK = "LOW_STOCK", "Low stock"
    REFILL_DUE = "REFILL_DUE", "Refill due"
    PRESCRIPTION_EXPIRY = "PRESCRIPTION_EXPIRY", "Prescription expiring"


class NotificationStatus(models.TextChoices):
    QUEUED = "QUEUED", "Queued"
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"
    SKIPPED = "SKIPPED", "Skipped"


class DevicePlatform(models.TextChoices):
    WEB = "WEB", "Web"
    ANDROID = "ANDROID", "Android"
    IOS = "IOS", "iOS"
