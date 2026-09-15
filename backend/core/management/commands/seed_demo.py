from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from core.models import ActivityLog, Alert, AdherenceRecord, CaregiverPatient, Medication, Notification, Profile, Schedule


USERS = [
    ('patient@pillsync.com', 'John', 'Doe', 'patient', '+1 (555) 123-4567', date(1985, 6, 15), '123 Health Ave, San Francisco, CA 94102'),
    ('caregiver@pillsync.com', 'Sarah', 'Smith', 'caregiver', '+1 (555) 987-6543', date(1978, 4, 12), '456 Caring St, Oakland, CA 94612'),
    ('admin@pillsync.com', 'Admin', 'User', 'admin', '+1 (555) 555-5555', date(1990, 1, 1), '789 Admin Blvd, Silicon Valley, CA 94025'),
    ('alice.j@example.com', 'Alice', 'Johnson', 'patient', '+1 (555) 234-5678', date(1952, 11, 22), '456 Oak Lane, Oakland, CA 94612'),
    ('robert.chen@example.com', 'Robert', 'Chen', 'patient', '+1 (555) 345-6789', date(1968, 3, 30), '789 Pine Rd, San Jose, CA 95112'),
]


class Command(BaseCommand):
    help = 'Create the documented Milestone 1 demo users and health records.'

    def handle(self, *args, **options):
        profiles = {}
        for email, first, last, role, phone, dob, address in USERS:
            user, _ = User.objects.get_or_create(username=email, defaults={'email': email, 'first_name': first, 'last_name': last})
            user.email = email
            user.first_name = first
            user.last_name = last
            user.set_password('password123')
            user.save()
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.role = role
            profile.phone = phone
            profile.dob = dob
            profile.address = address
            profile.status = 'Active'
            profile.avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
            profile.save()
            profiles[email] = profile

        caregiver = profiles['caregiver@pillsync.com']
        for email in ('patient@pillsync.com', 'alice.j@example.com', 'robert.chen@example.com'):
            CaregiverPatient.objects.get_or_create(caregiver=caregiver, patient=profiles[email])

        medications = {
            'patient@pillsync.com': [
                ('Metformin', '500mg', 'Twice daily', '08:00 AM, 08:00 PM', 95),
                ('Lisinopril', '10mg', 'Once daily', '08:00 AM', 90),
                ('Atorvastatin', '20mg', 'Once daily (Night)', '09:00 PM', 85),
            ],
            'alice.j@example.com': [
                ('Albuterol Inhaler', '2 puffs', 'As needed', 'Every 6 hours', 65),
                ('Amlodipine', '5mg', 'Once daily', '09:00 AM', 80),
            ],
            'robert.chen@example.com': [('Levothyroxine', '100mcg', 'Once daily', '07:00 AM', 98)],
        }
        for email, definitions in medications.items():
            profile = profiles[email]
            for name, dosage, frequency, scheduled_time, compliance in definitions:
                medication, _ = Medication.objects.get_or_create(patient=profile, name=name, defaults={
                    'dosage': dosage, 'frequency': frequency, 'scheduled_time': scheduled_time, 'compliance': compliance,
                })
                medication.dosage = dosage
                medication.frequency = frequency
                medication.scheduled_time = scheduled_time
                medication.compliance = compliance
                medication.save()
                Schedule.objects.get_or_create(patient=profile, medication=medication, scheduled_for=timezone.now(), defaults={'status': 'Pending'})

        for email, alert_type, medication, severity in [
            ('alice.j@example.com', 'Missed Dose', 'Albuterol Inhaler (2 puffs)', 'high'),
            ('patient@pillsync.com', 'Upcoming Refill', 'Metformin 500mg (5 days left)', 'medium'),
            ('alice.j@example.com', 'Adherence Drop', 'Weekly Adherence < 70%', 'high'),
        ]:
            Alert.objects.get_or_create(patient=profiles[email], type=alert_type, defaults={'medication': medication, 'severity': severity})

        ActivityLog.objects.get_or_create(user=profiles['admin@pillsync.com'], action='Seeded Milestone 1 demo data')
        for title, message in [
            ('Medication Logged', 'You logged Metformin 500mg successfully.'),
            ('Refill Warning', 'Lisinopril is running low. 7 days remaining.'),
            ('Caregiver Update', 'Sarah Smith viewed your adherence report.'),
        ]:
            Notification.objects.get_or_create(patient=profiles['patient@pillsync.com'], title=title, defaults={'message': message})
        self.stdout.write(self.style.SUCCESS('Milestone 1 demo data is ready.'))
