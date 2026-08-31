"""Model-level unit tests: shapes, defaults, relationships, and FK cascades.

These run against a fresh in-memory SQLite database per test (see
`tests/conftest.py::db_session`) — fast, no external services required.
"""

from __future__ import annotations

import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from apps.accounts.models import CaregiverPatientMapping, User
from apps.adherence.models import AdherenceLog
from apps.common.enums import (
    AdherenceStatus,
    CaregiverAccessLevel,
    CaregiverMappingStatus,
    MedicineForm,
    ReminderFrequency,
    UserRole,
)
from apps.medications.models import Medicine
from apps.profiles.models import UserProfile
from apps.refills.models import RefillLog
from apps.reminders.models import Reminder

pytestmark = pytest.mark.unit


async def _make_user(db_session, *, email: str, role: UserRole = UserRole.PATIENT) -> User:
    user = User(
        email=email,
        hashed_password="not-a-real-hash",
        full_name="Test User",
        role=role,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def test_user_defaults(db_session):
    user = await _make_user(db_session, email="patient@example.com")

    assert user.id is not None
    assert user.role == UserRole.PATIENT
    assert user.is_active is True
    assert user.is_verified is False
    assert user.created_at is not None


async def test_user_email_is_unique(db_session):
    await _make_user(db_session, email="dupe@example.com")

    with pytest.raises(IntegrityError):
        await _make_user(db_session, email="dupe@example.com")


async def test_user_profile_one_to_one(db_session):
    user = await _make_user(db_session, email="profile-owner@example.com")

    profile = UserProfile(
        user_id=user.id,
        gender="female",
        emergency_contact="Jane Doe, +1-555-0100",
        timezone="Asia/Kolkata",
    )
    db_session.add(profile)
    await db_session.commit()

    result = await db_session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    fetched = result.scalar_one()
    assert fetched.timezone == "Asia/Kolkata"


async def test_caregiver_patient_mapping(db_session):
    caregiver = await _make_user(db_session, email="caregiver@example.com", role=UserRole.CAREGIVER)
    patient = await _make_user(db_session, email="patient2@example.com", role=UserRole.PATIENT)

    mapping = CaregiverPatientMapping(
        caregiver_id=caregiver.id,
        patient_id=patient.id,
        access_level=CaregiverAccessLevel.MANAGE_MEDICATIONS,
        status=CaregiverMappingStatus.PENDING,
    )
    db_session.add(mapping)
    await db_session.commit()
    await db_session.refresh(mapping)

    assert mapping.status == CaregiverMappingStatus.PENDING
    assert mapping.caregiver_id == caregiver.id
    assert mapping.patient_id == patient.id


async def test_medicine_stock_fields_and_defaults(db_session):
    user = await _make_user(db_session, email="med-owner@example.com")

    medicine = Medicine(
        user_id=user.id,
        name="Metformin",
        dosage="500mg",
        form=MedicineForm.TABLET,
        total_quantity=60,
        remaining_quantity=60,
        refill_threshold=10,
    )
    db_session.add(medicine)
    await db_session.commit()
    await db_session.refresh(medicine)

    assert medicine.is_active is True
    assert medicine.remaining_quantity == 60


async def test_reminder_and_adherence_log_chain(db_session):
    user = await _make_user(db_session, email="reminder-owner@example.com")
    medicine = Medicine(
        user_id=user.id, name="Amlodipine", dosage="5mg", total_quantity=30, remaining_quantity=30
    )
    db_session.add(medicine)
    await db_session.commit()
    await db_session.refresh(medicine)

    reminder = Reminder(
        medicine_id=medicine.id,
        user_id=user.id,
        scheduled_time=datetime.time(8, 0),
        frequency=ReminderFrequency.ONCE_DAILY,
    )
    db_session.add(reminder)
    await db_session.commit()
    await db_session.refresh(reminder)

    log = AdherenceLog(reminder_id=reminder.id, user_id=user.id, status=AdherenceStatus.TAKEN)
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    assert log.status == AdherenceStatus.TAKEN
    assert log.reminder_id == reminder.id


async def test_refill_log_linked_to_medicine(db_session):
    user = await _make_user(db_session, email="refill-owner@example.com")
    medicine = Medicine(
        user_id=user.id,
        name="Levothyroxine",
        dosage="50mcg",
        total_quantity=30,
        remaining_quantity=5,
    )
    db_session.add(medicine)
    await db_session.commit()
    await db_session.refresh(medicine)

    refill = RefillLog(
        medicine_id=medicine.id,
        quantity_added=30,
        estimated_depletion_date=datetime.date.today() + datetime.timedelta(days=30),
    )
    db_session.add(refill)
    await db_session.commit()
    await db_session.refresh(refill)

    assert refill.medicine_id == medicine.id
    assert refill.quantity_added == 30


async def test_deleting_user_cascades_to_medicines(db_session):
    user = await _make_user(db_session, email="cascade-owner@example.com")
    medicine = Medicine(
        user_id=user.id,
        name="Ibuprofen",
        dosage="200mg",
        total_quantity=20,
        remaining_quantity=20,
    )
    db_session.add(medicine)
    await db_session.commit()

    await db_session.delete(user)
    await db_session.commit()

    result = await db_session.execute(select(Medicine).where(Medicine.user_id == user.id))
    assert result.scalar_one_or_none() is None
