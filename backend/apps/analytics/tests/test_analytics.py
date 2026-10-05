import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.medications.models import Medication
from apps.reminders.models import Reminder


@pytest.mark.django_db
class TestAnalyticsAPI:
    def setup_method(self):
        self.client = APIClient()
        self.medication = Medication.objects.create(
            name="Lisinopril",
            dosage="10 mg",
            stock=5,
            total_stock=30,
            refill_threshold=10,
            frequency="1 time daily",
            disease_category="Hypertension",
        )
        self.reminder1 = Reminder.objects.create(
            medication=self.medication,
            name="Morning Lisinopril",
            time="08:00 AM",
            period="Morning",
            status="taken",
        )
        self.reminder2 = Reminder.objects.create(
            medication=self.medication,
            name="Evening Lisinopril",
            time="08:00 PM",
            period="Evening",
            status="missed",
        )

    def test_analytics_overview_endpoint(self):
        response = self.client.get("/api/analytics/overview/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "activeMedicines" in data
        assert data["activeMedicines"] == 1
        assert "adherenceRate" in data
        assert "takenDoses" in data
        assert data["takenDoses"] == 1
        assert "missedDoses" in data
        assert data["missedDoses"] == 1
        assert "refillAlertsCount" in data
        assert data["refillAlertsCount"] == 1
        assert "doseBreakdown" in data
        assert len(data["doseBreakdown"]) == 3
        assert "medicationAnalytics" in data
        assert len(data["medicationAnalytics"]) == 1
        assert data["medicationAnalytics"][0]["name"] == "Lisinopril"
        assert data["medicationAnalytics"][0]["status"] == "Low Stock"
