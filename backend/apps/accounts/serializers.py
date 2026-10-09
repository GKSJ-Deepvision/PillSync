"""Serializers for registration, login, tokens, passwords and caregiver links."""

from __future__ import annotations

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.common.choices import AssignmentStatus, UserRole

from .models import CaregiverAssignment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """The authenticated user as the frontend sees them."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone_number",
            "role",
            "role_display",
            "auth_provider",
            "is_email_verified",
            "is_active",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "email",
            "role",
            "auth_provider",
            "is_email_verified",
            "is_active",
            "date_joined",
        )


class RegisterSerializer(serializers.ModelSerializer):
    """Create an account.

    A patient registration also creates the patient's own profile, so a new user
    lands on a usable app rather than an empty one.
    """

    password = serializers.CharField(
        write_only=True, min_length=10, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})
    role = serializers.ChoiceField(
        choices=[(UserRole.PATIENT, "Patient"), (UserRole.CAREGIVER, "Caregiver")],
        default=UserRole.PATIENT,
        help_text="Admin accounts are created by an administrator, never by self-registration.",
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone_number",
            "role",
            "password",
            "password_confirm",
        )
        read_only_fields = ("id",)

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "The two passwords do not match."}
            )
        # Run Django's validators with the user's own details in hand, so a
        # password that is just their name or email is rejected.
        candidate = User(
            email=attrs.get("email", ""),
            full_name=attrs.get("full_name", ""),
        )
        validate_password(attrs["password"], user=candidate)
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict):
        from apps.profiles.models import CaregiverProfile, PatientProfile

        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)

        if user.role == UserRole.PATIENT:
            PatientProfile.objects.create(
                user=user,
                managed_by=user,
                full_name=user.full_name,
                is_self=True,
            )
        elif user.role == UserRole.CAREGIVER:
            CaregiverProfile.objects.create(user=user)

        return user


class PillSyncTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login. Adds the role to the token and the user object to the response.

    Without this the frontend would have to make a second request just to find
    out who logged in and what they are allowed to see.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LoginSerializer(serializers.Serializer):
    """Used only for schema generation and explicit credential checks."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower().strip(),
            password=attrs["password"],
        )
        if user is None:
            # One message for both cases on purpose: saying "no such account"
            # would let anyone test which email addresses are registered.
            raise serializers.ValidationError("Incorrect email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        attrs["user"] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    """The refresh token to blacklist."""

    refresh = serializers.CharField(write_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    """Exchange a Google ID token for PillSync tokens."""

    id_token = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[(UserRole.PATIENT, "Patient"), (UserRole.CAREGIVER, "Caregiver")],
        default=UserRole.PATIENT,
        required=False,
        help_text="Only used when this is the first sign-in and the account is created.",
    )


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(
        write_only=True, min_length=10, style={"input_type": "password"}
    )
    new_password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Your current password is not correct.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "The two passwords do not match."}
            )
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError(
                {"new_password": "The new password must differ from the current one."}
            )
        validate_password(attrs["new_password"], user=self.context["request"].user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def get_user(self):
        return User.objects.filter(
            email__iexact=self.validated_data["email"].strip(), is_active=True
        ).first()

    @staticmethod
    def build_token(user) -> tuple[str, str]:
        return (
            urlsafe_base64_encode(force_bytes(user.pk)),
            default_token_generator.make_token(user),
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True, min_length=10, style={"input_type": "password"}
    )
    new_password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "The two passwords do not match."}
            )

        try:
            uid = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError(
                {"uid": "This password reset link is not valid."}
            ) from None

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "This password reset link has expired or has already been used."}
            )

        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        return user


class CaregiverAssignmentSerializer(serializers.ModelSerializer):
    caregiver_name = serializers.CharField(source="caregiver.full_name", read_only=True)
    caregiver_email = serializers.EmailField(source="caregiver.email", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_email = serializers.EmailField(source="patient.email", read_only=True)

    class Meta:
        model = CaregiverAssignment
        fields = (
            "id",
            "caregiver",
            "caregiver_name",
            "caregiver_email",
            "patient",
            "patient_name",
            "patient_email",
            "relationship",
            "status",
            "can_view_adherence",
            "can_receive_alerts",
            "can_manage_medications",
            "responded_at",
            "notes",
            "created_at",
        )
        read_only_fields = ("id", "status", "responded_at", "created_at")


class CaregiverInviteSerializer(serializers.Serializer):
    """A patient invites a caregiver by email.

    Addressing the caregiver by email rather than id means the patient does not
    need to look up an internal identifier, and cannot enumerate accounts by
    trying ids.
    """

    caregiver_email = serializers.EmailField()
    relationship = serializers.ChoiceField(
        choices=CaregiverAssignment._meta.get_field("relationship").choices,
        default="FAMILY",
    )
    can_view_adherence = serializers.BooleanField(default=True)
    can_receive_alerts = serializers.BooleanField(default=True)
    can_manage_medications = serializers.BooleanField(default=False)
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_caregiver_email(self, value: str):
        caregiver = User.objects.filter(email__iexact=value.strip(), is_active=True).first()
        if caregiver is None:
            raise serializers.ValidationError(
                "No active account with that email. Ask them to register as a caregiver first."
            )
        if caregiver.role != UserRole.CAREGIVER:
            raise serializers.ValidationError("That account is not registered as a caregiver.")

        patient = self.context["request"].user
        if caregiver == patient:
            raise serializers.ValidationError("You cannot assign yourself as your own caregiver.")
        if (
            CaregiverAssignment.objects.filter(caregiver=caregiver, patient=patient)
            .exclude(status__in=[AssignmentStatus.REVOKED, AssignmentStatus.DECLINED])
            .exists()
        ):
            raise serializers.ValidationError(
                "That caregiver already has a pending or active link."
            )

        self.context["caregiver"] = caregiver
        return value

    def create(self, validated_data: dict) -> CaregiverAssignment:
        patient = self.context["request"].user
        validated_data.pop("caregiver_email")
        return CaregiverAssignment.objects.create(
            caregiver=self.context["caregiver"],
            patient=patient,
            invited_by=patient,
            status=AssignmentStatus.PENDING,
            **validated_data,
        )


class AdminUserSerializer(serializers.ModelSerializer):
    """Full user record, for administrators only."""

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone_number",
            "role",
            "auth_provider",
            "is_email_verified",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "created_at",
        )
        read_only_fields = ("id", "auth_provider", "date_joined", "last_login", "created_at")
