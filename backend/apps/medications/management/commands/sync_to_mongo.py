from django.core.management.base import BaseCommand

from apps.medications.models import Medication
from apps.medications.serializers import MedicationSerializer
from apps.reminders.models import Reminder
from apps.reminders.serializers import ReminderSerializer
from config.mongo import get_mongo_db


class Command(BaseCommand):
    help = "Sync all local medications and reminders directly to MongoDB Atlas ('medicin' database)"

    def handle(self, *args, **options):
        self.stdout.write("Connecting to MongoDB Atlas ('medicin' database)...")
        try:
            db = get_mongo_db()
            # Sync medications
            meds = Medication.objects.all()
            med_count = 0
            for m in meds:
                data = MedicationSerializer(m).data
                db["developer"].update_one({"id": m.id}, {"$set": dict(data)}, upsert=True)
                db["medications"].update_one({"id": m.id}, {"$set": dict(data)}, upsert=True)
                med_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synced {med_count} medications to 'developer' & 'medications' collections in MongoDB."
                )
            )

            # Sync reminders
            reminders = Reminder.objects.all()
            rem_count = 0
            for r in reminders:
                data = ReminderSerializer(r).data
                db["reminders"].update_one({"id": r.id}, {"$set": dict(data)}, upsert=True)
                rem_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synced {rem_count} reminders to 'reminders' collection in MongoDB."
                )
            )

            # Sync users
            from django.contrib.auth.models import User

            from apps.accounts.serializers import UserSerializer

            users = User.objects.all()
            user_count = 0
            for u in users:
                u_data = UserSerializer(u).data
                db["users"].update_one({"id": u.id}, {"$set": dict(u_data)}, upsert=True)
                db["developer"].update_one(
                    {"user_id": u.id}, {"$set": {"type": "user", "user": dict(u_data)}}, upsert=True
                )
                user_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synced {user_count} users to 'users' & 'developer' collections in MongoDB."
                )
            )
        except Exception as err:
            self.stdout.write(self.style.ERROR(f"Failed to sync to MongoDB: {err}"))
