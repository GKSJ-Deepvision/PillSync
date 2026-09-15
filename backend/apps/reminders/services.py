"""Business logic for reminders + reminder actions, kept out of routes.py so
`routes.py` stays a thin HTTP layer and this can be reused (e.g. by a future
notification dispatcher) without importing FastAPI.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.adherence.models import AdherenceLog
from apps.adherence.schemas import ReminderAction, status_for_action
from apps.common.enums import AdherenceStatus
from apps.medications.models import Medicine
from apps.reminders.models import Reminder
from apps.reminders.scheduling import compute_next_occurrence
from apps.reminders.schemas import ReminderCreate, ReminderUpdate


class ReminderNotFoundError(Exception):
    pass


class MedicineNotFoundError(Exception):
    """Raised when `medicine_id` doesn't exist, or doesn't belong to `user_id`."""


async def _get_owned_medicine(
    db: AsyncSession, medicine_id: uuid.UUID, user_id: uuid.UUID
) -> Medicine:
    result = await db.execute(
        select(Medicine).where(Medicine.id == medicine_id, Medicine.user_id == user_id)
    )
    medicine = result.scalar_one_or_none()
    if medicine is None:
        raise MedicineNotFoundError(f"Medicine {medicine_id} not found for user {user_id}.")
    return medicine


async def create_reminders(db: AsyncSession, payload: ReminderCreate) -> list[Reminder]:
    """Creates one `Reminder` row per entry in `payload.times`."""

    await _get_owned_medicine(db, payload.medicine_id, payload.user_id)

    reminders = [
        Reminder(
            medicine_id=payload.medicine_id,
            user_id=payload.user_id,
            scheduled_time=scheduled_time,
            frequency=payload.frequency,
            day_of_week=payload.day_of_week,
            interval_days=payload.interval_days,
        )
        for scheduled_time in payload.times
    ]
    db.add_all(reminders)
    await db.flush()
    for reminder in reminders:
        await db.refresh(reminder)
    return reminders


async def list_reminders(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    medicine_id: uuid.UUID | None = None,
    is_active: bool | None = None,
) -> list[Reminder]:
    stmt = select(Reminder).where(Reminder.user_id == user_id)
    if medicine_id is not None:
        stmt = stmt.where(Reminder.medicine_id == medicine_id)
    if is_active is not None:
        stmt = stmt.where(Reminder.is_active == is_active)
    stmt = stmt.order_by(Reminder.scheduled_time)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_reminder(db: AsyncSession, reminder_id: uuid.UUID) -> Reminder:
    reminder = await db.get(Reminder, reminder_id)
    if reminder is None:
        raise ReminderNotFoundError(f"Reminder {reminder_id} not found.")
    return reminder


async def update_reminder(
    db: AsyncSession, reminder_id: uuid.UUID, payload: ReminderUpdate
) -> Reminder:
    reminder = await get_reminder(db, reminder_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(reminder, field, value)
    await db.flush()
    await db.refresh(reminder)
    return reminder


async def deactivate_reminder(db: AsyncSession, reminder_id: uuid.UUID) -> Reminder:
    reminder = await get_reminder(db, reminder_id)
    reminder.is_active = False
    await db.flush()
    await db.refresh(reminder)
    return reminder


async def apply_reminder_action(
    db: AsyncSession,
    reminder_id: uuid.UUID,
    action: ReminderAction,
    snooze_minutes: int,
) -> tuple[Reminder, AdherenceLog]:
    """Logs a Taken / Missed / Snooze action against a reminder.

    Taken and Missed both clear any pending snooze — whatever happens next,
    the snooze that led here has been resolved. Snooze sets `snoozed_until`
    and leaves the reminder active so it fires again at that time.
    """

    reminder = await get_reminder(db, reminder_id)

    status: AdherenceStatus = status_for_action(action)
    log = AdherenceLog(reminder_id=reminder.id, user_id=reminder.user_id, status=status)
    db.add(log)

    if action == ReminderAction.SNOOZE:
        reminder.snoozed_until = datetime.now(UTC) + timedelta(minutes=snooze_minutes)
    else:
        reminder.snoozed_until = None

    await db.flush()
    await db.refresh(reminder)
    await db.refresh(log)
    return reminder, log


def next_occurrence_for(reminder: Reminder, *, now: datetime | None = None) -> datetime | None:
    return compute_next_occurrence(
        frequency=reminder.frequency,
        scheduled_time=reminder.scheduled_time,
        is_active=reminder.is_active,
        created_at=reminder.created_at,
        day_of_week=reminder.day_of_week,
        interval_days=reminder.interval_days,
        snoozed_until=reminder.snoozed_until,
        now=now,
    )
