from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.adherence.models import DoseEvent


@pytest.mark.django_db
def test_history_records_doses_and_returns_summary():
    client = APIClient()
    medication = client.post(
        "/api/medications/",
        {
            "name": "Lisinopril",
            "dosage": "10mg",
            "frequency": "daily",
            "start_date": date.today().isoformat(),
        },
        format="json",
    ).data

    for dose_status in ("taken", "missed", "snoozed"):
        payload = {
            "medication": medication["id"],
            "scheduled_for": timezone.now().isoformat(),
            "status": dose_status,
        }
        if dose_status == "snoozed":
            payload["snoozed_until"] = (timezone.now() + timedelta(minutes=30)).isoformat()
        response = client.post("/api/adherence/events/", payload, format="json")
        assert response.status_code == 201

    history = client.get("/api/adherence/history/")
    assert history.status_code == 200
    assert history.data["summary"]["total"] == 3
    assert history.data["summary"]["taken"] == 1
    assert history.data["summary"]["missed"] == 1
    assert history.data["summary"]["snoozed"] == 1
    assert history.data["summary"]["adherence_percentage"] == 33.33


@pytest.mark.django_db
def test_event_status_update_records_action_time():
    client = APIClient()
    medication = client.post(
        "/api/medications/",
        {
            "name": "Vitamin D",
            "dosage": "1000 IU",
            "frequency": "daily",
            "start_date": date.today().isoformat(),
        },
        format="json",
    ).data
    event = client.post(
        "/api/adherence/events/",
        {
            "medication": medication["id"],
            "scheduled_for": timezone.now().isoformat(),
            "status": "snoozed",
            "snoozed_until": (timezone.now() + timedelta(minutes=15)).isoformat(),
        },
        format="json",
    ).data

    response = client.patch(
        f"/api/adherence/events/{event['id']}/",
        {"status": "taken"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == DoseEvent.Status.TAKEN
    assert response.data["acted_at"] is not None
