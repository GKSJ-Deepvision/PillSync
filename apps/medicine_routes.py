from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from apps.database import get_db
from apps.models import Medicine, User
from apps.schemas import MedicineCreate, MedicineOut
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