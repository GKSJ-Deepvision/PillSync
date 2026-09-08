import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.adherence.models import AdherenceLog
from apps.medications.models import Medicine
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_full_family_medication_history_workflow():
    user = User.objects.create_user(username="family_admin", password="password")
    parent_profile = PatientProfile.objects.create(
        user=user,
        name="Grandpa Arthur",
        relationship=PatientProfile.Relationship.PARENT,
        is_primary=True,
    )
    med = Medicine.objects.create(
        patient_profile=parent_profile,
        name="Blood Pressure Med",
        category=Medicine.Category.BLOOD_PRESSURE,
    )
    log = AdherenceLog.objects.create(
        patient_profile=parent_profile,
        medicine=med,
        medicine_name=med.name,
        action_date=timezone.now().date(),
        status=AdherenceLog.Status.TAKEN,
    )

    assert log.patient_profile.user == user
    assert log.status == "Taken"
    assert parent_profile.relationship == "Parent"
