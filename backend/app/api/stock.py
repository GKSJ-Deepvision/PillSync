from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.user import User
from app.schemas.stock import StockResponse, StockUpdate

router = APIRouter(
    prefix="/medicines",
    tags=["Medicine Stock"],
)


@router.post(
    "/{medicine_id}/stock",
    response_model=StockResponse,
)
def add_medicine_stock(
    medicine_id: int,
    stock_data: StockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update medicine stock",
        )

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

    previous_quantity = medicine.quantity

    medicine.quantity += stock_data.quantity

    db.commit()
    db.refresh(medicine)

    return {
        "medicine_id": medicine.id,
        "medicine_name": medicine.name,
        "previous_quantity": previous_quantity,
        "added_quantity": stock_data.quantity,
        "current_quantity": medicine.quantity,
    }
