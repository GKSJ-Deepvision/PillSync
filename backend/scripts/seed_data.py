import os
import sys
from datetime import datetime, time, timedelta
import django

# Set up django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.utils import timezone  # noqa: E402
from apps.accounts.models import User  # noqa: E402
from apps.medications.models import Medication, MedicationSchedule, MedicationHistory  # noqa: E402


def seed():
    print("Seeding PillSync database...")

    # 1. Create Users
    patient, _ = User.objects.get_or_create(
        email="patient@example.com",
        defaults={
            "username": "patient",
            "name": "Ibrahim Kadri",
            "role": User.Role.PATIENT,
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        },
    )
    patient.set_password("password123")
    patient.save()

    caregiver, _ = User.objects.get_or_create(
        email="caregiver@example.com",
        defaults={
            "username": "caregiver",
            "name": "Dr. Oliver Mitchell",
            "role": User.Role.CAREGIVER,
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        },
    )
    caregiver.set_password("password123")
    caregiver.save()

    admin, _ = User.objects.get_or_create(
        email="admin@example.com",
        defaults={
            "username": "admin",
            "name": "Sarah Jenkins",
            "role": User.Role.ADMIN,
            "is_staff": True,
            "is_superuser": True,
        },
    )
    admin.set_password("password123")
    admin.save()

    print("Created 3 users: patient@example.com, caregiver@example.com, admin@example.com (password: password123)")

    # 2. Create Medications for Patient
    today = timezone.now().date()

    meds_data = [
        {
            "name": "Metformin",
            "disease_category": "diabetes",
            "dosage": "500mg",
            "quantity_remaining": 60,
            "frequency": "Twice daily",
            "instructions": "Take with meals",
            "start_date": today - timedelta(days=60),
            "schedules": [
                {"time_of_day": "morning", "exact_time": time(8, 0)},
                {"time_of_day": "evening", "exact_time": time(20, 0)},
            ],
        },
        {
            "name": "Lisinopril",
            "disease_category": "blood_pressure",
            "dosage": "10mg",
            "quantity_remaining": 30,
            "frequency": "Once daily",
            "instructions": "Take with full glass of water",
            "start_date": today - timedelta(days=90),
            "schedules": [
                {"time_of_day": "morning", "exact_time": time(8, 0)},
            ],
        },
        {
            "name": "Levothyroxine",
            "disease_category": "thyroid",
            "dosage": "50mcg",
            "quantity_remaining": 90,
            "frequency": "Once daily",
            "instructions": "Take on empty stomach 30m before breakfast",
            "start_date": today - timedelta(days=120),
            "schedules": [
                {"time_of_day": "morning", "exact_time": time(7, 0)},
            ],
        },
        {
            "name": "Vitamin D3",
            "disease_category": "vitamins",
            "dosage": "2000 IU",
            "quantity_remaining": 45,
            "frequency": "Once daily",
            "instructions": "Take with lunch",
            "start_date": today - timedelta(days=30),
            "schedules": [
                {"time_of_day": "afternoon", "exact_time": time(13, 0)},
            ],
        },
    ]

    for m_data in meds_data:
        schedules_list = m_data.pop("schedules")
        med, _ = Medication.objects.get_or_create(
            owner=patient,
            name=m_data["name"],
            defaults=m_data,
        )
        for s_info in schedules_list:
            sched, _ = MedicationSchedule.objects.get_or_create(
                medication=med,
                time_of_day=s_info["time_of_day"],
                exact_time=s_info["exact_time"],
                defaults={
                    "days_of_week": [0, 1, 2, 3, 4, 5, 6],
                    "dose_amount": 1.00,
                },
            )

            # Create sample history records for the past 7 days
            for d_offset in range(1, 8):
                past_date = today - timedelta(days=d_offset)
                sched_dt = timezone.make_aware(datetime.combine(past_date, s_info["exact_time"]))
                MedicationHistory.objects.get_or_create(
                    medication=med,
                    dosage_schedule=sched,
                    scheduled_datetime=sched_dt,
                    defaults={
                        "user": patient,
                        "status": MedicationHistory.Status.TAKEN,
                        "taken_datetime": sched_dt + timedelta(minutes=5),
                        "notes": "Taken on schedule",
                    },
                )

    print("Created sample medications, schedules, and 7-day adherence history for patient.")
    print("Database seeding complete!")


if __name__ == "__main__":
    seed()
