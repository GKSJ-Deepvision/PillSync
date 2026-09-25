from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.models.notification import Notification
from app.models.reminder import Reminder
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.services.notification_service import create_notification

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def get_patient_reminder(
    reminder_id: int,
    user_id: int,
    db: Session,
):
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
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_notification_endpoint(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if notification_data.reminder_id is not None:
        get_patient_reminder(
            reminder_id=notification_data.reminder_id,
            user_id=current_user.id,
            db=db,
        )

    notification = create_notification(
        db=db,
        patient_id=current_user.id,
        reminder_id=notification_data.reminder_id,
        channel=notification_data.channel,
        title=notification_data.title,
        message=notification_data.message,
    )

    db.commit()
    db.refresh(notification)

    return notification


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.patient_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.patient_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return notification