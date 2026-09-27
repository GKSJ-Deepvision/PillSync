import pytest
from unittest.mock import patch
from apps.database import SessionLocal, engine, Base
from apps.models import User, Medicine, AdherenceLog, UserRole
from apps.schemas import AdherenceLogCreate, AdherenceStatus
from apps.adherence_routes import log_adherence
from apps.medicine_routes import get_medicine_refill_status
from apps.notifications import send_refill_alert
from apps.scheduler import check_due_medicines
from fastapi import HTTPException

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def create_test_user(db, email: str, full_name: str = "Test User"):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            full_name=full_name,
            email=email,
            hashed_password="hashed_secret",
            role=UserRole.PATIENT
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def test_inventory_depletion_on_taken(db_session):
    user = create_test_user(db_session, "inventory_user@example.com", "Inventory User")
    medicine = Medicine(
        user_id=user.id,
        name="Metformin",
        dosage="500mg",
        disease="Diabetes",
        total_quantity=10,
        daily_frequency=2
    )
    db_session.add(medicine)
    db_session.commit()
    db_session.refresh(medicine)

    try:
        log_data = AdherenceLogCreate(medicine_id=medicine.id, status=AdherenceStatus.TAKEN)
        created_log = log_adherence(log_data=log_data, db=db_session, current_user=user)

        db_session.refresh(medicine)
        assert medicine.total_quantity == 9
        assert created_log.status == "TAKEN"

        # Deplete when quantity reaches zero
        medicine.total_quantity = 0
        db_session.commit()

        log_adherence(log_data=log_data, db=db_session, current_user=user)
        db_session.refresh(medicine)
        assert medicine.total_quantity == 0

        # Log with MISSED does not decrement
        medicine.total_quantity = 5
        db_session.commit()
        missed_log_data = AdherenceLogCreate(medicine_id=medicine.id, status=AdherenceStatus.MISSED)
        log_adherence(log_data=missed_log_data, db=db_session, current_user=user)
        db_session.refresh(medicine)
        assert medicine.total_quantity == 5
    finally:
        db_session.query(AdherenceLog).filter(AdherenceLog.medicine_id == medicine.id).delete()
        db_session.delete(medicine)
        db_session.commit()

def test_refill_status_endpoint(db_session):
    user = create_test_user(db_session, "refill_user@example.com", "Refill User")
    other_user = create_test_user(db_session, "other_refill_user@example.com", "Other User")

    # Medicine with 6 days supply -> needs_refill is False
    med_sufficient = Medicine(
        user_id=user.id,
        name="Vitamin C",
        dosage="1000mg",
        total_quantity=12,
        daily_frequency=2
    )
    # Medicine with 4 days supply -> needs_refill is True
    med_low = Medicine(
        user_id=user.id,
        name="Atorvastatin",
        dosage="20mg",
        total_quantity=4,
        daily_frequency=1
    )
    db_session.add_all([med_sufficient, med_low])
    db_session.commit()
    db_session.refresh(med_sufficient)
    db_session.refresh(med_low)

    try:
        status_sufficient = get_medicine_refill_status(
            medicine_id=med_sufficient.id, db=db_session, current_user=user
        )
        assert status_sufficient["days_remaining"] == 6
        assert status_sufficient["needs_refill"] is False

        status_low = get_medicine_refill_status(
            medicine_id=med_low.id, db=db_session, current_user=user
        )
        assert status_low["days_remaining"] == 4
        assert status_low["needs_refill"] is True

        # Unauthorized check
        with pytest.raises(HTTPException) as exc_info:
            get_medicine_refill_status(
                medicine_id=med_low.id, db=db_session, current_user=other_user
            )
        assert exc_info.value.status_code == 403

        # Not found check
        with pytest.raises(HTTPException) as exc_info_404:
            get_medicine_refill_status(
                medicine_id=999999, db=db_session, current_user=user
            )
        assert exc_info_404.value.status_code == 404
    finally:
        db_session.delete(med_sufficient)
        db_session.delete(med_low)
        db_session.commit()

def test_send_refill_alert():
    msg = send_refill_alert(medicine_name="Lisinopril", days_left=3)
    assert "Lisinopril" in msg
    assert "3" in msg
    assert "REFILL REQUIRED" in msg

def test_scheduler_evaluates_refills(db_session):
    user = create_test_user(db_session, "scheduler_refill@example.com", "Scheduler User")
    med_low = Medicine(
        user_id=user.id,
        name="LowStockMed",
        dosage="5mg",
        total_quantity=5,
        daily_frequency=1
    )
    med_high = Medicine(
        user_id=user.id,
        name="HighStockMed",
        dosage="10mg",
        total_quantity=50,
        daily_frequency=1
    )
    db_session.add_all([med_low, med_high])
    db_session.commit()
    db_session.refresh(med_low)
    db_session.refresh(med_high)

    try:
        with patch("apps.scheduler.send_refill_alert") as mock_refill_alert:
            check_due_medicines()
            # Verify send_refill_alert was called for LowStockMed
            calls = [call.kwargs.get("medicine_name") or call.args[0] for call in mock_refill_alert.call_args_list if call.args or call.kwargs]
            assert "LowStockMed" in calls
            assert "HighStockMed" not in calls
    finally:
        db_session.delete(med_low)
        db_session.delete(med_high)
        db_session.commit()
