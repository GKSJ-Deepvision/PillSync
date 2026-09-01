from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import mail
from oauth2_provider.models import Application
from oauth2_provider.generators import generate_client_secret
import base64
import re
import json

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.token_refresh_url = reverse('auth_token_refresh')
        self.me_url = reverse('auth_me')
        self.change_password_url = reverse('auth_change_password')
        self.password_reset_url = reverse('auth_password_reset')
        self.password_reset_confirm_url = reverse('auth_password_reset_confirm')
        self.session_login_url = reverse('auth_session_login')
        self.session_logout_url = reverse('auth_session_logout')
        self.logout_url = reverse('auth_logout')

        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "9876543210"
        }

    def test_01_user_registration_success(self):
        """Test registering a user with valid data."""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("message"), "User registered successfully")
        self.assertTrue(User.objects.filter(username="testuser").exists())

    def test_02_registration_duplicate_username(self):
        """Test registration fails with duplicate username."""
        self.client.post(self.register_url, self.user_data, format='json')
        duplicate_data = self.user_data.copy()
        duplicate_data["email"] = "other@example.com"
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_03_registration_duplicate_email(self):
        """Test registration fails with duplicate email."""
        self.client.post(self.register_url, self.user_data, format='json')
        duplicate_data = self.user_data.copy()
        duplicate_data["username"] = "otheruser"
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_04_registration_weak_password(self):
        """Test registration fails with weak password."""
        data = self.user_data.copy()
        data["password"] = "short"
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_05_registration_missing_required_fields(self):
        """Test registration fails when required fields are missing."""
        response = self.client.post(self.register_url, {"username": "onlyuser"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)
        self.assertIn("first_name", response.data)
        self.assertIn("last_name", response.data)
        self.assertIn("phone_number", response.data)

    def test_06_jwt_login_success(self):
        """Test JWT login returns access and refresh tokens."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            "username": "testuser",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_07_jwt_login_invalid_credentials(self):
        """Test JWT login fails with incorrect password."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            "username": "testuser",
            "password": "WrongPassword123"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_08_jwt_token_refresh(self):
        """Test refreshing JWT access token with a valid refresh token."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        refresh_token = login_response.data["refresh"]

        refresh_response = self.client.post(self.token_refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

    def test_09_jwt_token_refresh_invalid(self):
        """Test JWT token refresh with invalid token."""
        response = self.client.post(self.token_refresh_url, {"refresh": "invalid_refresh_token"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_10_me_endpoint_authenticated(self):
        """Test /api/auth/me/ endpoint with valid JWT Bearer header."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        access_token = login_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")
        self.assertEqual(response.data["phone_number"], "9876543210")

    def test_11_me_endpoint_unauthorized(self):
        """Test /api/auth/me/ fails without authentication."""
        self.client.credentials()  # clear credentials
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_12_change_password_success(self):
        """Test changing password with valid old and new passwords."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        access_token = login_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        change_data = {
            "old_password": "TestPassword123!",
            "new_password": "NewSecretPassword456!"
        }
        response = self.client.post(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password changed successfully.")

        # Verify old password no longer works
        self.client.credentials()
        bad_login = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        self.assertEqual(bad_login.status_code, status.HTTP_401_UNAUTHORIZED)

        # Verify new password works
        good_login = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "NewSecretPassword456!"
        }, format='json')
        self.assertEqual(good_login.status_code, status.HTTP_200_OK)

    def test_13_change_password_incorrect_old_password(self):
        """Test change password fails if old password is incorrect."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        access_token = login_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        change_data = {
            "old_password": "IncorrectPassword123!",
            "new_password": "NewSecretPassword456!"
        }
        response = self.client.post(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data)

    def test_14_password_reset_workflow(self):
        """Test full password reset workflow (request -> confirm)."""
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Request reset
        reset_req = self.client.post(self.password_reset_url, {"email": "test@example.com"}, format='json')
        self.assertEqual(reset_req.status_code, status.HTTP_200_OK)
        
        # Check that email was sent
        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body
        
        # Extract uidb64 and token from email body
        uidb64_match = re.search(r'uidb64:\s*([^\s]+)', email_body)
        token_match = re.search(r'token:\s*([^\s]+)', email_body)
        
        self.assertIsNotNone(uidb64_match)
        self.assertIsNotNone(token_match)
        uidb64 = uidb64_match.group(1)
        token = token_match.group(1)

        # Confirm reset
        confirm_data = {
            "uidb64": uidb64,
            "token": token,
            "new_password": "ResetPassword789!"
        }
        confirm_res = self.client.post(self.password_reset_confirm_url, confirm_data, format='json')
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_res.data["message"], "Password has been reset successfully.")

        # Test login with new reset password
        login_res = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "ResetPassword789!"
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

    def test_15_session_login_and_logout(self):
        """Test Django session login and logout endpoints."""
        self.client.post(self.register_url, self.user_data, format='json')

        # Session login
        session_login_res = self.client.post(self.session_login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        self.assertEqual(session_login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(session_login_res.data["message"], "Session login successful.")

        # Access /api/auth/me/ via session
        me_res = self.client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)

        # Session logout
        logout_res = self.client.post(self.session_logout_url)
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

    def test_16_jwt_logout_blacklist(self):
        """Test blacklisting JWT refresh token upon logout."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_res = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "TestPassword123!"
        }, format='json')
        access_token = login_res.data["access"]
        refresh_token = login_res.data["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_res = self.client.post(self.logout_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Ensure refresh token is now rejected
        refresh_attempt = self.client.post(self.token_refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(refresh_attempt.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_17_oauth2_password_grant_flow(self):
        """Test OAuth2 token generation and authenticated access using django-oauth-toolkit."""
        self.client.post(self.register_url, self.user_data, format='json')
        user = User.objects.get(username="testuser")

        raw_client_secret = generate_client_secret()
        app = Application.objects.create(
            name="PillSync OAuth App",
            user=user,
            client_type=Application.CLIENT_CONFIDENTIAL,
            authorization_grant_type=Application.GRANT_PASSWORD,
            client_secret=raw_client_secret,
        )

        token_url = reverse('oauth2_provider:token')
        basic_auth = base64.b64encode(f"{app.client_id}:{raw_client_secret}".encode()).decode()
        
        data = {
            'grant_type': 'password',
            'username': 'testuser',
            'password': 'TestPassword123!',
        }
        response = self.client.post(token_url, data, HTTP_AUTHORIZATION=f"Basic {basic_auth}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        resp_json = response.json()
        self.assertIn("access_token", resp_json)
        self.assertIn("refresh_token", resp_json)

        # Access /api/auth/me/ with OAuth2 Bearer token
        oauth_token = resp_json["access_token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {oauth_token}")
        me_res = self.client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["username"], "testuser")
