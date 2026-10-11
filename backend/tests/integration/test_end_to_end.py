from datetime import UTC, datetime

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.adherence.models import AdherenceLog
from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile
from apps.reminders.models import Reminder


@pytest.mark.django_db
def test_end_to_end_medication_and_reminder_lifecycle():
    client = APIClient()

    # 1. Create Patient User & Profile
    user = User.objects.create_user(
        username="e2e_patient",
        email="e2e_patient@example.com",
        password="TestPassword123!",  # pragma: allowlist secret
        role="PATIENT",
    )
    profile = PatientProfile.objects.create(
        user=user,
        name="E2E Patient",
        dob="1990-01-01",
    )

    # 2. Add Medication
    medicine = Medicine.objects.create(
        patient_profile=profile,
        name="Amoxicillin",
        category="Antibiotics",
        stock_quantity=30,
        dosage="500mg",
    )
    assert medicine.stock_quantity == 30

    # 3. Create Schedule
    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        patient_profile=profile,
        time_slot="Morning",
        scheduled_time="08:00:00",
        dosage_amount="500mg",
    )

    # 4. Generate Reminder
    reminder = Reminder.objects.create(
        schedule=schedule,
        patient_profile=profile,
        title="Take Amoxicillin",
        scheduled_time=datetime.now(UTC),
        status="Pending",
    )

    # 5. Take Reminder Action via API
    response = client.post(f"/api/reminders/{reminder.id}/take/")
    assert response.status_code == 200
    assert response.data["status"] == "Taken"

    # Verify Medicine Stock Decremented
    medicine.refresh_from_db()
    assert medicine.stock_quantity == 29

    # Verify Adherence Log Created
    adherence_logs = AdherenceLog.objects.filter(patient_profile=profile)
    assert adherence_logs.count() == 1
    assert adherence_logs.first().status == "Taken"

    # 6. Verify Adherence Summary
    summary_resp = client.get(f"/api/adherence/summary/?profile_id={profile.id}")
    assert summary_resp.status_code == 200
    assert summary_resp.data["adherence_percentage"] == 100.0

    # 7. Verify Medication by Condition Endpoint
    cond_resp = client.get("/api/v1/medicines/by-condition/")
    assert cond_resp.status_code == 200
    assert "Antibiotics" in cond_resp.data
