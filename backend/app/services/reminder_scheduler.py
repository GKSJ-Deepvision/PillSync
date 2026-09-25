from datetime import date, datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.models.reminder import Reminder


scheduler = BackgroundScheduler()


SUPPORTED_FREQUENCIES = {
    "daily",
    "weekly",
    "once daily",
    "twice daily",
    "three times daily",
    "every other day",
}


def should_create_reminder(
    schedule: DosageSchedule,
    scheduled_at: datetime,
    db: Session,
) -> bool:
    existing_reminder = (
        db.query(Reminder)
        .filter(
            Reminder.dosage_schedule_id == schedule.id,
            Reminder.scheduled_at == scheduled_at,
        )
        .first()
    )

    return existing_reminder is None


def create_reminder_for_schedule(
    schedule: DosageSchedule,
    scheduled_at: datetime,
    db: Session,
) -> Reminder | None:
    if not should_create_reminder(
        schedule,
        scheduled_at,
        db,
    ):
        return None

    reminder = Reminder(
        dosage_schedule_id=schedule.id,
        scheduled_at=scheduled_at,
        status="pending",
    )

    db.add(reminder)

    return reminder


def is_due_today(
    schedule: DosageSchedule,
    today: date,
) -> bool:
    frequency = schedule.frequency.strip().lower()

    if frequency in {
        "daily",
        "once daily",
        "twice daily",
        "three times daily",
    }:
        return True

    if frequency == "weekly":
        return today.weekday() == 0

    if frequency == "every other day":
        reference_date = date(2026, 1, 1)
        days_since_reference = (today - reference_date).days
        return days_since_reference % 2 == 0

    return False


def generate_reminders():
    """
    Generate reminder records from dosage schedules.

    Reminders are generated for active medicines whose
    dosage schedules are due today.

    Duplicate reminders are prevented using
    dosage_schedule_id and scheduled_at.
    """
    db = SessionLocal()

    try:
        now = datetime.now()
        today = now.date()

        schedules = (
            db.query(DosageSchedule)
            .join(
                Medicine,
                DosageSchedule.medicine_id == Medicine.id,
            )
            .all()
        )

        for schedule in schedules:
            frequency = schedule.frequency.strip().lower()

            if frequency not in SUPPORTED_FREQUENCIES:
                continue

            medicine = (
                db.query(Medicine)
                .filter(
                    Medicine.id == schedule.medicine_id,
                )
                .first()
            )

            if medicine is None:
                continue

            if (
                medicine.start_date is not None
                and today < medicine.start_date
            ):
                continue

            if (
                medicine.end_date is not None
                and today > medicine.end_date
            ):
                continue

            if not is_due_today(schedule, today):
                continue

            scheduled_at = datetime.combine(
                today,
                schedule.time_of_day,
            )

            window_start = now - timedelta(minutes=1)
            window_end = now + timedelta(minutes=1)

            if scheduled_at < window_start:
                continue

            if scheduled_at > window_end:
                continue

            create_reminder_for_schedule(
                schedule,
                scheduled_at,
                db,
            )

        db.commit()

    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            generate_reminders,
            "interval",
            minutes=1,
            id="generate_reminders",
            replace_existing=True,
        )

        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()