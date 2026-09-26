from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.dosage_schedule import DosageSchedule
from app.models.medication_history import MedicationHistory
from app.models.medicine import Medicine
from app.models.reminder import Reminder
from app.models.user import User
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
        .join(Medicine, DosageSchedule.medicine_id == Medicine.id)
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


def reminder_response_data(
    reminder: Reminder,
    db: Session,
) -> dict:
    schedule = (
        db.query(DosageSchedule).filter(DosageSchedule.id == reminder.dosage_schedule_id).first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosage schedule not found",
        )

    medicine = db.query(Medicine).filter(Medicine.id == schedule.medicine_id).first()

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return {
        "id": reminder.id,
        "dosage_schedule_id": reminder.dosage_schedule_id,
        "medicine_name": medicine.name,
        "medicine_dosage": medicine.dosage,
        "dosage_amount": schedule.dosage_amount,
        "time_of_day": schedule.time_of_day,
        "frequency": schedule.frequency,
        "scheduled_at": reminder.scheduled_at,
        "status": reminder.status,
        "snoozed_until": reminder.snoozed_until,
        "action_at": reminder.action_at,
        "created_at": reminder.created_at,
    }


def get_schedule_and_medicine(
    reminder: Reminder,
    db: Session,
) -> tuple[DosageSchedule, Medicine]:
    schedule = (
        db.query(DosageSchedule).filter(DosageSchedule.id == reminder.dosage_schedule_id).first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosage schedule not found",
        )

    medicine = db.query(Medicine).filter(Medicine.id == schedule.medicine_id).first()

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return schedule, medicine


def consume_medicine_stock(
    reminder: Reminder,
    db: Session,
) -> None:
    """
    Decrease medicine stock when a reminder is marked as taken.

    Stock is consumed only once for a reminder.
    """

    # If this reminder was already taken, do not consume stock again.
    if reminder.status == "taken":
        return

    schedule, medicine = get_schedule_and_medicine(
        reminder=reminder,
        db=db,
    )

    dosage_amount = schedule.dosage_amount

    if dosage_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Dosage amount must be greater than zero",
        )

    if medicine.quantity < dosage_amount:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Insufficient medicine stock. "
                f"Available: {medicine.quantity}, "
                f"required: {dosage_amount}"
            ),
        )

    medicine.quantity -= dosage_amount


def create_medication_history(
    reminder: Reminder,
    user_id: int,
    status_value: str,
    db: Session,
) -> MedicationHistory:
    schedule = (
        db.query(DosageSchedule).filter(DosageSchedule.id == reminder.dosage_schedule_id).first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosage schedule not found",
        )

    history = MedicationHistory(
        patient_id=user_id,
        medicine_id=schedule.medicine_id,
        scheduled_time=reminder.scheduled_at,
        action_at=reminder.action_at,
        taken=status_value == "taken",
        status=status_value,
    )

    db.add(history)

    return history


@router.post(
    "",
    response_model=ReminderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_patient_schedule(
        reminder_data.dosage_schedule_id,
        current_user.id,
        db,
    )

    reminder = Reminder(
        dosage_schedule_id=reminder_data.dosage_schedule_id,
        scheduled_at=reminder_data.scheduled_at,
        status="pending",
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder_response_data(reminder, db)


@router.get(
    "",
    response_model=list[ReminderResponse],
)
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        .filter(Medicine.patient_id == current_user.id)
        .order_by(Reminder.scheduled_at)
        .all()
    )

    return [reminder_response_data(reminder, db) for reminder in reminders]


@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse,
)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    return reminder_response_data(reminder, db)


@router.put(
    "/{reminder_id}",
    response_model=ReminderResponse,
)
def update_reminder(
    reminder_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    allowed_statuses = {
        "pending",
        "taken",
        "missed",
        "snoozed",
    }

    if reminder_data.status is not None:
        if reminder_data.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid reminder status",
            )

        # Only consume stock when changing INTO taken.
        if reminder_data.status == "taken" and reminder.status != "taken":
            consume_medicine_stock(reminder, db)

        reminder.status = reminder_data.status

        if reminder_data.status in {
            "taken",
            "missed",
            "snoozed",
        }:
            reminder.action_at = datetime.utcnow()

            create_medication_history(
                reminder=reminder,
                user_id=current_user.id,
                status_value=reminder_data.status,
                db=db,
            )

    if reminder_data.snoozed_until is not None:
        reminder.snoozed_until = reminder_data.snoozed_until

    db.commit()
    db.refresh(reminder)

    return reminder_response_data(reminder, db)


@router.post(
    "/{reminder_id}/taken",
    response_model=ReminderResponse,
)
def mark_reminder_taken(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    # Prevent double consumption.
    if reminder.status == "taken":
        return reminder_response_data(reminder, db)

    consume_medicine_stock(reminder, db)

    reminder.status = "taken"
    reminder.action_at = datetime.utcnow()
    reminder.snoozed_until = None

    create_medication_history(
        reminder=reminder,
        user_id=current_user.id,
        status_value="taken",
        db=db,
    )

    db.commit()
    db.refresh(reminder)

    return reminder_response_data(reminder, db)


@router.post(
    "/{reminder_id}/missed",
    response_model=ReminderResponse,
)
def mark_reminder_missed(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    reminder.status = "missed"
    reminder.action_at = datetime.utcnow()
    reminder.snoozed_until = None

    create_medication_history(
        reminder=reminder,
        user_id=current_user.id,
        status_value="missed",
        db=db,
    )

    db.commit()
    db.refresh(reminder)

    return reminder_response_data(reminder, db)


@router.post(
    "/{reminder_id}/snooze",
    response_model=ReminderResponse,
)
def snooze_reminder(
    reminder_id: int,
    snoozed_until: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    if snoozed_until <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Snooze time must be in the future",
        )

    reminder.status = "snoozed"
    reminder.action_at = datetime.utcnow()
    reminder.snoozed_until = snoozed_until

    create_medication_history(
        reminder=reminder,
        user_id=current_user.id,
        status_value="snoozed",
        db=db,
    )

    db.commit()
    db.refresh(reminder)

    return reminder_response_data(reminder, db)


@router.delete(
    "/{reminder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = get_patient_reminder(
        reminder_id,
        current_user.id,
        db,
    )

    db.delete(reminder)
    db.commit()

    return None
