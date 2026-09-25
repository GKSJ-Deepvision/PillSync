from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.models.reminder import Reminder
from app.schemas.reminder import (
    ReminderCreate,
    ReminderResponse,
    ReminderUpdate,
)

router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"],
)


def get_patient_schedule(
    schedule_id: int,
    user_id: int,
    db: Session,
) -> DosageSchedule:
    schedule = (
        db.query(DosageSchedule)
        .join(
            Medicine,
            DosageSchedule.medicine_id == Medicine.id,
        )
        .filter(
            DosageSchedule.id == schedule_id,
            Medicine.patient_id == user_id,
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosage schedule not found",
        )

    return schedule


def get_patient_reminder(
    reminder_id: int,
    user_id: int,
    db: Session,
) -> Reminder:
    reminder = (
        db.query(Reminder)
        .join(
            DosageSchedule,
            Reminder.dosage_schedule_id == DosageSchedule.id,
        )
        .join(
            Medicine,
            DosageSchedule.medicine_id == Medicine.id,
        )
        .filter(
            Reminder.id == reminder_id,
            Medicine.patient_id == user_id,
        )
        .first()
    )

    if reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )

    return reminder


@router.post(
    "",
    response_model=ReminderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_patient_schedule(
        reminder_data.dosage_schedule_id,
        current_user.id,
        db,
    )

    reminder = Reminder(
        dosage_schedule_id=reminder_data.dosage_schedule_id,
        scheduled_at=reminder_data.scheduled_at,
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder


@router.get(
    "",
    response_model=list[ReminderResponse],
)
def list_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminders = (
        db.query(Reminder)
        .join(
            DosageSchedule,
            Reminder.dosage_schedule_id == DosageSchedule.id,
        )
        .join(
            Medicine,
            DosageSchedule.medicine_id == Medicine.id,
        )
        .filter(
            Medicine.patient_id == current_user.id,
        )
        .order_by(Reminder.scheduled_at)
        .all()
    )

    return reminders


@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse,
)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )


@router.put(
    "/{reminder_id}",
    response_model=ReminderResponse,
)
def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    if reminder_data.status is not None:
        allowed_statuses = {
            "pending",
            "taken",
            "missed",
            "snoozed",
        }

        if reminder_data.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Status must be one of: "
                    "pending, taken, missed, snoozed"
                ),
            )

        reminder.status = reminder_data.status

    if reminder_data.snoozed_until is not None:
        reminder.snoozed_until = reminder_data.snoozed_until

    db.commit()
    db.refresh(reminder)

    return reminder


@router.delete(
    "/{reminder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    db.delete(reminder)
    db.commit()

    return None