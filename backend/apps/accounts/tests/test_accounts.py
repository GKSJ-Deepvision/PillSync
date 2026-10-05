import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAccountsAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            password="dummy-test-password-123!",
            first_name="Test",
            last_name="User",
        )

    def test_user_registration(self):
        payload = {
            "email": "newuser@example.com",
            "password": "dummy-test-password-123!",
            "name": "New User",
            "role": "patient",
        }
        response = self.client.post("/api/accounts/register/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access" in data
        assert data["user"]["email"] == "newuser@example.com"

    def test_user_registration_duplicate_email(self):
        payload = {
            "email": "testuser@example.com",
            "password": "dummy-test-password-123!",
            "name": "Test User",
            "role": "patient",
        }
        response = self.client.post("/api/accounts/register/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_login_success(self):
        payload = {
            "email": "testuser@example.com",
            "password": "dummy-test-password-123!",
        }
        response = self.client.post("/api/accounts/login/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access" in data

    def test_user_login_failure(self):
        payload = {
            "email": "testuser@example.com",
            "password": "WrongPassword",
        }
        response = self.client.post("/api/accounts/login/", payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_profile(self):
        response = self.client.get("/api/accounts/me/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "email" in data
