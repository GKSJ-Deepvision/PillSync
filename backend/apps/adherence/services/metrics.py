import re
from datetime import date, datetime, timedelta

from django.db.models import Q
from django.utils import timezone

from apps.adherence.models import DoseEvent, DoseEventStatus
from apps.medications.models import MedicationSchedule

WEEKDAY_NAMES = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def _validate_date_range(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise ValueError("start_date must be on or before end_date")


def _date_range(start_date: date, end_date: date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def _parse_custom_weekdays(frequency: str) -> set[int]:
    """
    Supports custom schedules such as:
    'Monday, Wednesday, Friday'
    'Mon Wed Fri'
    """
    frequency = (frequency or "").lower()

    matched_days = set()

    for weekday_name, weekday_number in WEEKDAY_NAMES.items():
        if re.search(rf"\b{weekday_name[:3]}(?:day)?\b", frequency):
            matched_days.add(weekday_number)

    return matched_days


def is_schedule_due(
    schedule: MedicationSchedule,
    target_date: date,
) -> bool:
    """Return whether a medication schedule is due on target_date."""
    if not schedule.dosage.medicine.is_active:
        return False

    if target_date < schedule.start_date:
        return False

    if schedule.end_date and target_date > schedule.end_date:
        return False

    if schedule.repeat_rule == MedicationSchedule.RepeatRule.DAILY:
        return True

    if schedule.repeat_rule == MedicationSchedule.RepeatRule.WEEKLY:
        return target_date.weekday() == schedule.start_date.weekday()

    if schedule.repeat_rule == MedicationSchedule.RepeatRule.CUSTOM:
        weekdays = _parse_custom_weekdays(schedule.frequency)
        return target_date.weekday() in weekdays

    return False


def get_patient_schedules(patient, start_date: date, end_date: date):
    """Get active schedules belonging only to this patient."""
    _validate_date_range(start_date, end_date)

    return list(
        MedicationSchedule.objects.filter(
            dosage__medicine__patient=patient,
            dosage__medicine__is_active=True,
            start_date__lte=end_date,
        )
        .filter(Q(end_date__isnull=True) | Q(end_date__gte=start_date))
        .select_related("dosage__medicine")
        .order_by(
            "dosage__medicine__medicine_name",
            "scheduled_time",
            "id",
        )
    )


def get_dose_logs(
    schedules,
    start_date: date,
    end_date: date,
):
    """Load all logged dose events for the requested schedules/date range."""
    schedule_ids = [schedule.id for schedule in schedules]

    if not schedule_ids:
        return {}

    logs = DoseEvent.objects.filter(
        schedule_id__in=schedule_ids,
        dose_date__range=(start_date, end_date),
    )

    return {(log.schedule_id, log.dose_date): log for log in logs}


def _current_local_datetime() -> datetime:
    return timezone.localtime()


def _resolve_occurrence_status(
    schedule: MedicationSchedule,
    target_date: date,
    log,
    now: datetime,
) -> str:
    """
    Convert a logged/unlogged dose occurrence into the analytics status.

    A snoozed dose remains pending while snoozed_until is in the future.
    An unlogged dose becomes missed once its scheduled time has passed.
    """
    today = now.date()
    current_time = now.time()

    if log:
        if log.status == DoseEventStatus.TAKEN:
            return "TAKEN"

        if log.status == DoseEventStatus.MISSED:
            return "MISSED"

        if log.status == DoseEventStatus.SNOOZED:
            if log.snoozed_until and log.snoozed_until > now:
                return "PENDING"

            if target_date < today:
                return "MISSED"

            if target_date == today and schedule.scheduled_time <= current_time:
                return "MISSED"

            return "PENDING"

    if target_date < today:
        return "MISSED"

    if target_date == today:
        if schedule.scheduled_time <= current_time:
            return "MISSED"
        return "PENDING"

    return "PENDING"


def build_daily_history(
    patient,
    start_date: date,
    end_date: date,
):
    """
    Build one analytics record per calendar day.

    Only actual due schedule occurrences are counted.
    """
    _validate_date_range(start_date, end_date)

    schedules = get_patient_schedules(
        patient,
        start_date,
        end_date,
    )

    logs = get_dose_logs(
        schedules,
        start_date,
        end_date,
    )

    now = _current_local_datetime()
    history = []

    for target_date in _date_range(start_date, end_date):
        due_schedules = [
            schedule for schedule in schedules if is_schedule_due(schedule, target_date)
        ]

        taken = 0
        missed = 0
        pending = 0

        for schedule in due_schedules:
            log = logs.get((schedule.id, target_date))

            status = _resolve_occurrence_status(
                schedule,
                target_date,
                log,
                now,
            )

            if status == "TAKEN":
                taken += 1
            elif status == "MISSED":
                missed += 1
            else:
                pending += 1

        completed = taken + missed

        adherence_rate = round((taken / completed) * 100, 2) if completed else None

        history.append(
            {
                "date": target_date,
                "scheduled": len(due_schedules),
                "taken": taken,
                "missed": missed,
                "pending": pending,
                "adherence_rate": adherence_rate,
            }
        )

    return history


def calculate_summary(history):
    """Calculate overall adherence metrics from daily history."""
    scheduled = sum(day["scheduled"] for day in history)
    taken = sum(day["taken"] for day in history)
    missed = sum(day["missed"] for day in history)
    pending = sum(day["pending"] for day in history)

    completed = taken + missed

    adherence_rate = round((taken / completed) * 100, 2) if completed else None

    return {
        "scheduled_doses": scheduled,
        "taken_doses": taken,
        "missed_doses": missed,
        "pending_doses": pending,
        "completed_doses": completed,
        "adherence_rate": adherence_rate,
    }


def calculate_streak(history):
    """
    Calculate the number of consecutive calendar days where
    every scheduled dose was taken.

    Today is only counted when there are no pending doses.
    """
    if not history:
        return 0

    history_by_date = {day["date"]: day for day in history if day["scheduled"] > 0}

    if not history_by_date:
        return 0

    today = timezone.localdate()
    latest_date = max(day_date for day_date in history_by_date if day_date <= today)

    latest_day = history_by_date[latest_date]

    if latest_date == today and latest_day["pending"] > 0:
        latest_date -= timedelta(days=1)

    streak = 0
    current_date = latest_date

    while current_date in history_by_date:
        day = history_by_date[current_date]

        if day["scheduled"] == 0:
            break

        if day["missed"] > 0 or day["pending"] > 0:
            break

        streak += 1
        current_date -= timedelta(days=1)

    return streak


def calculate_medication_breakdown(
    patient,
    start_date: date,
    end_date: date,
):
    """Calculate adherence separately for each medicine."""
    schedules = get_patient_schedules(
        patient,
        start_date,
        end_date,
    )

    logs = get_dose_logs(
        schedules,
        start_date,
        end_date,
    )

    now = _current_local_datetime()
    medicines = {}

    for schedule in schedules:
        medicine = schedule.dosage.medicine

        entry = medicines.setdefault(
            medicine.id,
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.medicine_name,
                "scheduled_doses": 0,
                "taken_doses": 0,
                "missed_doses": 0,
                "pending_doses": 0,
            },
        )

        for target_date in _date_range(start_date, end_date):
            if not is_schedule_due(schedule, target_date):
                continue

            entry["scheduled_doses"] += 1

            log = logs.get((schedule.id, target_date))

            status = _resolve_occurrence_status(
                schedule,
                target_date,
                log,
                now,
            )

            if status == "TAKEN":
                entry["taken_doses"] += 1
            elif status == "MISSED":
                entry["missed_doses"] += 1
            else:
                entry["pending_doses"] += 1

    result = []

    for entry in medicines.values():
        completed = entry["taken_doses"] + entry["missed_doses"]

        entry["adherence_rate"] = (
            round(
                (entry["taken_doses"] / completed) * 100,
                2,
            )
            if completed
            else None
        )

        result.append(entry)

    return sorted(
        result,
        key=lambda item: item["medicine_name"].lower(),
    )


def calculate_status_breakdown(history):
    """Return totals used by the dashboard donut/pie chart."""
    return {
        "taken": sum(day["taken"] for day in history),
        "missed": sum(day["missed"] for day in history),
        "pending": sum(day["pending"] for day in history),
    }


def calculate_report(
    patient,
    start_date: date,
    end_date: date,
):
    """Build the complete analytics payload."""
    history = build_daily_history(
        patient,
        start_date,
        end_date,
    )

    return {
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            **calculate_summary(history),
            "current_streak": calculate_streak(history),
        },
        "daily_history": history,
        "status_breakdown": calculate_status_breakdown(history),
        "medications": calculate_medication_breakdown(
            patient,
            start_date,
            end_date,
        ),
    }
