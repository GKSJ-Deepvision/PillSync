"""Fixtures shared by every backend test.

Lives at the backend root so pytest picks it up for `tests/` and for the
per-app `apps/<app>/tests/` packages alike.
"""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import CaregiverAssignment
from apps.common.choices import AssignmentStatus, UserRole
from apps.common.models import MedicalCondition, MedicineReference
from apps.profiles.models import CaregiverProfile, PatientProfile

User = get_user_model()

STRONG_PASSWORD = "correct-horse-battery-42"  # pragma: allowlist secret


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def make_user(db):
    """Create a user of any role, with the profile that role implies."""

    def _make(
        email: str,
        role: str = UserRole.PATIENT,
        password: str = STRONG_PASSWORD,
        full_name: str | None = None,
        **extra,
    ):
        user = User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name or email.split("@")[0].replace(".", " ").title(),
            role=role,
            **extra,
        )
        if role == UserRole.PATIENT:
            PatientProfile.objects.create(
                user=user, managed_by=user, full_name=user.full_name, is_self=True
            )
        elif role == UserRole.CAREGIVER:
            CaregiverProfile.objects.create(user=user)
        return user

    return _make


@pytest.fixture
def patient(make_user):
    return make_user("asha.patient@example.com", UserRole.PATIENT, full_name="Asha Patient")


@pytest.fixture
def other_patient(make_user):
    return make_user("ravi.patient@example.com", UserRole.PATIENT, full_name="Ravi Patient")


@pytest.fixture
def caregiver(make_user):
    return make_user("nina.caregiver@example.com", UserRole.CAREGIVER, full_name="Nina Caregiver")


@pytest.fixture
def admin_user(make_user):
    return make_user("admin@example.com", UserRole.ADMIN, full_name="Platform Admin", is_staff=True)


@pytest.fixture
def auth_client(api_client):
    """Return a client authenticated as whichever user you pass in."""

    def _auth(user) -> APIClient:
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    return _auth


@pytest.fixture
def patient_client(auth_client, patient) -> APIClient:
    return auth_client(patient)


@pytest.fixture
def caregiver_client(auth_client, caregiver) -> APIClient:
    return auth_client(caregiver)


@pytest.fixture
def admin_client(auth_client, admin_user) -> APIClient:
    return auth_client(admin_user)


@pytest.fixture
def active_assignment(patient, caregiver) -> CaregiverAssignment:
    """A caregiver who has been granted access to `patient`."""
    return CaregiverAssignment.objects.create(
        caregiver=caregiver,
        patient=patient,
        status=AssignmentStatus.ACTIVE,
        invited_by=patient,
    )


@pytest.fixture
def condition(db) -> MedicalCondition:
    return MedicalCondition.objects.create(
        code="TYPE_2_DIABETES",
        name="Type 2 Diabetes",
        category="DIABETES",
        is_chronic=True,
    )


@pytest.fixture
def medicine(db) -> MedicineReference:
    return MedicineReference.objects.create(
        product_ndc="0093-1074",
        generic_name="Metformin Hydrochloride",
        brand_name="Glucophage",
        dosage_form="Tablet, Film Coated",
        route="Oral",
        strength="500",
        strength_unit="mg/1",
        category="DIABETES",
        pharm_class="Biguanide [EPC]",
        requires_prescription=True,
    )


@pytest.fixture(autouse=True)
def _reset_throttle_cache():
    """Clear rate-limit counters between tests.

    DRF keeps throttle counters in the default cache, which lives for the whole
    pytest process. Without this, the tenth login attempt in a run trips the
    limiter and an unrelated test fails.
    """
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()
