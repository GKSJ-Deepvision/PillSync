"""The cron-triggered job endpoint for hosts without a Celery worker."""

from __future__ import annotations

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db

SECRET = "test-cron-secret-value"  # pragma: allowlist secret


@pytest.fixture
def url():
    return reverse("run-jobs")


def call(client, url, group="frequent", secret=SECRET):
    headers = {"HTTP_X_CRON_SECRET": secret} if secret is not None else {}
    return client.post(f"{url}?group={group}", **headers)


def test_it_does_not_exist_when_no_secret_is_configured(client, url, settings):
    settings.CRON_SECRET = ""
    assert call(client, url).status_code == 404


def test_a_wrong_or_missing_secret_is_refused(client, url, settings):
    settings.CRON_SECRET = SECRET
    assert call(client, url, secret="nope").status_code == 403
    assert call(client, url, secret=None).status_code == 403


def test_get_is_not_allowed(client, url, settings):
    settings.CRON_SECRET = SECRET
    assert client.get(url).status_code == 405


def test_an_unknown_group_is_a_400(client, url, settings):
    settings.CRON_SECRET = SECRET
    assert call(client, url, group="weekly").status_code == 400


def test_the_frequent_group_sends_due_reminders_and_sweeps(client, url, settings, patient):
    from datetime import time, timedelta
    from decimal import Decimal

    from django.utils import timezone

    from apps.common.choices import DoseSlot, DoseStatus
    from apps.medications.models import MedicationSchedule, Medicine
    from apps.reminders.models import DoseEvent

    settings.CRON_SECRET = SECRET
    medicine = Medicine.objects.create(
        patient=patient.patient_profile, name="Metformin", quantity_remaining=Decimal("30")
    )
    schedule = MedicationSchedule.objects.create(
        medicine=medicine, time_of_day=time(8, 0), quantity_per_dose=Decimal("1")
    )
    now = timezone.now()
    due = DoseEvent.objects.create(
        schedule=schedule,
        medicine=medicine,
        patient=medicine.patient,
        scheduled_for=now - timedelta(minutes=1),
        slot=DoseSlot.MORNING,
    )
    stale = DoseEvent.objects.create(
        schedule=schedule,
        medicine=medicine,
        patient=medicine.patient,
        scheduled_for=now - timedelta(hours=9),
        slot=DoseSlot.MORNING,
    )

    response = call(client, url, "frequent")

    assert response.status_code == 200, response.content
    assert response.json()["results"] == {"dispatch_due_reminders": 2, "sweep_overdue_doses": 1}
    due.refresh_from_db()
    stale.refresh_from_db()
    assert due.reminder_sent_at is not None
    assert stale.status == DoseStatus.MISSED


def test_the_daily_group_runs_every_daily_job(client, url, settings):
    settings.CRON_SECRET = SECRET
    response = call(client, url, "daily")
    assert response.status_code == 200, response.content
    assert set(response.json()["results"]) == {
        "generate_dose_events",
        "notify_expiring_prescriptions",
        "recompute_predictions",
        "purge_stale_ocr_jobs",
    }


def test_one_failing_job_does_not_stop_the_rest(client, url, settings, monkeypatch):
    settings.CRON_SECRET = SECRET

    def boom(*args, **kwargs):
        raise RuntimeError("provider down")

    monkeypatch.setattr("apps.reminders.tasks.dispatch_due_reminders", boom)
    response = call(client, url, "frequent")

    assert response.status_code == 500
    results = response.json()["results"]
    assert results["dispatch_due_reminders"] == "failed"
    assert results["sweep_overdue_doses"] == 0  # still ran
