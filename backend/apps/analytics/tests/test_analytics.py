from datetime import date

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.analytics.services.aggregations import (
    get_dashboard_metrics,
    get_patient_adherence_summary,
)
from apps.medications.models import Medicine
from apps.profiles.models import PatientProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient_profile(db):
    user = User.objects.create_user(
        email="patient_analytics@example.com",
        full_name="Patient Analytics",
        password="password123",  # pragma: allowlist secret
        role=UserRole.PATIENT,
    )
    patient = PatientProfile.objects.create(
        user=user,
        first_name="Patient",
        last_name="Analytics",
        date_of_birth=date(1990, 1, 1),
    )
    Medicine.objects.create(
        patient=patient,
        name="Lisinopril",
        quantity_remaining=45,
    )
    return patient


@pytest.mark.django_db
class TestAnalytics:
    def test_get_dashboard_metrics(self, patient_profile):
        metrics = get_dashboard_metrics(patient_profile.id)
        assert metrics["active_medicines"] >= 1
        assert "weekly_adherence_rate" in metrics

    def test_get_patient_adherence_summary(self, patient_profile):
        summary = get_patient_adherence_summary(patient_profile.id, days=30)
        assert summary["days"] == 30
        assert summary["adherence_percentage"] == 100.0

    def test_dashboard_endpoint(self, api_client, patient_profile):
        api_client.force_authenticate(user=patient_profile.user)
        response = api_client.get(f"/api/analytics/dashboard/?patient={patient_profile.id}")
        assert response.status_code == status.HTTP_200_OK
        assert "active_medicines" in response.data

    def test_adherence_endpoint(self, api_client, patient_profile):
        api_client.force_authenticate(user=patient_profile.user)
        response = api_client.get(f"/api/analytics/adherence/?patient={patient_profile.id}&days=7")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["days"] == 7
