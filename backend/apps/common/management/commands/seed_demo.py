"""Fill a development or demo database with a believable month of use.

    python manage.py seed_demo            # create the demo accounts and history
    python manage.py seed_demo --reset    # delete them first, then recreate

The demo has to show the milestone 3 and 4 features working on real-looking
data: adherence with a visible habit (the evening dose is the one that slips), a
medicine about to run out, another that is fine, a caregiver looking after two
patients of very different reliability, and an administrator. The history is
generated from a fixed random seed, so every run - and every screenshot in the
documentation - is the same.

It refuses to run with DEBUG off unless --force is given: seeding invented
patients into a database that holds real ones would be a serious mistake.
"""

from __future__ import annotations

import random
import secrets
from datetime import date, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import CaregiverAssignment, User
from apps.common.choices import AssignmentStatus, DoseSlot, DoseStatus, UserRole
from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import CaregiverProfile, PatientProfile
from apps.refills.services import stock
from apps.reminders.models import DoseEvent
from apps.reminders.services.generation import generate_for_medicine, scheduled_datetime

DEMO_DOMAIN = "pillsync.example"
HISTORY_DAYS = 45
RANDOM_SEED = 20260930

ACCOUNTS = {
    "patient": ("asha.rao", "Asha Rao", UserRole.PATIENT),
    "second": ("ravi.kumar", "Ravi Kumar", UserRole.PATIENT),
    "caregiver": ("meera.rao", "Meera Rao", UserRole.CAREGIVER),
    "admin": ("admin.demo", "Demo Administrator", UserRole.ADMIN),
}

#: (name, brand, strength, unit, category, slot, per_dose, miss chance, stock left)
#: The miss chance is what gives each medicine a personality: the evening statin
#: is the one that gets forgotten, the morning tablet almost never.
ASHA_MEDICINES = [
    ("Metformin", "Glycomet", "500", "mg", "DIABETES", DoseSlot.MORNING, "1", 0.04, "62"),
    ("Metformin", "Glycomet", "500", "mg", "DIABETES", DoseSlot.EVENING, "1", 0.12, None),
    ("Amlodipine", "Amlong", "5", "mg", "HYPERTENSION", DoseSlot.MORNING, "1", 0.05, "4"),
    ("Atorvastatin", "Atorva", "10", "mg", "CARDIOVASCULAR", DoseSlot.NIGHT, "1", 0.38, "40"),
]
RAVI_MEDICINES = [
    ("Losartan", "Repace", "50", "mg", "HYPERTENSION", DoseSlot.MORNING, "1", 0.55, "24"),
    ("Glimepiride", "Amaryl", "2", "mg", "DIABETES", DoseSlot.MORNING, "1", 0.60, "3"),
]


def _email(local: str) -> str:
    return f"{local}@{DEMO_DOMAIN}"


class Command(BaseCommand):
    help = "Create demo accounts with a month of dose history (development only)."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--reset", action="store_true", help="Delete the demo accounts first.")
        parser.add_argument("--force", action="store_true", help="Allow running with DEBUG off.")
        parser.add_argument(
            "--extra-patients",
            type=int,
            default=0,
            help="Also generate this many synthetic patients with history, for load testing. "
            "They have no usable password.",
        )
        parser.add_argument(
            "--password",
            default=None,
            help="Password for every demo account. A random one is generated if omitted.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                "Refusing to seed demo data with DEBUG off - this would put invented patients "
                "in a real database. Pass --force if this really is a demo deployment."
            )

        emails = [_email(local) for local, _n, _r in ACCOUNTS.values()]
        if options["reset"]:
            deleted, _ = User.objects.filter(email__in=emails).delete()
            self.stdout.write(f"Removed {deleted} existing demo records.")
        elif User.objects.filter(email__in=emails).exists():
            raise CommandError("Demo accounts already exist. Use --reset to recreate them.")

        password = options["password"] or secrets.token_urlsafe(12)
        with transaction.atomic():
            users = self._create_users(password)
            self._create_caregiving(users)
            rng = random.Random(RANDOM_SEED)
            self._history(users["patient"], ASHA_MEDICINES, rng)
            self._history(users["second"], RAVI_MEDICINES, rng)
            if options["extra_patients"]:
                self._bulk(options["extra_patients"], rng)

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write("")
        for local, name, role in ACCOUNTS.values():
            self.stdout.write(f"  {role.label:<10} {_email(local)}   ({name})")
        self.stdout.write(f"  Password for all of them: {password}")

    # -- accounts -------------------------------------------------------------

    def _create_users(self, password: str) -> dict[str, User]:
        users = {}
        for key, (local, name, role) in ACCOUNTS.items():
            user = User.objects.create_user(
                email=_email(local),
                password=password,
                full_name=name,
                role=role,
                is_staff=role == UserRole.ADMIN,
            )
            if role == UserRole.PATIENT:
                PatientProfile.objects.create(
                    user=user, managed_by=user, full_name=name, is_self=True
                )
            elif role == UserRole.CAREGIVER:
                CaregiverProfile.objects.create(user=user)
            users[key] = user
        return users

    def _create_caregiving(self, users: dict[str, User]) -> None:
        for key in ("patient", "second"):
            CaregiverAssignment.objects.create(
                caregiver=users["caregiver"],
                patient=users[key],
                status=AssignmentStatus.ACTIVE,
                invited_by=users[key],
            )

    # -- load-test population -------------------------------------------------

    def _bulk(self, count: int, rng: random.Random) -> None:
        """Synthetic patients for measuring performance against a realistic database.

        They cannot sign in (no usable password) and exist only to give the
        platform-wide queries something to chew on.
        """
        catalogue = [*ASHA_MEDICINES, *RAVI_MEDICINES]
        for i in range(count):
            user = User.objects.create_user(
                email=_email(f"load.patient.{i:04d}"),
                password=None,
                full_name=f"Load Patient {i:04d}",
            )
            PatientProfile.objects.create(
                user=user, managed_by=user, full_name=user.full_name, is_self=True
            )
            picks = rng.sample(catalogue, rng.randint(2, 4))
            # Vary behaviour so the adherence spread is not identical for everyone.
            plan = [(*m[:7], min(0.7, m[7] * rng.uniform(0.3, 1.5)), "40") for m in picks]
            self._history(user, plan, rng)
        self.stdout.write(f"  plus {count} synthetic load-test patients")

    # -- history --------------------------------------------------------------

    def _history(self, user: User, plan: list[tuple], rng: random.Random) -> None:
        profile = user.patient_profile
        today = timezone.localdate()
        start = today - timedelta(days=HISTORY_DAYS)
        made: dict[tuple, Medicine] = {}

        for name, brand, strength, unit, category, slot, per_dose, miss, left in plan:
            key = (name, strength)
            medicine = made.get(key)
            if medicine is None:
                medicine = Medicine.objects.create(
                    patient=profile,
                    name=name,
                    brand_name=brand,
                    strength=strength,
                    strength_unit=unit,
                    dosage_form="Tablet",
                    category=category,
                    quantity_remaining=Decimal(left or "0"),
                    quantity_per_refill=Decimal("60"),
                    start_date=start,
                )
                made[key] = medicine
            elif left:
                medicine.quantity_remaining = Decimal(left)
                medicine.save(update_fields=["quantity_remaining", "updated_at"])

            schedule = MedicationSchedule.objects.create(
                medicine=medicine,
                slot=slot,
                time_of_day={
                    DoseSlot.MORNING: time(8, 0),
                    DoseSlot.AFTERNOON: time(13, 0),
                    DoseSlot.EVENING: time(18, 0),
                    DoseSlot.NIGHT: time(21, 0),
                }[slot],
                quantity_per_dose=Decimal(per_dose),
                start_date=start,
            )
            self._past_doses(schedule, start, today, miss, rng)

        for medicine in made.values():
            # Stock as it stands today - the history above must not drain it,
            # or the demo's low-stock story would depend on the random draw.
            stock.record_initial(medicine, profile.user)
            generate_for_medicine(medicine)
            from apps.refills.services import alerts

            alerts.after_stock_change(medicine, notify=False)

    def _past_doses(self, schedule, start: date, today: date, miss_chance: float, rng) -> None:
        """One dose a day, with a chance of a miss that eases off over the month.

        The miss chance shrinks a little each week so the trend line shows
        improvement - a flat line would demonstrate nothing.
        """
        rows = []
        day = start
        span = max(1, (today - start).days)
        while day < today:
            when = scheduled_datetime(schedule, day)
            progress = (day - start).days / span
            chance = miss_chance * (1.3 - 0.6 * progress)
            missed = rng.random() < chance
            delay = timedelta(minutes=rng.randint(0, 40))
            rows.append(
                DoseEvent(
                    schedule=schedule,
                    medicine=schedule.medicine,
                    patient=schedule.medicine.patient,
                    scheduled_for=when,
                    slot=schedule.slot,
                    quantity_expected=schedule.quantity_per_dose,
                    status=DoseStatus.MISSED if missed else DoseStatus.TAKEN,
                    responded_at=None if missed else when + delay,
                    quantity_taken=None if missed else schedule.quantity_per_dose,
                )
            )
            day += timedelta(days=1)
        DoseEvent.objects.bulk_create(rows, ignore_conflicts=True)
