from datetime import date, time, timedelta
from secrets import token_urlsafe

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.adherence.models import DoseEvent, DoseEventStatus
from apps.medications.models import Dosage, MedicationSchedule, Medicine


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient():
    return User.objects.create_user(
        email="adherence-patient@example.com",
        full_name="Adherence Patient",
        password=token_urlsafe(24),
        role=UserRole.PATIENT,
    )


@pytest.fixture
def second_patient():
    return User.objects.create_user(
        email="adherence-second@example.com",
        full_name="Second Patient",
        password=token_urlsafe(24),
        role=UserRole.PATIENT,
    )


@pytest.fixture
def caregiver():
    return User.objects.create_user(
        email="adherence-caregiver@example.com",
        full_name="Adherence Caregiver",
        password=token_urlsafe(24),
        role=UserRole.CAREGIVER,
    )


@pytest.fixture
def medicine(patient):
    return Medicine.objects.create(
        patient=patient,
        medicine_name="Metformin",
        generic_name="Metformin",
        dosage="500.00",
        dosage_form="Tablet",
        quantity=30,
        disease_category="DIABETES",
        is_active=True,
    )


@pytest.fixture
def schedule(medicine):
    dosage = Dosage.objects.create(
        medicine=medicine,
        quantity="500.00",
        unit="mg",
    )

    return MedicationSchedule.objects.create(
        dosage=dosage,
        scheduled_time=time(8, 0),
        time_of_day=MedicationSchedule.TimeOfDay.MORNING,
        frequency="Once daily",
        repeat_rule=MedicationSchedule.RepeatRule.DAILY,
        start_date=date(2026, 9, 1),
        end_date=None,
    )


@pytest.mark.django_db
def test_summary_requires_authentication(api_client):
    response = api_client.get("/api/adherence/summary/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_non_patient_cannot_access_adherence_summary(
    api_client,
    caregiver,
):
    api_client.force_authenticate(user=caregiver)

    response = api_client.get("/api/adherence/summary/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_patient_can_get_adherence_summary(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    yesterday = timezone.localdate() - timedelta(days=1)

    taken_at = timezone.make_aware(
        timezone.datetime.combine(
            yesterday,
            time(8, 5),
        )
    )

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=yesterday,
        status=DoseEventStatus.TAKEN,
        taken_at=taken_at,
    )

    response = api_client.get(
        "/api/adherence/summary/",
        {
            "start_date": yesterday.isoformat(),
            "end_date": yesterday.isoformat(),
        },
    )

    assert response.status_code == 200
    assert response.data["scheduled_doses"] == 1
    assert response.data["taken_doses"] == 1
    assert response.data["missed_doses"] == 0
    assert response.data["adherence_rate"] == 100.0
    assert response.data["current_streak"] == 1


@pytest.mark.django_db
def test_patient_can_get_history(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)
    target_date = timezone.localdate() - timedelta(days=1)

    response = api_client.get(
        "/api/adherence/history/",
        {
            "start_date": target_date.isoformat(),
            "end_date": target_date.isoformat(),
        },
    )

    assert response.status_code == 200
    assert len(response.data) == 1

    day = response.data[0]

    assert day["date"] == target_date
    assert day["scheduled"] == 1
    assert day["taken"] == 0
    assert day["missed"] == 1
    assert day["pending"] == 0
    assert day["adherence_rate"] == 0.0


@pytest.mark.django_db
def test_patient_can_get_medication_breakdown(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)
    target_date = timezone.localdate() - timedelta(days=1)

    taken_at = timezone.make_aware(
        timezone.datetime.combine(
            target_date,
            time(8, 10),
        )
    )

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=target_date,
        status=DoseEventStatus.TAKEN,
        taken_at=taken_at,
    )

    response = api_client.get(
        "/api/adherence/medications/",
        {
            "start_date": target_date.isoformat(),
            "end_date": target_date.isoformat(),
        },
    )

    assert response.status_code == 200
    assert len(response.data) == 1

    medication = response.data[0]

    assert medication["medicine_name"] == "Metformin"
    assert medication["scheduled_doses"] == 1
    assert medication["taken_doses"] == 1
    assert medication["missed_doses"] == 0
    assert medication["adherence_rate"] == 100.0


@pytest.mark.django_db
def test_patient_can_log_taken_dose(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    target_date = timezone.localdate() - timedelta(days=1)

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": target_date.isoformat(),
            "status": "TAKEN",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == "TAKEN"

    event = DoseEvent.objects.get(
        schedule=schedule,
        dose_date=target_date,
    )

    assert event.status == DoseEventStatus.TAKEN
    assert event.taken_at is not None
    assert event.missed_at is None


@pytest.mark.django_db
def test_patient_can_log_missed_dose(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    target_date = timezone.localdate() - timedelta(days=1)

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": target_date.isoformat(),
            "status": "MISSED",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == "MISSED"

    event = DoseEvent.objects.get(
        schedule=schedule,
        dose_date=target_date,
    )

    assert event.status == DoseEventStatus.MISSED
    assert event.missed_at is not None
    assert event.taken_at is None


@pytest.mark.django_db
def test_future_dose_cannot_be_marked_taken(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    future_date = timezone.localdate() + timedelta(days=1)

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": future_date.isoformat(),
            "status": "TAKEN",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "future dose" in response.data["detail"].lower()


@pytest.mark.django_db
def test_patient_cannot_log_another_patients_dose(
    api_client,
    patient,
    second_patient,
    schedule,
):
    api_client.force_authenticate(user=second_patient)

    target_date = timezone.localdate() - timedelta(days=1)

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": target_date.isoformat(),
            "status": "TAKEN",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "permission" in str(response.data).lower()


@pytest.mark.django_db
def test_cannot_log_dose_on_unscheduled_date(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    schedule.start_date = timezone.localdate()
    schedule.save(update_fields=["start_date"])

    yesterday = timezone.localdate() - timedelta(days=1)

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": yesterday.isoformat(),
            "status": "TAKEN",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "not scheduled" in response.data["detail"].lower()


@pytest.mark.django_db
def test_snooze_requires_future_time(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    target_date = timezone.localdate()

    response = api_client.post(
        "/api/adherence/log/",
        {
            "schedule": schedule.id,
            "dose_date": target_date.isoformat(),
            "status": "SNOOZED",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "snoozed_until" in response.data


@pytest.mark.django_db
def test_patient_can_get_today_doses(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    schedule.start_date = timezone.localdate()
    schedule.save(update_fields=["start_date"])

    response = api_client.get("/api/adherence/today/")

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["medicine_name"] == "Metformin"
    assert response.data[0]["schedule_id"] == schedule.id


@pytest.mark.django_db
def test_report_returns_complete_analytics(
    api_client,
    patient,
    schedule,
):
    api_client.force_authenticate(user=patient)

    target_date = timezone.localdate() - timedelta(days=1)

    response = api_client.get(
        "/api/adherence/report/",
        {
            "start_date": target_date.isoformat(),
            "end_date": target_date.isoformat(),
        },
    )

    assert response.status_code == 200
    assert "summary" in response.data
    assert "daily_history" in response.data
    assert "status_breakdown" in response.data
    assert "medications" in response.data
