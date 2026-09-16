from datetime import date, time
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.medications.models import Medication, MedicationSchedule


@pytest.mark.django_db
def test_user_cannot_access_or_modify_other_user_data():
    user_a = User.objects.create_user(
        username="user_a",
        email="usera@example.com",
        password="password123",
    )
    user_b = User.objects.create_user(
        username="user_b",
        email="userb@example.com",
        password="password123",
    )

    client_a = APIClient()
    client_a.force_authenticate(user=user_a)

    client_b = APIClient()
    client_b.force_authenticate(user=user_b)

    # User B creates a medication
    med_b = Medication.objects.create(
        owner=user_b,
        name="Private Medicine B",
        dosage="20mg",
        start_date=date.today(),
    )
    sched_b = MedicationSchedule.objects.create(
        medication=med_b,
        time_of_day="morning",
        exact_time=time(8, 0),
    )

    # User A listing medications should not see User B's medication
    list_a = client_a.get("/api/medications/")
    assert list_a.status_code == 200
    assert all(m["id"] != med_b.id for m in list_a.data)

    # User A trying to mark User B's dose as taken should receive 403 Forbidden
    take_res = client_a.post(f"/api/medications/doses/{sched_b.id}/take")
    assert take_res.status_code == 403
