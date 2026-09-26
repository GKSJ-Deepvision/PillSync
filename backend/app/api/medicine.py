from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.user import User
from app.schemas.medicine import (
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)

router = APIRouter(
    prefix="/medicines",
    tags=["Medicine Management"],
)


def require_patient(current_user: User):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can manage medicines",
        )


@router.post(
    "",
    response_model=MedicineResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medicine(
    medicine_data: MedicineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient(current_user)

    medicine = Medicine(
        patient_id=current_user.id,
        name=medicine_data.name,
        dosage=medicine_data.dosage,
        quantity=medicine_data.quantity,
        frequency=medicine_data.frequency,
        start_date=medicine_data.start_date,
        end_date=medicine_data.end_date,
    )

    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    return medicine


@router.get(
    "",
    response_model=list[MedicineResponse],
)
def get_medicines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient(current_user)

    return db.query(Medicine).filter(Medicine.patient_id == current_user.id).all()


@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse,
)
def get_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient(current_user)

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.patient_id == current_user.id,
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return medicine


@router.put(
    "/{medicine_id}",
    response_model=MedicineResponse,
)
def update_medicine(
    medicine_id: int,
    medicine_data: MedicineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient(current_user)

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.patient_id == current_user.id,
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    update_data = medicine_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(medicine, field, value)

    db.commit()
    db.refresh(medicine)

    return medicine


@router.delete(
    "/{medicine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient(current_user)

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.patient_id == current_user.id,
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    db.delete(medicine)
    db.commit()

    return None
