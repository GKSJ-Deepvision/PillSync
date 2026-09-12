import logging
import sys

# Configure logger for notifications with clear output format and UTF-8 safe handling
logger = logging.getLogger("notifications")
if not logger.hasHandlers():
    # Use utf-8 encoding with replacement or standard handler to safely support emojis across all platforms/consoles
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

def send_medication_reminder(user_id: int, medicine_name: str, dosage: str) -> str:
    """
    Mock notification service to simulate pushing alerts to a frontend application.
    Outputs a formatted notification alert to the terminal via logging.
    """
    message = f"🔔 NOTIFICATION TRIGGERED | Patient ID: [{user_id}] | Medicine: [{medicine_name}] | Dosage: [{dosage}] is due now!"
    try:
        logger.warning(message)
    except UnicodeEncodeError:
        # Fallback for consoles with limited character encodings (e.g. legacy cp1252 stdout)
        ascii_message = message.encode("ascii", errors="backslashreplace").decode("ascii")
        logger.warning(ascii_message)
    return message
