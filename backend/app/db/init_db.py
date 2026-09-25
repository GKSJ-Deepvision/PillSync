from app.db.session import Base, engine
from app.models import (
    CaregiverPatient,
    DosageSchedule,
    MedicalCondition,
    MedicationHistory,
    Medicine,
    PatientProfile,
    Prescription,
    Reminder,
    User,
)


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")