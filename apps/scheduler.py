import logging
from datetime import datetime, time
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from apps.database import SessionLocal
from apps.models import Medicine, AdherenceLog
from apps.notifications import send_medication_reminder

logger = logging.getLogger("scheduler")

# Configure AsyncIOScheduler instance
scheduler = AsyncIOScheduler()

def check_due_medicines():
    """
    Background job that checks for medicines due for a dose today.
    Opens a database session, queries all active medicines, and checks
    if they have required doses that have not been logged as 'TAKEN' today.
    """
    db: Session = SessionLocal()
    try:
        # Calculate the start of today in UTC
        now = datetime.utcnow()
        today_start = datetime.combine(now.date(), time.min)

        # Query all active prescriptions / medicines
        medicines = db.query(Medicine).all()

        due_count = 0
        for medicine in medicines:
            # Check if this medicine has daily requirements
            if medicine.daily_frequency and medicine.daily_frequency > 0:
                # Query logs for today with status TAKEN
                taken_logs_today = (
                    db.query(AdherenceLog)
                    .filter(
                        AdherenceLog.medicine_id == medicine.id,
                        AdherenceLog.status == "TAKEN",
                        AdherenceLog.timestamp >= today_start
                    )
                    .count()
                )

                # If required daily frequency is not yet met today, flag as due and notify
                if taken_logs_today < medicine.daily_frequency:
                    send_medication_reminder(
                        user_id=medicine.user_id,
                        medicine_name=medicine.name,
                        dosage=medicine.dosage
                    )
                    due_count += 1

        logger.info(f"check_due_medicines completed: checked {len(medicines)} medicines, {due_count} due reminders triggered.")
    except Exception as e:
        logger.error(f"Error executing check_due_medicines: {e}", exc_info=True)
    finally:
        db.close()
