from datetime import time, timedelta
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.medications.models import Medication, MedicationSchedule


@pytest.mark.django_db
def test_today_medication_schedule_filtering_and_ordering():
    user = User.objects.create_user(
        username="today_user",
        email="today_user@example.com",
        password="password123",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    today = timezone.now().date()
    today_weekday = today.weekday()  # 0 to 6

    # Active med with today's weekday
    med1 = Medication.objects.create(
        owner=user,
        name="Metformin",
        disease_category="diabetes",
        dosage="500mg",
        start_date=today - timedelta(days=10),
        is_active=True,
    )
    MedicationSchedule.objects.create(
        medication=med1,
        time_of_day="morning",
        exact_time=time(8, 0),
        days_of_week=[today_weekday],
    )
    MedicationSchedule.objects.create(
        medication=med1,
        time_of_day="evening",
        exact_time=time(20, 0),
        days_of_week=[today_weekday],
    )

    # Inactive med (should not appear)
    med_inactive = Medication.objects.create(
        owner=user,
        name="Amoxicillin",
        dosage="250mg",
        start_date=today - timedelta(days=30),
        end_date=today - timedelta(days=5),
        is_active=False,
    )
    MedicationSchedule.objects.create(
        medication=med_inactive,
        time_of_day="morning",
        exact_time=time(9, 0),
        days_of_week=[today_weekday],
    )

    response = client.get("/api/medications/today-schedule/")
    assert response.status_code == 200
    assert "doses" in response.data
    doses = response.data["doses"]

    assert len(doses) == 2
    # Verify ordered by time
    assert doses[0]["medication_name"] == "Metformin"
    assert "08:00" in doses[0]["time"]
    assert "08:00" in doses[1]["time"] or "20:00" in doses[1]["time"] or "08:00 PM" in doses[1]["time"]
