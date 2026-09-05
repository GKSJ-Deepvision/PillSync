"""Patient and caregiver profiles, conditions and emergency contacts."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.choices import (
    AssignmentStatus,
    BloodGroup,
    CaregiverRelationship,
    ConditionSeverity,
    Gender,
)
from apps.common.models import UUIDTimeStampedModel
from apps.common.validators import validate_not_future, validate_phone_number


class PatientProfile(UUIDTimeStampedModel):
    """The person the medication schedule belongs to.

    Deliberately separate from `User`, because the specification requires
    "multiple patient profiles for families": a parent tracking medicines for a
    child or an elderly relative needs a profile for someone who has no login of
    their own. So `user` is nullable, and `managed_by` records who is
    responsible for a profile that cannot manage itself.
    """

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="patient_profile",
        null=True,
        blank=True,
        help_text="The account this profile belongs to. Empty for a dependent "
        "family member who does not sign in.",
    )
    managed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="managed_patient_profiles",
        help_text="The account responsible for this profile. For a self profile "
        "this is the same user.",
    )
    full_name = models.CharField(max_length=150)
    relationship_to_manager = models.CharField(
        max_length=20,
        choices=CaregiverRelationship.choices,
        blank=True,
        help_text="How the managing account relates to this patient. Empty for a self profile.",
    )
    date_of_birth = models.DateField(null=True, blank=True, validators=[validate_not_future])
    gender = models.CharField(max_length=16, choices=Gender.choices, default=Gender.UNDISCLOSED)
    blood_group = models.CharField(
        max_length=8, choices=BloodGroup.choices, default=BloodGroup.UNKNOWN
    )
    height_cm = models.PositiveSmallIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    allergies = models.TextField(
        blank=True, help_text="Known drug and food allergies, one per line."
    )
    notes = models.TextField(blank=True)
    timezone_name = models.CharField(
        max_length=64,
        default="UTC",
        help_text="Reminders fire in the patient's own timezone, not the server's.",
    )
    preferred_reminder_channel = models.CharField(
        max_length=16,
        choices=[("PUSH", "Push"), ("EMAIL", "Email"), ("SMS", "SMS")],
        default="PUSH",
    )
    is_self = models.BooleanField(
        default=True, help_text="True when the managing user is the patient."
    )
    is_active = models.BooleanField(default=True)

    conditions = models.ManyToManyField(
        "common.MedicalCondition",
        through="profiles.PatientCondition",
        related_name="patients",
        blank=True,
    )

    class Meta:
        ordering = ("full_name",)
        verbose_name = _("patient profile")
        constraints = [
            models.UniqueConstraint(
                fields=["managed_by", "full_name"],
                name="uniq_profile_name_per_manager",
            )
        ]
        indexes = [
            models.Index(fields=["managed_by", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.full_name

    @property
    def age(self) -> int | None:
        if not self.date_of_birth:
            return None
        from django.utils import timezone

        today = timezone.localdate()
        born = self.date_of_birth
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

    def is_visible_to_caregiver(self, user) -> bool:
        """Whether `user` has an ACTIVE caregiver assignment to this patient.

        A dependent profile with no login of its own is reachable through the
        manager's assignments, which is how a nurse assigned to a parent can
        also see the profiles that parent manages.
        """
        from apps.accounts.models import CaregiverAssignment

        patient_ids = [self.managed_by_id]
        if self.user_id:
            patient_ids.append(self.user_id)

        return CaregiverAssignment.objects.filter(
            caregiver=user,
            patient_id__in=patient_ids,
            status=AssignmentStatus.ACTIVE,
        ).exists()


class CaregiverProfile(UUIDTimeStampedModel):
    """Extra detail for an account whose role is CAREGIVER."""

    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="caregiver_profile"
    )
    organisation = models.CharField(max_length=200, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=64, blank=True)
    years_of_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    is_professional = models.BooleanField(
        default=False, help_text="A nurse or clinician, as opposed to a family caregiver."
    )
    is_verified = models.BooleanField(
        default=False, help_text="An administrator has checked the credentials above."
    )

    class Meta:
        verbose_name = _("caregiver profile")

    def __str__(self) -> str:
        return f"Caregiver: {self.user.full_name}"


class EmergencyContact(UUIDTimeStampedModel):
    """Who to call when a critical dose is missed."""

    patient = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name="emergency_contacts"
    )
    name = models.CharField(max_length=150)
    relationship = models.CharField(
        max_length=20,
        choices=CaregiverRelationship.choices,
        default=CaregiverRelationship.FAMILY,
    )
    phone_number = models.CharField(max_length=32, validators=[validate_phone_number])
    email = models.EmailField(blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_primary", "name")
        verbose_name = _("emergency contact")
        constraints = [
            # At most one primary contact per patient, enforced in the database
            # rather than in a serializer that a second code path could bypass.
            models.UniqueConstraint(
                fields=["patient"],
                condition=models.Q(is_primary=True),
                name="uniq_primary_emergency_contact",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_relationship_display()})"


class PatientCondition(UUIDTimeStampedModel):
    """A condition a specific patient is being treated for.

    The link table behind disease-based medication organisation: once a patient
    is recorded as diabetic, the diabetes medicines are what the app surfaces
    first, and adherence is reported per condition.
    """

    patient = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name="patient_conditions"
    )
    condition = models.ForeignKey(
        "common.MedicalCondition", on_delete=models.PROTECT, related_name="patient_links"
    )
    diagnosed_on = models.DateField(null=True, blank=True, validators=[validate_not_future])
    severity = models.CharField(
        max_length=16, choices=ConditionSeverity.choices, default=ConditionSeverity.UNKNOWN
    )
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(
        default=True, help_text="Cleared infections stay on record but stop driving reminders."
    )

    class Meta:
        ordering = ("-is_active", "condition__name")
        verbose_name = _("patient condition")
        constraints = [
            models.UniqueConstraint(fields=["patient", "condition"], name="uniq_patient_condition")
        ]
        indexes = [models.Index(fields=["patient", "is_active"])]

    def __str__(self) -> str:
        return f"{self.patient.full_name}: {self.condition.name}"
