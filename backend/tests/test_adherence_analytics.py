from datetime import datetime, timedelta

from app.api.medication_history import build_daily_adherence
from app.models.medication_history import MedicationHistory


def create_history(
    day,
    status,
    history_id,
):
    return MedicationHistory(
        id=history_id,
        patient_id=1,
        medicine_id=1,
        scheduled_time=datetime.combine(
            day,
            datetime.min.time(),
        ),
        action_at=None,
        taken=status == "taken",
        status=status,
    )


def test_build_daily_adherence():
    start_date = datetime(2026, 9, 20).date()
    end_date = start_date + timedelta(days=2)

    history_records = [
        create_history(start_date, "taken", 1),
        create_history(start_date, "taken", 2),
        create_history(start_date, "missed", 3),
        create_history(
            start_date + timedelta(days=1),
            "taken",
            4,
        ),
        create_history(
            start_date + timedelta(days=1),
            "missed",
            5,
        ),
        create_history(
            start_date + timedelta(days=1),
            "snoozed",
            6,
        ),
    ]

    result = build_daily_adherence(
        history_records,
        start_date,
        end_date,
    )

    assert len(result) == 3

    assert result[0].total_doses == 3
    assert result[0].taken_doses == 2
    assert result[0].missed_doses == 1
    assert result[0].snoozed_doses == 0
    assert result[0].adherence_percentage == 66.67

    assert result[1].total_doses == 3
    assert result[1].taken_doses == 1
    assert result[1].missed_doses == 1
    assert result[1].snoozed_doses == 1
    assert result[1].adherence_percentage == 33.33

    assert result[2].total_doses == 0
    assert result[2].taken_doses == 0
    assert result[2].missed_doses == 0
    assert result[2].snoozed_doses == 0
    assert result[2].adherence_percentage == 0.0