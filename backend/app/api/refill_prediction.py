from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.models.user import User
from app.schemas.refill_prediction import RefillPredictionResponse
from app.services.notification_service import create_notification
from app.services.refill_prediction import calculate_refill_prediction


router = APIRouter(
    prefix="/refill-predictions",
    tags=["Refill Prediction"],
)


def get_patient_medicine(
    medicine_id: int,
    user_id: int,
    db: Session,
) -> Medicine:
    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.patient_id == user_id,
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return medicine


def get_prediction(
    medicine: Medicine,
    db: Session,
) -> dict:
    schedules = (
        db.query(DosageSchedule)
        .filter(
            DosageSchedule.medicine_id == medicine.id,
        )
        .all()
    )

    return calculate_refill_prediction(
        medicine=medicine,
        schedules=schedules,
    )


@router.get(
    "/{medicine_id}",
    response_model=RefillPredictionResponse,
)
def get_refill_prediction(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view refill predictions",
        )

    medicine = get_patient_medicine(
        medicine_id=medicine_id,
        user_id=current_user.id,
        db=db,
    )

    prediction = get_prediction(
        medicine=medicine,
        db=db,
    )

    return {
        "medicine_id": medicine.id,
        "medicine_name": medicine.name,
        **prediction,
    }


@router.post(
    "/{medicine_id}/notification",
)
def create_refill_notification(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create refill notifications",
        )

    medicine = get_patient_medicine(
        medicine_id=medicine_id,
        user_id=current_user.id,
        db=db,
    )

    prediction = get_prediction(
        medicine=medicine,
        db=db,
    )

    if not prediction["refill_required"]:
        return {
            "notification_created": False,
            "message": "Medicine does not currently require a refill",
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "current_stock": prediction["current_stock"],
            "estimated_days_remaining": prediction[
                "estimated_days_remaining"
            ],
        }

    notification = create_notification(
        db=db,
        patient_id=current_user.id,
        reminder_id=None,
        channel="push",
        title="Medicine Refill Reminder",
        message=(
            f"{medicine.name} is expected to run out in "
            f"{prediction['estimated_days_remaining']} days. "
            f"Please refill your medicine."
        ),
    )

    db.commit()
    db.refresh(notification)

    return {
        "notification_created": True,
        "notification_id": notification.id,
        "medicine_id": medicine.id,
        "medicine_name": medicine.name,
        "current_stock": prediction["current_stock"],
        "estimated_days_remaining": prediction[
            "estimated_days_remaining"
        ],
        "recommended_refill_date": prediction[
            "recommended_refill_date"
        ],
    }