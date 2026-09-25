from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.medication_history import MedicationHistory
from app.models.user import User
from app.schemas.medication_history import MedicationHistoryResponse


router = APIRouter(
    prefix="/medication-history",
    tags=["Medication History"],
)


def get_patient_history(
    history_id: int,
    user_id: int,
    db: Session,
) -> MedicationHistory:
    history = (
        db.query(MedicationHistory)
        .filter(
            MedicationHistory.id == history_id,
            MedicationHistory.patient_id == user_id,
        )
        .first()
    )

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication history not found",
        )

    return history


@router.get(
    "",
    response_model=list[MedicationHistoryResponse],
)
def list_medication_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history = (
        db.query(MedicationHistory)
        .filter(
            MedicationHistory.patient_id == current_user.id,
        )
        .order_by(
            MedicationHistory.scheduled_time.desc(),
        )
        .all()
    )

    return history


@router.get(
    "/{history_id}",
    response_model=MedicationHistoryResponse,
)
def get_medication_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_patient_history(
        history_id,
        current_user.id,
        db,
    )
