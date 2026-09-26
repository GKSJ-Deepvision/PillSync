from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.medication_history import MedicationHistory
from app.models.user import User
from app.schemas.adherence import (
    AdherenceResponse,
    AdherenceTrendResponse,
    DailyAdherenceResponse,
)
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
    "/adherence",
    response_model=AdherenceResponse,
)
def get_adherence_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history_records = (
        db.query(MedicationHistory)
        .join(
            Medicine,
            MedicationHistory.medicine_id == Medicine.id,
        )
        .filter(
            MedicationHistory.patient_id == current_user.id,
            Medicine.patient_id == current_user.id,
        )
        .all()
    )

    total_doses = len(history_records)

    taken_doses = sum(
        1
        for history in history_records
        if history.status == "taken"
    )

    missed_doses = sum(
        1
        for history in history_records
        if history.status == "missed"
    )

    snoozed_doses = sum(
        1
        for history in history_records
        if history.status == "snoozed"
    )

    if total_doses == 0:
        adherence_percentage = 0.0
    else:
        adherence_percentage = round(
            (taken_doses / total_doses) * 100,
            2,
        )

    return {
        "total_doses": total_doses,
        "taken_doses": taken_doses,
        "missed_doses": missed_doses,
        "snoozed_doses": snoozed_doses,
        "adherence_percentage": adherence_percentage,
    }


def build_daily_adherence(
    history_records: list[MedicationHistory],
    start_date: date,
    end_date: date,
) -> list[DailyAdherenceResponse]:
    daily_data = {}

    current_date = start_date

    while current_date <= end_date:
        daily_data[current_date] = {
            "date": current_date,
            "total_doses": 0,
            "taken_doses": 0,
            "missed_doses": 0,
            "snoozed_doses": 0,
        }

        current_date += timedelta(days=1)

    for history in history_records:
        scheduled_date = history.scheduled_time.date()

        if scheduled_date < start_date or scheduled_date > end_date:
            continue

        daily_data[scheduled_date]["total_doses"] += 1

        if history.status == "taken":
            daily_data[scheduled_date]["taken_doses"] += 1
        elif history.status == "missed":
            daily_data[scheduled_date]["missed_doses"] += 1
        elif history.status == "snoozed":
            daily_data[scheduled_date]["snoozed_doses"] += 1

    daily_history = []

    for current_date in sorted(daily_data):
        data = daily_data[current_date]

        if data["total_doses"] == 0:
            adherence_percentage = 0.0
        else:
            adherence_percentage = round(
                (
                    data["taken_doses"]
                    / data["total_doses"]
                )
                * 100,
                2,
            )

        daily_history.append(
            DailyAdherenceResponse(
                date=data["date"],
                total_doses=data["total_doses"],
                taken_doses=data["taken_doses"],
                missed_doses=data["missed_doses"],
                snoozed_doses=data["snoozed_doses"],
                adherence_percentage=adherence_percentage,
            )
        )

    return daily_history


@router.get(
    "/adherence/daily",
    response_model=list[DailyAdherenceResponse],
)
def get_daily_adherence(
    days: int = Query(
        default=7,
        ge=1,
        le=90,
        description="Number of days to include.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    history_records = (
        db.query(MedicationHistory)
        .join(
            Medicine,
            MedicationHistory.medicine_id == Medicine.id,
        )
        .filter(
            MedicationHistory.patient_id == current_user.id,
            Medicine.patient_id == current_user.id,
            MedicationHistory.scheduled_time >= datetime.combine(
                start_date,
                time.min,
            ),
            MedicationHistory.scheduled_time <= datetime.combine(
                end_date,
                time.max,
            ),
        )
        .all()
    )

    return build_daily_adherence(
        history_records,
        start_date,
        end_date,
    )


@router.get(
    "/adherence/trend",
    response_model=AdherenceTrendResponse,
)
def get_adherence_trend(
    days: int = Query(
        default=7,
        ge=1,
        le=90,
        description="Number of days to include.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    history_records = (
        db.query(MedicationHistory)
        .join(
            Medicine,
            MedicationHistory.medicine_id == Medicine.id,
        )
        .filter(
            MedicationHistory.patient_id == current_user.id,
            Medicine.patient_id == current_user.id,
            MedicationHistory.scheduled_time >= datetime.combine(
                start_date,
                time.min,
            ),
            MedicationHistory.scheduled_time <= datetime.combine(
                end_date,
                time.max,
            ),
        )
        .all()
    )

    daily_history = build_daily_adherence(
        history_records,
        start_date,
        end_date,
    )

    days_with_doses = [
        day
        for day in daily_history
        if day.total_doses > 0
    ]

    if not days_with_doses:
        average_adherence_percentage = 0.0
    else:
        average_adherence_percentage = round(
            sum(
                day.adherence_percentage
                for day in days_with_doses
            )
            / len(days_with_doses),
            2,
        )

    return AdherenceTrendResponse(
        period_days=days,
        average_adherence_percentage=average_adherence_percentage,
        daily_history=daily_history,
    )


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