from datetime import time
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.medications.models import Medication, MedicationSchedule, MedicationHistory


@pytest.mark.django_db
def test_mark_dose_taken_and_skip_and_prevent_duplicates():
    user = User.objects.create_user(
        username="hist_user",
        email="hist_user@example.com",
        password="password123",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    today = timezone.now().date()
    med = Medication.objects.create(
        owner=user,
        name="Lisinopril",
        dosage="10mg",
        quantity_remaining=30,
        start_date=today,
    )
    sched = MedicationSchedule.objects.create(
        medication=med,
        time_of_day="morning",
        exact_time=time(8, 0),
        days_of_week=[today.weekday()],
    )

    # Mark as Taken
    res_taken = client.post(
        f"/api/medications/doses/{sched.id}/take",
        {"notes": "Taken with breakfast"},
        format="json",
    )
    assert res_taken.status_code == 200
    assert res_taken.data["status"] == "taken"

    # Verify history record count = 1
    assert MedicationHistory.objects.filter(medication=med).count() == 1
    hist_record = MedicationHistory.objects.get(medication=med)
    assert hist_record.status == MedicationHistory.Status.TAKEN
    assert hist_record.taken_datetime is not None

    # Idempotency check: clicking Taken again should not create duplicate record
    res_taken_again = client.post(
        f"/api/medications/doses/{sched.id}/take",
        {"notes": "Clicked again"},
        format="json",
    )
    assert res_taken_again.status_code == 200
    assert MedicationHistory.objects.filter(medication=med).count() == 1

    # Mark as Skipped
    res_skip = client.post(
        f"/api/medications/doses/{sched.id}/skip",
        {"notes": "Feeling sick"},
        format="json",
    )
    assert res_skip.status_code == 200
    assert res_skip.data["status"] == "skipped"

    # Query Medication History API
    hist_api_res = client.get("/api/medication-history/")
    assert hist_api_res.status_code == 200
    assert len(hist_api_res.data) == 1
    assert hist_api_res.data[0]["medication_name"] == "Lisinopril"
