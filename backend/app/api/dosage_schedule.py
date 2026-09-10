from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.rbac import patient_only
from app.db.session import get_db
from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.models.user import User
from app.schemas.dosage_schedule import (
    DosageScheduleCreate,
    DosageScheduleResponse,
    DosageScheduleUpdate,
)


router = APIRouter(
    prefix="/dosage-schedules",
    tags=["Dosage Scheduling"],
)


def get_patient_medicine(
    medicine_id: int,
    user: User,
    db: Session,
) -> Medicine:
    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id,
            Medicine.patient_id == user.id,
        )
        .first()
    )

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    return medicine


def get_patient_schedule(
    schedule_id: int,
    user: User,
    db: Session,
) -> DosageSchedule:
    schedule = (
        db.query(DosageSchedule)
        .join(
            Medicine,
            DosageSchedule.medicine_id == Medicine.id,
        )
        .filter(
            DosageSchedule.id == schedule_id,
            Medicine.patient_id == user.id,
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosage schedule not found",
        )

    return schedule


@router.post(
    "",
    response_model=DosageScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_dosage_schedule(
    schedule_data: DosageScheduleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_only(user)

    get_patient_medicine(
        schedule_data.medicine_id,
        user,
        db,
    )

    schedule = DosageSchedule(
        medicine_id=schedule_data.medicine_id,
        dosage_amount=schedule_data.dosage_amount,
        time_of_day=schedule_data.time_of_day,
        frequency=schedule_data.frequency,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


@router.get(
    "",
    response_model=list[DosageScheduleResponse],
)
def get_dosage_schedules(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_only(user)

    schedules = (
        db.query(DosageSchedule)
        .join(
            Medicine,
            DosageSchedule.medicine_id == Medicine.id,
        )
        .filter(Medicine.patient_id == user.id)
        .order_by(DosageSchedule.time_of_day)
        .all()
    )

    return schedules


@router.get(
    "/{schedule_id}",
    response_model=DosageScheduleResponse,
)
def get_dosage_schedule(
    schedule_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_only(user)

    return get_patient_schedule(
        schedule_id,
        user,
        db,
    )


@router.put(
    "/{schedule_id}",
    response_model=DosageScheduleResponse,
)
def update_dosage_schedule(
    schedule_id: int,
    schedule_data: DosageScheduleUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_only(user)

    schedule = get_patient_schedule(
        schedule_id,
        user,
        db,
    )

    update_data = schedule_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_dosage_schedule(
    schedule_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_only(user)

    schedule = get_patient_schedule(
        schedule_id,
        user,
        db,
    )

    db.delete(schedule)
    db.commit()

    return None