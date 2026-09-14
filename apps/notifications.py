import logging
import sys
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# Configure logger for notifications with clear output format and UTF-8 safe handling
logger = logging.getLogger("notifications")
if not logger.hasHandlers():
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_medication_reminder(user_id: int, medicine_name: str, dosage: str) -> str:
    """
    Sends an email notification if SMTP is configured, otherwise falls back to logging.
    """
    subject = f"PillSync Reminder: {medicine_name} is due!"
    body = f"Hello Patient [{user_id}],\n\nThis is your reminder to take your medication.\n\nMedicine: {medicine_name}\nDosage: {dosage}\n\nPlease log it in your dashboard."
    
    if SMTP_SERVER and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            msg = EmailMessage()
            msg.set_content(body)
            msg["Subject"] = subject
            msg["From"] = SMTP_USERNAME
            msg["To"] = "patient@example.com" # Ideally fetch user email from DB

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent successfully for Medicine [{medicine_name}].")
            return "Email sent"
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return f"Failed: {e}"
    else:
        # Fallback for consoles with limited character encodings
        message = f"🔔 NOTIFICATION TRIGGERED | Patient ID: [{user_id}] | Medicine: [{medicine_name}] | Dosage: [{dosage}] is due now!"
        try:
            logger.warning(message)
        except UnicodeEncodeError:
            ascii_message = message.encode("ascii", errors="backslashreplace").decode("ascii")
            logger.warning(ascii_message)
        return message
