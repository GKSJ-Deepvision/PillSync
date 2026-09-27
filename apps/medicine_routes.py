from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from apps.database import get_db
from apps.models import Medicine, User
from apps.schemas import MedicineCreate, MedicineOut, RefillStatusResponse
from apps.dependencies import get_current_user

router = APIRouter(prefix="/medicines", tags=["Medicines"])

@router.post("/", response_model=MedicineOut, status_code=status.HTTP_201_CREATED)
def add_medicine(
    medicine: MedicineCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Automatically assign the logged-in user's ID to the medicine
    new_medicine = Medicine(**medicine.model_dump(), user_id=current_user.id)
    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)
    return new_medicine

@router.get("/", response_model=List[MedicineOut])
def get_my_medicines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicines = db.query(Medicine).filter(Medicine.user_id == current_user.id).all()
    return medicines

@router.get("/{medicine_id}/refill-status", response_model=RefillStatusResponse)
def get_medicine_refill_status(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the medicine exists
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )

    # Ensure authorization: user can only check refill status for their own medicines
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this medicine's refill status"
        )

    # Calculate days_remaining by dividing total_quantity by daily_frequency
    if medicine.daily_frequency and medicine.daily_frequency > 0:
        raw_days = medicine.total_quantity / medicine.daily_frequency
        days_remaining = int(raw_days) if raw_days.is_integer() else round(raw_days, 2)
    else:
        days_remaining = 0

    needs_refill = days_remaining <= 5

    return {
        "days_remaining": days_remaining,
        "needs_refill": needs_refill
    }