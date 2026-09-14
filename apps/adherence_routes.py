from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from apps.database import get_db
from apps.models import Medicine, AdherenceLog, User
from apps.schemas import AdherenceLogCreate, AdherenceLogOut, AdherenceReportOut
from apps.dependencies import get_current_user

router = APIRouter(prefix="/adherence", tags=["Adherence"])

@router.get("/report", response_model=AdherenceReportOut)
def get_adherence_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all medicines belonging to the current user
    medicines = db.query(Medicine).filter(Medicine.user_id == current_user.id).all()
    total_medicines = len(medicines)

    if not medicines:
        return {
            "total_medicines": 0,
            "total_doses_logged": 0,
            "doses_taken": 0,
            "doses_missed": 0,
            "adherence_percentage": 0.0
        }

    medicine_ids = [m.id for m in medicines]
    logs = db.query(AdherenceLog).filter(AdherenceLog.medicine_id.in_(medicine_ids)).all()

    total_doses_logged = len(logs)
    doses_taken = sum(1 for log in logs if str(log.status).upper() == "TAKEN")
    doses_missed = total_doses_logged - doses_taken

    adherence_percentage = (
        round((doses_taken / total_doses_logged) * 100, 2)
        if total_doses_logged > 0
        else 0.0
    )

    return {
        "total_medicines": total_medicines,
        "total_doses_logged": total_doses_logged,
        "doses_taken": doses_taken,
        "doses_missed": doses_missed,
        "adherence_percentage": adherence_percentage
    }

@router.post("/", response_model=AdherenceLogOut, status_code=status.HTTP_201_CREATED)
def log_adherence(
    log_data: AdherenceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the medicine exists
    medicine = db.query(Medicine).filter(Medicine.id == log_data.medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Ensure strict authorization: user can only log adherence for their own medicines
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to log adherence for this medicine"
        )
    
    # Create the adherence log entry
    adherence_log = AdherenceLog(
        medicine_id=log_data.medicine_id,
        status=log_data.status.value if hasattr(log_data.status, "value") else str(log_data.status)
    )
    
    db.add(adherence_log)
    db.commit()
    db.refresh(adherence_log)
    return adherence_log

@router.get("/medicine/{medicine_id}", response_model=List[AdherenceLogOut])
def get_medicine_adherence_logs(
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
    
    # Ensure authorization
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view adherence for this medicine"
        )
    
    logs = db.query(AdherenceLog).filter(AdherenceLog.medicine_id == medicine_id).all()
    return logs
