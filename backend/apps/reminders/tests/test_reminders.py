import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.medications.models import Medication
from apps.reminders.models import Reminder


@pytest.mark.django_db
class TestRemindersAPI:
    def setup_method(self):
        self.client = APIClient()
        self.medication = Medication.objects.create(
            name="Metoprolol",
            dosage="25 mg",
            stock=30,
            total_stock=60,
        )
        self.reminder = Reminder.objects.create(
            medication=self.medication,
            name="Metoprolol Dose",
            time="09:00 AM",
            period="Morning",
            status="pending",
        )

    def test_list_reminders(self):
        response = self.client.get("/api/reminders/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Metoprolol Dose"

    def test_update_reminder_status(self):
        response = self.client.patch(
            f"/api/reminders/{self.reminder.id}/status/",
            {"status": "taken"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        self.reminder.refresh_from_db()
        assert self.reminder.status == "taken"

    def test_create_reminder(self):
        payload = {
            "medication": self.medication.id,
            "name": "Evening Dose",
            "time": "08:00 PM",
            "period": "Night",
            "status": "pending",
        }
        response = self.client.post("/api/reminders/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Reminder.objects.filter(name="Evening Dose").exists()
