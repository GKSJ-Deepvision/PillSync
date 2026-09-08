import pytest
from django.utils import timezone

from apps.adherence.models import AdherenceLog
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_adherence_log_summary():
    profile = PatientProfile.objects.create(name="Alice", relationship="Self")

    AdherenceLog.objects.create(
        patient_profile=profile,
        medicine_name="Aspirin",
        action_date=timezone.now().date(),
        status=AdherenceLog.Status.TAKEN,
    )
    AdherenceLog.objects.create(
        patient_profile=profile,
        medicine_name="Aspirin",
        action_date=timezone.now().date(),
        status=AdherenceLog.Status.TAKEN,
    )
    AdherenceLog.objects.create(
        patient_profile=profile,
        medicine_name="Aspirin",
        action_date=timezone.now().date(),
        status=AdherenceLog.Status.MISSED,
    )

    logs = AdherenceLog.objects.filter(patient_profile=profile)
    total = logs.count()
    taken = logs.filter(status="Taken").count()
    pct = round((taken / total) * 100, 1)

    assert total == 3
    assert taken == 2
    assert pct == 66.7
