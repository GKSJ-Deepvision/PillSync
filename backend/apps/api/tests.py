# Create your tests here.
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
TEST_PASSWORD = "test-password-123"


class APITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testpatient",
            email="patient@example.com",
            password=TEST_PASSWORD,
            role=User.Role.PATIENT,
        )

        self.other_user = User.objects.create_user(
            username="otherpatient",
            email="other@example.com",
            password=TEST_PASSWORD,
            role=User.Role.PATIENT,
        )

    def authenticate(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")

    def test_user_registration(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newpatient",
                "email": "newpatient@example.com",
                "password": TEST_PASSWORD,
                "role": "patient",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(username="newpatient").exists(),
        )

    def test_jwt_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testpatient",
                "password": TEST_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_jwt_refresh(self):
        refresh = RefreshToken.for_user(self.user)

        response = self.client.post(
            "/api/auth/token/refresh/",
            {
                "refresh": str(refresh),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 401)

    def test_me_returns_authenticated_user(self):
        self.authenticate()

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "testpatient")
        self.assertEqual(response.data["email"], "patient@example.com")
        self.assertEqual(response.data["role"], "patient")

    def test_profile_requires_authentication(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, 401)

    def test_profile_can_be_updated(self):
        self.authenticate()

        response = self.client.put(
            "/api/profile/",
            {
                "phone_number": "9876543210",
                "date_of_birth": "2000-01-15",
                "emergency_contact_name": "Test Contact",
                "emergency_contact_phone": "9876500000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["phone_number"], "9876543210")
        self.assertEqual(
            response.data["emergency_contact_name"],
            "Test Contact",
        )

    def test_medicines_requires_authentication(self):
        response = self.client.get("/api/medicines/")

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_create_medicine(self):
        self.authenticate()

        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "instructions": "Take after food",
                "quantity": 20,
                "refill_threshold": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Paracetamol")
        self.assertEqual(response.data["quantity"], 20)

    def test_user_only_sees_own_medicines(self):
        self.authenticate()

        self.client.post(
            "/api/medicines/",
            {
                "name": "My Medicine",
                "dosage": "500mg",
                "quantity": 10,
                "refill_threshold": 2,
            },
            format="json",
        )

        self.client.credentials()

        other_refresh = RefreshToken.for_user(self.other_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {other_refresh.access_token}",
        )

        response = self.client.get("/api/medicines/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
