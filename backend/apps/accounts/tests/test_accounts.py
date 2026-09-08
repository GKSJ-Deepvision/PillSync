import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    user = User.objects.create_user(
        username="testpatient",
        email="patient@pillsync.local",
        password="Password123!",
        role=User.Role.PATIENT,
    )
    assert user.username == "testpatient"
    assert user.role == "PATIENT"
    assert user.check_password("Password123!")
