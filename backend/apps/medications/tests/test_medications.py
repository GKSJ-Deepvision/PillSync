import pytest

from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_create_medicine_with_schedule():
    profile = PatientProfile.objects.create(name="Jane Doe", relationship="Self")
    med = Medicine.objects.create(
        patient_profile=profile,
        name="Metformin",
        category=Medicine.Category.DIABETES,
        dosage="500mg",
        stock_quantity=60,
    )
    schedule = MedicationSchedule.objects.create(
        medicine=med,
        patient_profile=profile,
        time_slot="Morning",
        scheduled_time="08:00:00",
        dosage_amount="1 Tablet",
    )

    assert med.patient_profile == profile
    assert med.stock_quantity == 60
    assert schedule.medicine == med
    assert schedule.time_slot == "Morning"
