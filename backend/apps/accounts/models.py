"""User identity and caregiver access control."""

from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.choices import AssignmentStatus, AuthProvider, CaregiverRelationship, UserRole
from apps.common.models import UUIDTimeStampedModel
from apps.common.validators import validate_phone_number


class UserManager(BaseUserManager):
    """Manager for a user model keyed on email rather than a username."""

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        else:
            # Social sign-in users have no local password; an unusable one keeps
            # them from being logged in with an empty string.
            user.set_unusable_password()
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("role", UserRole.PATIENT)
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str, **extra):
        extra.setdefault("role", UserRole.ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_email_verified", True)

        if extra["is_staff"] is not True:
            raise ValueError("A superuser must have is_staff=True.")
        if extra["is_superuser"] is not True:
            raise ValueError("A superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, UUIDTimeStampedModel):
    """A person who signs in to PillSync.

    One model for all three roles rather than three models: a caregiver is very
    often also a patient (an adult child managing their own medicines and their
    parent's), and splitting them would force that person to hold two accounts.
    """

    email = models.EmailField(_("email address"), unique=True, db_index=True)
    full_name = models.CharField(_("full name"), max_length=150)
    phone_number = models.CharField(max_length=32, blank=True, validators=[validate_phone_number])
    role = models.CharField(
        max_length=16,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        db_index=True,
    )
    auth_provider = models.CharField(
        max_length=16, choices=AuthProvider.choices, default=AuthProvider.LOCAL
    )
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(
        default=True,
        help_text="Deactivate instead of deleting: medication history must survive.",
    )
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ("-date_joined",)
        verbose_name = _("user")
        verbose_name_plural = _("users")
        indexes = [models.Index(fields=["role", "is_active"])]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    def clean(self) -> None:
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email).lower()

    def save(self, *args, **kwargs):
        self.email = self.email.lower().strip()
        return super().save(*args, **kwargs)

    # -- Convenience ------------------------------------------------------

    @property
    def is_admin(self) -> bool:
        """Platform administrator, by role or by Django superuser flag."""
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_caregiver(self) -> bool:
        return self.role == UserRole.CAREGIVER

    @property
    def is_patient(self) -> bool:
        return self.role == UserRole.PATIENT

    @property
    def short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else self.email

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.short_name

    def accessible_patient_profiles(self):
        """Every patient profile this user may read.

        One query the whole platform can rely on: own profile, family profiles
        they manage, and patients who have an active caregiver assignment to
        them. Admins get everything.
        """
        from apps.profiles.models import PatientProfile

        if self.is_admin:
            return PatientProfile.objects.all()

        return PatientProfile.objects.filter(
            models.Q(user=self)
            | models.Q(managed_by=self)
            | models.Q(
                user__caregiver_assignments__caregiver=self,
                user__caregiver_assignments__status=AssignmentStatus.ACTIVE,
            )
        ).distinct()


class CaregiverAssignment(UUIDTimeStampedModel):
    """A caregiver's authorised link to a patient.

    Access is granted by the patient, not claimed by the caregiver: an
    assignment starts PENDING and only an ACTIVE one confers any read access.
    The three permission flags let a patient share adherence data without also
    handing over the ability to change their medication.
    """

    caregiver = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="patient_assignments",
        limit_choices_to={"role": UserRole.CAREGIVER},
    )
    patient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="caregiver_assignments",
    )
    relationship = models.CharField(
        max_length=20,
        choices=CaregiverRelationship.choices,
        default=CaregiverRelationship.FAMILY,
    )
    status = models.CharField(
        max_length=16,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PENDING,
        db_index=True,
    )
    can_view_adherence = models.BooleanField(default=True)
    can_receive_alerts = models.BooleanField(default=True)
    can_manage_medications = models.BooleanField(
        default=False,
        help_text="Off by default: viewing a medication schedule and changing it "
        "are very different levels of trust.",
    )
    invited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="caregiver_invitations_sent",
    )
    responded_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "caregiver assignment"
        constraints = [
            models.UniqueConstraint(fields=["caregiver", "patient"], name="uniq_caregiver_patient"),
            models.CheckConstraint(
                condition=~models.Q(caregiver=models.F("patient")),
                name="caregiver_is_not_patient",
            ),
        ]
        indexes = [models.Index(fields=["patient", "status"])]

    def __str__(self) -> str:
        return f"{self.caregiver.full_name} -> {self.patient.full_name} ({self.status})"

    @property
    def is_active(self) -> bool:
        return self.status == AssignmentStatus.ACTIVE

    def activate(self) -> None:
        self.status = AssignmentStatus.ACTIVE
        self.responded_at = timezone.now()
        self.save(update_fields=["status", "responded_at", "updated_at"])

    def revoke(self) -> None:
        self.status = AssignmentStatus.REVOKED
        self.responded_at = timezone.now()
        self.save(update_fields=["status", "responded_at", "updated_at"])

    def decline(self) -> None:
        self.status = AssignmentStatus.DECLINED
        self.responded_at = timezone.now()
        self.save(update_fields=["status", "responded_at", "updated_at"])
