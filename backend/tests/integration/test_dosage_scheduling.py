from datetime import date
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User


@pytest.mark.django_db
def test_create_medication_with_multiple_dosage_schedules():
    user = User.objects.create_user(
        username="patient_sched",
        email="patient_sched@example.com",
        password="password123",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/medications/",
        {
            "name": "Paracetamol",
            "disease_category": "other",
            "dosage": "500 mg",
            "frequency": "3 times daily",
            "startDate": date.today().isoformat(),
            "schedules": [
                {
                    "time_of_day": "morning",
                    "exact_time": "08:00:00",
                    "days_of_week": [0, 1, 2, 3, 4],
                    "dose_amount": "1.00",
                },
                {
                    "time_of_day": "afternoon",
                    "exact_time": "14:00:00",
                    "days_of_week": [0, 1, 2, 3, 4],
                    "dose_amount": "1.00",
                },
                {
                    "time_of_day": "evening",
                    "exact_time": "20:00:00",
                    "days_of_week": [0, 1, 2, 3, 4],
                    "dose_amount": "1.00",
                },
            ],
        },
        format="json",
    )

    assert response.status_code == 201
    assert len(response.data["schedules"]) == 3
    assert response.data["name"] == "Paracetamol"

    med_id = response.data["id"]

    # Retrieve schedules for medication
    schedules_res = client.get(f"/api/medications/{med_id}/schedules/")
    assert schedules_res.status_code == 200
    assert len(schedules_res.data) == 3

    # Add a 4th schedule
    add_sched_res = client.post(
        f"/api/medications/{med_id}/schedules/",
        {
            "time_of_day": "night",
            "exact_time": "22:00:00",
            "days_of_week": [0, 1, 2, 3, 4],
            "dose_amount": "1.00",
        },
        format="json",
    )
    assert add_sched_res.status_code == 201
    sched_id = add_sched_res.data["id"]

    # Update schedule
    update_res = client.patch(
        f"/api/medications/schedules/{sched_id}/",
        {"time_of_day": "night", "exact_time": "22:30:00"},
        format="json",
    )
    assert update_res.status_code == 200

    # Delete schedule
    delete_res = client.delete(f"/api/medications/schedules/{sched_id}/")
    assert delete_res.status_code == 204
