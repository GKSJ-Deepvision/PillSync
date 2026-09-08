from datetime import date

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_create_medication_with_schedule_and_list_it():
    client = APIClient()
    response = client.post(
        "/api/medications/",
        {
            "name": "Metformin",
            "disease_category": "diabetes",
            "dosage": "500mg",
            "frequency": "twice daily",
            "start_date": date.today().isoformat(),
            "schedules": [
                {
                    "time_of_day": "morning",
                    "exact_time": "08:00:00",
                    "days_of_week": [0, 1, 2, 3, 4],
                    "dose_amount": "1.00",
                }
            ],
        },
        format="json",
    )

    assert response.status_code == 201
    assert len(response.data["schedules"]) == 1
    assert response.data["schedules"][0]["days_of_week"] == [0, 1, 2, 3, 4]

    listed = client.get("/api/medications/")
    assert listed.status_code == 200
    assert listed.data[0]["name"] == "Metformin"


@pytest.mark.django_db
def test_schedule_endpoint_rejects_invalid_weekday():
    medication = (
        APIClient()
        .post(
            "/api/medications/",
            {
                "name": "Aspirin",
                "dosage": "100mg",
                "frequency": "daily",
                "start_date": date.today().isoformat(),
            },
            format="json",
        )
        .data
    )

    response = APIClient().post(
        f"/api/medications/{medication['id']}/schedules/",
        {
            "time_of_day": "morning",
            "exact_time": "08:00:00",
            "days_of_week": [7],
            "dose_amount": "1.00",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "days_of_week" in response.data
