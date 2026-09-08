import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    dummy_password = "dummy_test_password_123"  # pragma: allowlist secret
    user = User.objects.create_user(
        username="testpatient",
        email="patient@pillsync.local",
        password=dummy_password,
        role=User.Role.PATIENT,
    )
    assert user.username == "testpatient"
    assert user.role == "PATIENT"
    assert user.check_password(dummy_password)
