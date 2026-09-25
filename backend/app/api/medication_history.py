from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.medicine import Medicine
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
):
    history = (
        db.query(
            MedicationHistory,
            Medicine.name.label("medicine_name"),
            Medicine.dosage.label("dosage"),
        )
        .join(
            Medicine,
            MedicationHistory.medicine_id == Medicine.id,
        )
        .filter(
            MedicationHistory.id == history_id,
            MedicationHistory.patient_id == user_id,
            Medicine.patient_id == user_id,
        )
        .first()
    )

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication history not found",
        )

    medication_history, medicine_name, dosage = history

    return {
        "id": medication_history.id,
        "patient_id": medication_history.patient_id,
        "medicine_id": medication_history.medicine_id,
        "medicine_name": medicine_name,
        "dosage": dosage,
        "scheduled_time": medication_history.scheduled_time,
        "action_at": medication_history.action_at,
        "taken": medication_history.taken,
        "status": medication_history.status,
        "created_at": medication_history.created_at,
    }


@router.get(
    "",
    response_model=list[MedicationHistoryResponse],
)
def list_medication_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history_records = (
        db.query(
            MedicationHistory,
            Medicine.name.label("medicine_name"),
            Medicine.dosage.label("dosage"),
        )
        .join(
            Medicine,
            MedicationHistory.medicine_id == Medicine.id,
        )
        .filter(
            MedicationHistory.patient_id == current_user.id,
            Medicine.patient_id == current_user.id,
        )
        .order_by(
            MedicationHistory.scheduled_time.desc(),
        )
        .all()
    )

    return [
        {
            "id": history.id,
            "patient_id": history.patient_id,
            "medicine_id": history.medicine_id,
            "medicine_name": medicine_name,
            "dosage": dosage,
            "scheduled_time": history.scheduled_time,
            "action_at": history.action_at,
            "taken": history.taken,
            "status": history.status,
            "created_at": history.created_at,
        }
        for history, medicine_name, dosage in history_records
    ]


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