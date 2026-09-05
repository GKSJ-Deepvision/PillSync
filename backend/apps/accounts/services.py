"""Authentication services that are more than serializer glue."""

from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.choices import AuthProvider, UserRole

logger = logging.getLogger(__name__)
User = get_user_model()

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def issue_tokens(user) -> dict[str, str]:
    """Mint an access/refresh pair carrying the same claims as a normal login."""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["email"] = user.email
    refresh["full_name"] = user.full_name
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def verify_google_id_token(raw_token: str) -> dict:
    """Verify a Google ID token and return its claims.

    Verification happens against Google's public keys, and the audience is
    checked against our own client id - without that check any valid Google
    token, including one minted for a completely different application, would
    be accepted here.
    """
    client_id = settings.GOOGLE_OAUTH2_CLIENT_ID
    if not client_id:
        raise serializers.ValidationError(
            {"id_token": "Google sign-in is not configured on this server."}
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        claims = google_id_token.verify_oauth2_token(
            raw_token, google_requests.Request(), client_id
        )
    except ValueError as exc:
        logger.info("Rejected Google ID token: %s", exc)
        raise serializers.ValidationError(
            {"id_token": "This Google sign-in is not valid."}
        ) from exc

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise serializers.ValidationError({"id_token": "Unexpected token issuer."})
    if not claims.get("email"):
        raise serializers.ValidationError({"id_token": "Google did not return an email address."})
    if not claims.get("email_verified", False):
        raise serializers.ValidationError(
            {"id_token": "Verify your email address with Google before signing in."}
        )
    return claims


@transaction.atomic
def get_or_create_google_user(claims: dict, default_role: str = UserRole.PATIENT):
    """Find the account behind a verified Google identity, creating it if new.

    Returns (user, created).
    """
    from apps.profiles.models import CaregiverProfile, PatientProfile

    email = claims["email"].lower().strip()
    user = User.objects.filter(email__iexact=email).first()

    if user is not None:
        # An existing local account signing in with Google for the first time
        # keeps its password; we only record that Google now vouches for it.
        updates = []
        if not user.is_email_verified:
            user.is_email_verified = True
            updates.append("is_email_verified")
        if user.auth_provider == AuthProvider.LOCAL and not user.has_usable_password():
            user.auth_provider = AuthProvider.GOOGLE
            updates.append("auth_provider")
        if updates:
            user.save(update_fields=[*updates, "updated_at"])
        return user, False

    role = (
        default_role if default_role in {UserRole.PATIENT, UserRole.CAREGIVER} else UserRole.PATIENT
    )
    user = User.objects.create_user(
        email=email,
        password=None,
        full_name=claims.get("name") or email.split("@")[0],
        role=role,
        auth_provider=AuthProvider.GOOGLE,
        is_email_verified=True,
    )

    if role == UserRole.PATIENT:
        PatientProfile.objects.create(
            user=user, managed_by=user, full_name=user.full_name, is_self=True
        )
    else:
        CaregiverProfile.objects.create(user=user)

    return user, True


def send_password_reset_email(user, uid: str, token: str) -> None:
    """Email a reset link.

    In development EMAIL_BACKEND is the console backend, so the link is printed
    to the runserver output rather than sent anywhere.
    """
    link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
    send_mail(
        subject="Reset your PillSync password",
        message=(
            f"Hello {user.short_name},\n\n"
            "We received a request to reset your PillSync password. "
            f"Open this link to choose a new one:\n\n{link}\n\n"
            "If you did not ask for this, you can ignore this email - your "
            "password will not change.\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def client_ip(request) -> str | None:
    """Best-effort client IP, honouring a single proxy hop."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None
