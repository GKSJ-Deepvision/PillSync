from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.medications.models import Medication
from apps.reminders.models import Reminder

class Command(BaseCommand):
    help = "Seed database with initial real patient medication and reminder schedules"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database with real medication records...")

        # Create demo user if not exists
        if not User.objects.filter(email="patient@pillsync.com").exists():
            User.objects.create_user(
                username="patient@pillsync.com",
                email="patient@pillsync.com",
                password="password123",
                first_name="Sarah",
                last_name="Jenkins"
            )
            self.stdout.write(self.style.SUCCESS("Created demo patient user."))

        # Initial Medications
        med_records = [
            {
                "name": "Metformin",
                "dosage": "500 mg",
                "stock": 8,
                "total_stock": 60,
                "frequency": "2 times daily",
                "disease_category": "Diabetes",
                "times_of_day": ["Morning", "Night"],
                "refill_threshold": 10,
                "active_ingredient": "Metformin Hydrochloride",
                "manufacturer": "Sun Pharma / Teva",
                "fda_ndc": "60505-0024"
            },
            {
                "name": "Amlodipine",
                "dosage": "5 mg",
                "stock": 45,
                "total_stock": 60,
                "frequency": "1 time daily",
                "disease_category": "Blood Pressure",
                "times_of_day": ["Morning"],
                "refill_threshold": 10,
                "active_ingredient": "Amlodipine Besylate",
                "manufacturer": "Pfizer / Lupin",
                "fda_ndc": "0069-1530"
            },
            {
                "name": "Levothyroxine",
                "dosage": "50 mcg",
                "stock": 28,
                "total_stock": 30,
                "frequency": "1 time daily",
                "disease_category": "Thyroid",
                "times_of_day": ["Morning"],
                "refill_threshold": 7,
                "active_ingredient": "Levothyroxine Sodium",
                "manufacturer": "AbbVie / Mylan",
                "fda_ndc": "0074-4552"
            },
            {
                "name": "Atorvastatin",
                "dosage": "20 mg",
                "stock": 14,
                "total_stock": 30,
                "frequency": "1 time daily",
                "disease_category": "Heart",
                "times_of_day": ["Night"],
                "refill_threshold": 10,
                "active_ingredient": "Atorvastatin Calcium",
                "manufacturer": "Viatris / Sandoz",
                "fda_ndc": "0093-7554"
            },
            {
                "name": "Amoxicillin",
                "dosage": "250 mg",
                "stock": 18,
                "total_stock": 20,
                "frequency": "3 times daily",
                "disease_category": "Antibiotics",
                "times_of_day": ["Morning", "Afternoon", "Night"],
                "refill_threshold": 5,
                "active_ingredient": "Amoxicillin Trihydrate",
                "manufacturer": "GlaxoSmithKline",
                "fda_ndc": "0029-6008"
            }
        ]

        created_meds = []
        for m_data in med_records:
            med, created = Medication.objects.get_or_create(
                name=m_data["name"],
                defaults=m_data
            )
            med.update_stock_days()
            med.save()
            created_meds.append(med)

        self.stdout.write(self.style.SUCCESS(f"Populated {len(created_meds)} medications."))

        # Create reminders
        reminder_records = [
            {
                "med_name": "Metformin",
                "name": "Metformin 500mg",
                "time": "08:00 AM",
                "period": "Morning",
                "status": "taken",
                "disease": "Diabetes"
            },
            {
                "med_name": "Amlodipine",
                "name": "Amlodipine 5mg",
                "time": "08:00 AM",
                "period": "Morning",
                "status": "taken",
                "disease": "Blood Pressure"
            },
            {
                "med_name": "Levothyroxine",
                "name": "Levothyroxine 50mcg",
                "time": "08:30 AM",
                "period": "Morning",
                "status": "taken",
                "disease": "Thyroid"
            },
            {
                "med_name": "Amoxicillin",
                "name": "Amoxicillin 250mg",
                "time": "01:30 PM",
                "period": "Afternoon",
                "status": "pending",
                "disease": "Antibiotics"
            },
            {
                "med_name": "Metformin",
                "name": "Metformin 500mg",
                "time": "09:00 PM",
                "period": "Night",
                "status": "pending",
                "disease": "Diabetes"
            },
            {
                "med_name": "Atorvastatin",
                "name": "Atorvastatin 20mg",
                "time": "09:30 PM",
                "period": "Night",
                "status": "pending",
                "disease": "Heart"
            }
        ]

        for r_data in reminder_records:
            med_obj = Medication.objects.filter(name=r_data["med_name"]).first()
            Reminder.objects.get_or_create(
                name=r_data["name"],
                time=r_data["time"],
                defaults={
                    "medication": med_obj,
                    "period": r_data["period"],
                    "status": r_data["status"],
                    "disease": r_data["disease"]
                }
            )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
