import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.notifications.models import DeviceToken


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="notify_user@example.com",
        full_name="Notify User",
        password="password123",  # pragma: allowlist secret
        role=UserRole.PATIENT,
    )


@pytest.mark.django_db
class TestNotifications:
    def test_register_device_token(self, api_client, user):
        api_client.force_authenticate(user=user)
        data = {
            "token": "fcm_test_token_abc123",
            "device_type": "web",
        }
        response = api_client.post("/notifications/device-token/", data, format="json")
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert DeviceToken.objects.filter(token="fcm_test_token_abc123", user=user).exists()

    def test_register_missing_token(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.post("/notifications/device-token/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_deactivate_device_token(self, api_client, user):
        api_client.force_authenticate(user=user)
        DeviceToken.objects.create(user=user, token="fcm_to_delete", device_type="android")

        response = api_client.delete(
            "/notifications/device-token/",
            {"token": "fcm_to_delete"},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        token_obj = DeviceToken.objects.get(token="fcm_to_delete")
        assert not token_obj.is_active
