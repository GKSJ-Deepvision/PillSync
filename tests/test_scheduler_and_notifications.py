import pytest
import asyncio
from datetime import datetime, time
from apps.notifications import send_medication_reminder
from apps.scheduler import scheduler, check_due_medicines
from apps.database import SessionLocal
from apps.models import Medicine, AdherenceLog, User, UserRole
from config.main import lifespan, app

def test_send_medication_reminder():
    user_id = 99
    medicine_name = "Ibuprofen"
    dosage = "400mg"
    message = send_medication_reminder(user_id=user_id, medicine_name=medicine_name, dosage=dosage)
    assert f"Patient ID: [{user_id}]" in message
    assert f"Medicine: [{medicine_name}]" in message
    assert f"Dosage: [{dosage}]" in message

def test_check_due_medicines():
    db = SessionLocal()
    try:
        # Create a test patient if not existing
        user = db.query(User).filter(User.email == "test_patient@example.com").first()
        if not user:
            user = User(
                full_name="Test Patient",
                email="test_patient@example.com",
                hashed_password="hashed_secret",
                role=UserRole.PATIENT
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create a test medicine requiring 1 dose daily
        medicine = Medicine(
            user_id=user.id,
            name="TestDueMedicine",
            dosage="10mg",
            total_quantity=30,
            daily_frequency=1
        )
        db.add(medicine)
        db.commit()
        db.refresh(medicine)

        # Running check_due_medicines should process without error
        check_due_medicines()

        # Add TAKEN adherence log for today
        now = datetime.utcnow()
        log = AdherenceLog(
            medicine_id=medicine.id,
            status="TAKEN",
            timestamp=now
        )
        db.add(log)
        db.commit()

        # Running again should also process without error
        check_due_medicines()

        # Clean up created test medicine and adherence log
        db.delete(log)
        db.delete(medicine)
        db.commit()
    finally:
        db.close()

@pytest.mark.asyncio
async def test_fastapi_lifespan():
    async with lifespan(app):
        assert scheduler.running is True
        job = scheduler.get_job("check_due_medicines")
        assert job is not None
    await asyncio.sleep(0.01)
    assert scheduler.running is False
