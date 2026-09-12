import pytest
from apps.database import SessionLocal, engine, Base
from apps.models import User, Medicine, AdherenceLog, UserRole
from apps.adherence_routes import get_adherence_report

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

def test_get_adherence_report_empty(db_session):
    user = create_test_user(db_session, "empty_user@example.com", "Empty User")
    report = get_adherence_report(db=db_session, current_user=user)
    
    assert report["total_medicines"] == 0
    assert report["total_doses_logged"] == 0
    assert report["doses_taken"] == 0
    assert report["doses_missed"] == 0
    assert report["adherence_percentage"] == 0.0

def test_get_adherence_report_with_data(db_session):
    user = create_test_user(db_session, "report_user@example.com", "Report User")

    # Add two medicines for this user
    med1 = Medicine(
        user_id=user.id,
        name="Amoxicillin",
        dosage="500mg",
        disease="Infection",
        total_quantity=20,
        daily_frequency=2
    )
    med2 = Medicine(
        user_id=user.id,
        name="Paracetamol",
        dosage="650mg",
        disease="Fever",
        total_quantity=10,
        daily_frequency=1
    )
    db_session.add_all([med1, med2])
    db_session.commit()
    db_session.refresh(med1)
    db_session.refresh(med2)

    # Add adherence logs: 3 TAKEN, 1 MISSED, 1 SNOOZED -> Total 5 logs, 3 taken, 2 missed (60.0%)
    logs = [
        AdherenceLog(medicine_id=med1.id, status="TAKEN"),
        AdherenceLog(medicine_id=med1.id, status="TAKEN"),
        AdherenceLog(medicine_id=med1.id, status="MISSED"),
        AdherenceLog(medicine_id=med2.id, status="TAKEN"),
        AdherenceLog(medicine_id=med2.id, status="SNOOZED")
    ]
    db_session.add_all(logs)
    db_session.commit()

    try:
        report = get_adherence_report(db=db_session, current_user=user)
        assert report["total_medicines"] == 2
        assert report["total_doses_logged"] == 5
        assert report["doses_taken"] == 3
        assert report["doses_missed"] == 2
        assert report["adherence_percentage"] == 60.0
    finally:
        for log in logs:
            db_session.delete(log)
        db_session.delete(med1)
        db_session.delete(med2)
        db_session.commit()

def test_get_adherence_report_user_isolation(db_session):
    user_a = create_test_user(db_session, "user_a@example.com", "User A")
    user_b = create_test_user(db_session, "user_b@example.com", "User B")

    med_a = Medicine(user_id=user_a.id, name="MedA", dosage="10mg", total_quantity=10, daily_frequency=1)
    med_b = Medicine(user_id=user_b.id, name="MedB", dosage="20mg", total_quantity=20, daily_frequency=1)
    db_session.add_all([med_a, med_b])
    db_session.commit()
    db_session.refresh(med_a)
    db_session.refresh(med_b)

    log_a = AdherenceLog(medicine_id=med_a.id, status="TAKEN")
    log_b = AdherenceLog(medicine_id=med_b.id, status="MISSED")
    db_session.add_all([log_a, log_b])
    db_session.commit()

    try:
        report_a = get_adherence_report(db=db_session, current_user=user_a)
        assert report_a["total_medicines"] == 1
        assert report_a["total_doses_logged"] == 1
        assert report_a["doses_taken"] == 1
        assert report_a["doses_missed"] == 0
        assert report_a["adherence_percentage"] == 100.0

        report_b = get_adherence_report(db=db_session, current_user=user_b)
        assert report_b["total_medicines"] == 1
        assert report_b["total_doses_logged"] == 1
        assert report_b["doses_taken"] == 0
        assert report_b["doses_missed"] == 1
        assert report_b["adherence_percentage"] == 0.0
    finally:
        db_session.delete(log_a)
        db_session.delete(log_b)
        db_session.delete(med_a)
        db_session.delete(med_b)
        db_session.commit()
