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
    data = medicine.model_dump()
    times_list = data.pop("times", [])
    times_str = ",".join(times_list) if times_list else None
    
    new_medicine = Medicine(**data, times=times_str, user_id=current_user.id)
    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)
    
    out_dict = new_medicine.__dict__.copy()
    out_dict["times"] = out_dict["times"].split(",") if out_dict.get("times") else []
    return out_dict

@router.get("/", response_model=List[MedicineOut])
def get_my_medicines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medicines = db.query(Medicine).filter(Medicine.user_id == current_user.id).all()
    results = []
    for m in medicines:
        out_dict = m.__dict__.copy()
        out_dict["times"] = out_dict["times"].split(",") if out_dict.get("times") else []
        results.append(out_dict)
    return results