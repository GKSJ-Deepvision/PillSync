import os
import sys
from datetime import date, datetime, time, timedelta
from decimal import Decimal
import django

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.accounts.models import User, CaregiverAssignment
from apps.common.choices import (
    UserRole, CaregiverRelationship, AssignmentStatus, DoseSlot, 
    ScheduleFrequency, DoseStatus, MedicineCategory, Gender, BloodGroup,
    ConditionSeverity
)
from apps.profiles.models import PatientProfile, PatientCondition, EmergencyContact
from apps.medications.models import Medicine, MedicationSchedule
from apps.reminders.models import DoseEvent
from apps.common.models import MedicalCondition, MedicineReference
from django.utils import timezone

def seed():
    print("Clearing old demo data...")
    User.objects.filter(email__in=["patient@pillsync.com", "caregiver@pillsync.com", "admin@pillsync.com"]).delete()

    print("Creating Patient User...")
    patient_user = User.objects.create_user(
        email="patient@pillsync.com",
        password="Password123!",
        full_name="Aarthi Sharma",
        phone_number="+919876543210",
        role=UserRole.PATIENT,
        is_email_verified=True,
    )

    print("Creating Caregiver User...")
    caregiver_user = User.objects.create_user(
        email="caregiver@pillsync.com",
        password="Password123!",
        full_name="Pari Verma",
        phone_number="+919123456789",
        role=UserRole.CAREGIVER,
        is_email_verified=True,
    )

    print("Creating Admin Superuser...")
    admin_user = User.objects.create_superuser(
        email="admin@pillsync.com",
        password="AdminPass123!",
        full_name="System Administrator",
    )

    print("Creating Patient Profile...")
    patient_profile = PatientProfile.objects.create(
        user=patient_user,
        managed_by=patient_user,
        full_name="Aarthi Sharma",
        date_of_birth=date(1990, 5, 15),
        gender=Gender.FEMALE,
        blood_group=BloodGroup.O_POS,
        height_cm=165,
        weight_kg=Decimal("62.5"),
        allergies="Penicillin",
        notes="Managed well with daily regimen.",
    )

    print("Linking Caregiver...")
    CaregiverAssignment.objects.create(
        caregiver=caregiver_user,
        patient=patient_user,
        relationship=CaregiverRelationship.FAMILY,
        status=AssignmentStatus.ACTIVE,
        can_view_adherence=True,
        can_receive_alerts=True,
        can_manage_medications=True,
    )

    print("Adding Medical Conditions...")
    diabetes_cond, _ = MedicalCondition.objects.get_or_create(code="E11", defaults={"name": "Type 2 Diabetes Mellitus", "category": MedicineCategory.DIABETES})
    htn_cond, _ = MedicalCondition.objects.get_or_create(code="I10", defaults={"name": "Essential Hypertension", "category": MedicineCategory.BLOOD_PRESSURE})
    PatientCondition.objects.create(patient=patient_profile, condition=diabetes_cond, severity=ConditionSeverity.MODERATE)
    PatientCondition.objects.create(patient=patient_profile, condition=htn_cond, severity=ConditionSeverity.MILD)

    print("Adding Emergency Contact...")
    EmergencyContact.objects.create(
        patient=patient_profile,
        name="Pari Verma",
        relationship=CaregiverRelationship.FAMILY,
        phone_number="+919123456789",
        email="caregiver@pillsync.com",
        is_primary=True,
    )

    print("Creating Patient Medicines...")
    today = timezone.localdate()
    
    # 1. Metformin (Diabetes)
    metformin = Medicine.objects.create(
        patient=patient_profile,
        name="Metformin Hydrochloride",
        brand_name="Glucophage",
        dosage_form="Tablet",
        strength="500",
        strength_unit="mg",
        category=MedicineCategory.DIABETES,
        instructions="Take with breakfast and dinner",
        quantity_remaining=Decimal("36"),
        quantity_per_refill=Decimal("60"),
        low_stock_threshold=Decimal("10"),
        start_date=today - timedelta(days=30),
        is_active=True,
    )

    # 2. Lisinopril (Blood Pressure) - Low Stock!
    lisinopril = Medicine.objects.create(
        patient=patient_profile,
        name="Lisinopril",
        brand_name="Prinivil",
        dosage_form="Tablet",
        strength="10",
        strength_unit="mg",
        category=MedicineCategory.BLOOD_PRESSURE,
        instructions="Take 1 tablet every morning",
        quantity_remaining=Decimal("4"),  # Below threshold 10
        quantity_per_refill=Decimal("30"),
        low_stock_threshold=Decimal("10"),
        start_date=today - timedelta(days=26),
        is_active=True,
    )

    # 3. Atorvastatin (Heart)
    atorvastatin = Medicine.objects.create(
        patient=patient_profile,
        name="Atorvastatin Calcium",
        brand_name="Lipitor",
        dosage_form="Tablet",
        strength="20",
        strength_unit="mg",
        category=MedicineCategory.HEART,
        instructions="Take at bedtime",
        quantity_remaining=Decimal("45"),
        quantity_per_refill=Decimal("60"),
        low_stock_threshold=Decimal("10"),
        start_date=today - timedelta(days=15),
        is_active=True,
    )

    # 4. Amoxicillin (Antibiotics)
    amoxicillin = Medicine.objects.create(
        patient=patient_profile,
        name="Amoxicillin",
        brand_name="Amoxil",
        dosage_form="Capsule",
        strength="500",
        strength_unit="mg",
        category=MedicineCategory.ANTIBIOTICS,
        instructions="Take after lunch for 7 days",
        quantity_remaining=Decimal("14"),
        quantity_per_refill=Decimal("21"),
        low_stock_threshold=Decimal("5"),
        start_date=today - timedelta(days=3),
        end_date=today + timedelta(days=4),
        is_active=True,
    )

    print("Creating Medication Schedules...")
    # Metformin morning & night
    sched_met_morn = MedicationSchedule.objects.create(
        medicine=metformin,
        slot=DoseSlot.MORNING,
        time_of_day=time(8, 0),
        quantity_per_dose=Decimal("1"),
        frequency=ScheduleFrequency.DAILY,
        is_active=True,
    )
    sched_met_night = MedicationSchedule.objects.create(
        medicine=metformin,
        slot=DoseSlot.NIGHT,
        time_of_day=time(20, 30),
        quantity_per_dose=Decimal("1"),
        frequency=ScheduleFrequency.DAILY,
        is_active=True,
    )

    # Lisinopril morning
    sched_lis = MedicationSchedule.objects.create(
        medicine=lisinopril,
        slot=DoseSlot.MORNING,
        time_of_day=time(8, 30),
        quantity_per_dose=Decimal("1"),
        frequency=ScheduleFrequency.DAILY,
        is_active=True,
    )

    # Atorvastatin night
    sched_ator = MedicationSchedule.objects.create(
        medicine=atorvastatin,
        slot=DoseSlot.NIGHT,
        time_of_day=time(21, 30),
        quantity_per_dose=Decimal("1"),
        frequency=ScheduleFrequency.DAILY,
        is_active=True,
    )

    # Amoxicillin afternoon
    sched_amox = MedicationSchedule.objects.create(
        medicine=amoxicillin,
        slot=DoseSlot.AFTERNOON,
        time_of_day=time(13, 0),
        quantity_per_dose=Decimal("1"),
        frequency=ScheduleFrequency.DAILY,
        is_active=True,
    )

    print("Creating Historical and Today's Dose Events...")
    tz = timezone.get_current_timezone()
    
    # Generate past 6 days history (High adherence ~90%)
    for day_offset in range(6, 0, -1):
        past_date = today - timedelta(days=day_offset)
        # Metformin morning
        DoseEvent.objects.create(
            schedule=sched_met_morn,
            medicine=metformin,
            patient=patient_profile,
            scheduled_for=timezone.make_aware(datetime.combine(past_date, time(8, 0)), tz),
            slot=DoseSlot.MORNING,
            quantity_expected=Decimal("1"),
            status=DoseStatus.TAKEN,
            responded_at=timezone.make_aware(datetime.combine(past_date, time(8, 5)), tz),
            quantity_taken=Decimal("1"),
        )
        # Metformin night
        DoseEvent.objects.create(
            schedule=sched_met_night,
            medicine=metformin,
            patient=patient_profile,
            scheduled_for=timezone.make_aware(datetime.combine(past_date, time(20, 30)), tz),
            slot=DoseSlot.NIGHT,
            quantity_expected=Decimal("1"),
            status=DoseStatus.TAKEN if day_offset != 2 else DoseStatus.MISSED,
            responded_at=timezone.make_aware(datetime.combine(past_date, time(20, 40)), tz) if day_offset != 2 else None,
            quantity_taken=Decimal("1") if day_offset != 2 else Decimal("0"),
        )
        # Lisinopril morning
        DoseEvent.objects.create(
            schedule=sched_lis,
            medicine=lisinopril,
            patient=patient_profile,
            scheduled_for=timezone.make_aware(datetime.combine(past_date, time(8, 30)), tz),
            slot=DoseSlot.MORNING,
            quantity_expected=Decimal("1"),
            status=DoseStatus.TAKEN,
            responded_at=timezone.make_aware(datetime.combine(past_date, time(8, 35)), tz),
            quantity_taken=Decimal("1"),
        )
        # Atorvastatin night
        DoseEvent.objects.create(
            schedule=sched_ator,
            medicine=atorvastatin,
            patient=patient_profile,
            scheduled_for=timezone.make_aware(datetime.combine(past_date, time(21, 30)), tz),
            slot=DoseSlot.NIGHT,
            quantity_expected=Decimal("1"),
            status=DoseStatus.TAKEN,
            responded_at=timezone.make_aware(datetime.combine(past_date, time(21, 35)), tz),
            quantity_taken=Decimal("1"),
        )

    # Today's doses
    # 1. Metformin morning (Taken)
    DoseEvent.objects.create(
        schedule=sched_met_morn,
        medicine=metformin,
        patient=patient_profile,
        scheduled_for=timezone.make_aware(datetime.combine(today, time(8, 0)), tz),
        slot=DoseSlot.MORNING,
        quantity_expected=Decimal("1"),
        status=DoseStatus.TAKEN,
        responded_at=timezone.make_aware(datetime.combine(today, time(8, 10)), tz),
        quantity_taken=Decimal("1"),
    )

    # 2. Lisinopril morning (Taken)
    DoseEvent.objects.create(
        schedule=sched_lis,
        medicine=lisinopril,
        patient=patient_profile,
        scheduled_for=timezone.make_aware(datetime.combine(today, time(8, 30)), tz),
        slot=DoseSlot.MORNING,
        quantity_expected=Decimal("1"),
        status=DoseStatus.TAKEN,
        responded_at=timezone.make_aware(datetime.combine(today, time(8, 32)), tz),
        quantity_taken=Decimal("1"),
    )

    # 3. Amoxicillin afternoon (Pending / Due)
    DoseEvent.objects.create(
        schedule=sched_amox,
        medicine=amoxicillin,
        patient=patient_profile,
        scheduled_for=timezone.make_aware(datetime.combine(today, time(13, 0)), tz),
        slot=DoseSlot.AFTERNOON,
        quantity_expected=Decimal("1"),
        status=DoseStatus.PENDING,
    )

    # 4. Metformin night (Pending)
    DoseEvent.objects.create(
        schedule=sched_met_night,
        medicine=metformin,
        patient=patient_profile,
        scheduled_for=timezone.make_aware(datetime.combine(today, time(20, 30)), tz),
        slot=DoseSlot.NIGHT,
        quantity_expected=Decimal("1"),
        status=DoseStatus.PENDING,
    )

    # 5. Atorvastatin night (Pending)
    DoseEvent.objects.create(
        schedule=sched_ator,
        medicine=atorvastatin,
        patient=patient_profile,
        scheduled_for=timezone.make_aware(datetime.combine(today, time(21, 30)), tz),
        slot=DoseSlot.NIGHT,
        quantity_expected=Decimal("1"),
        status=DoseStatus.PENDING,
    )

    print("[OK] Seed script successfully completed! Demo data created.")

if __name__ == "__main__":
    seed()
