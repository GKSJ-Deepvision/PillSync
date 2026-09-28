import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.adherence.models import AdherenceLog
from apps.medications.models import Medication
from apps.reminders.models import Reminder


@pytest.mark.django_db
class TestAdherenceTracking:
    def setup_method(self):
        self.client = APIClient()
        self.medication = Medication.objects.create(
            name="Metformin",
            dosage="500 mg",
            stock=30,
            total_stock=60,
            frequency="2 times daily",
        )
        self.reminder = Reminder.objects.create(
            medication=self.medication,
            name="Metformin Dose",
            time="08:00 AM",
            period="Morning",
            status="pending",
        )

    def test_log_dose_taken_reduces_stock(self):
        payload = {
            "medication_id": self.medication.id,
            "reminder_id": self.reminder.id,
            "status": "taken",
            "period": "Morning",
            "scheduled_time": "08:00 AM",
        }
        response = self.client.post("/api/adherence/log/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        self.medication.refresh_from_db()
        assert self.medication.stock == 29

        self.reminder.refresh_from_db()
        assert self.reminder.status == "taken"

    def test_adherence_metrics_calculation(self):
        AdherenceLog.objects.create(medication=self.medication, status="taken", period="Morning")
        AdherenceLog.objects.create(medication=self.medication, status="taken", period="Night")
        AdherenceLog.objects.create(medication=self.medication, status="missed", period="Morning")

        response = self.client.get("/api/adherence/metrics/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["takenCount"] == 2
        assert data["missedCount"] == 1
        assert data["totalScheduled"] == 3
        # 2 / 3 = 66.7%
        assert round(data["overallAdherence"], 1) == 66.7

    def test_adherence_history_endpoint(self):
        AdherenceLog.objects.create(medication=self.medication, status="taken", period="Morning")
        response = self.client.get("/api/adherence/history/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["medication_name"] == "Metformin"
