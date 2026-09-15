"""Reminder scheduling + reminder-action endpoints.

No auth exists yet (Milestone 1 tracked it as not-started), so every endpoint
takes `user_id`/`medicine_id` explicitly rather than deriving them from a
token — the same unauthenticated, explicit-ID pattern implied by the rest of
this milestone's models. Wrapping these in real auth/RBAC is future work; see
the Milestone 2 report.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.adherence.schemas import AdherenceLogRead, ReminderActionCreate
from apps.reminders import services
from apps.reminders.models import Reminder
from apps.reminders.schemas import ReminderCreate, ReminderRead, ReminderUpdate
from apps.reminders.services import MedicineNotFoundError, ReminderNotFoundError
from config.database import get_db

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _to_read(reminder: Reminder) -> ReminderRead:
    read = ReminderRead.model_validate(reminder)
    read.next_occurrence = services.next_occurrence_for(reminder)
    return read


@router.post("", response_model=list[ReminderRead], status_code=status.HTTP_201_CREATED)
async def create_reminders(
    payload: ReminderCreate, db: AsyncSession = Depends(get_db)
) -> list[ReminderRead]:
    try:
        reminders = await services.create_reminders(db, payload)
    except MedicineNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    await db.commit()
    return [_to_read(reminder) for reminder in reminders]


@router.get("", response_model=list[ReminderRead])
async def list_reminders(
    user_id: uuid.UUID = Query(
        ..., description="Required — reminders are always scoped to a user."
    ),
    medicine_id: uuid.UUID | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[ReminderRead]:
    reminders = await services.list_reminders(
        db, user_id=user_id, medicine_id=medicine_id, is_active=is_active
    )
    return [_to_read(reminder) for reminder in reminders]


@router.get("/{reminder_id}", response_model=ReminderRead)
async def get_reminder(reminder_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ReminderRead:
    try:
        reminder = await services.get_reminder(db, reminder_id)
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _to_read(reminder)


@router.patch("/{reminder_id}", response_model=ReminderRead)
async def update_reminder(
    reminder_id: uuid.UUID, payload: ReminderUpdate, db: AsyncSession = Depends(get_db)
) -> ReminderRead:
    try:
        reminder = await services.update_reminder(db, reminder_id, payload)
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    await db.commit()
    return _to_read(reminder)


@router.post("/{reminder_id}/deactivate", response_model=ReminderRead)
async def deactivate_reminder(
    reminder_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> ReminderRead:
    try:
        reminder = await services.deactivate_reminder(db, reminder_id)
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    await db.commit()
    return _to_read(reminder)


@router.post(
    "/{reminder_id}/actions", response_model=AdherenceLogRead, status_code=status.HTTP_201_CREATED
)
async def create_reminder_action(
    reminder_id: uuid.UUID, payload: ReminderActionCreate, db: AsyncSession = Depends(get_db)
) -> AdherenceLogRead:
    """Marks a reminder Taken, Missed, or Snoozed.

    Every call creates a new `AdherenceLog` row (it's an event log, not a
    status field), and — for Snooze — also updates the reminder's
    `snoozed_until` so `GET /reminders/{id}` reflects it immediately.
    """

    try:
        _, log = await services.apply_reminder_action(
            db, reminder_id, payload.action, payload.snooze_minutes
        )
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    await db.commit()
    return AdherenceLogRead.model_validate(log)
