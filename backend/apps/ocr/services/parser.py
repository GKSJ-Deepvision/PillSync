import re
from typing import Any


def parse_ocr_text(text: str) -> dict[str, Any]:
    """Parses raw OCR text from prescriptions or medicine packaging into structured details.

    Handles doctor shorthand (e.g. 1-0-1, OD, BD, Tab, Cap) and standard formats.
    Returns None for any field that cannot be identified with certainty.
    """
    if not text:
        return {
            "medicine_name": None,
            "dosage": None,
            "quantity": None,
            "frequency": None,
            "prescription_details": None,
        }

    text_clean = text.replace("\n", " ")

    # 1. Extract Dosage (e.g. 500 mg, 10mg, 50mcg, 2.5ml, 1000 IU, 0.5g)
    dosage_match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|iu|units|tablets?|capsules?)\b",
        text_clean,
        re.IGNORECASE,
    )
    dosage = dosage_match.group(0).strip() if dosage_match else None

    # 2. Extract Quantity (e.g. Qty: 30, Quantity 60, #30, 30 tabs/capsules)
    qty_match = re.search(
        r"\b(?:qty|quantity|count|pack\s+size)[:\s]*(\d+)\b|#\s*(\d+)\b|\b(\d+)\s*(?:tablets|tabs|capsules|caps|pills)\b",
        text_clean,
        re.IGNORECASE,
    )
    quantity = None
    if qty_match:
        quantity = int(next(g for g in qty_match.groups() if g is not None))

    # 3. Extract Frequency & Doctor Shorthand
    freq_patterns = [
        (
            r"\b(?:three\s+times\s+daily|thrice\s+daily|tid|t\.i\.d|1-1-1|every\s+8\s+hours?)\b",
            "THREE_TIMES_DAILY",
        ),
        (
            r"\b(?:twice\s+daily|twice\s+a\s+day|bd|b\.d|bid|b\.i\.d|1-0-1|0-1-1|1-1-0|every\s+12\s+hours?)\b",
            "TWICE_DAILY",
        ),
        (
            r"\b(?:once\s+daily|once\s+a\s+day|od|o\.d|0-0-1|1-0-0|0-1-0|daily|every\s+morning|every\s+night|q\.d|qd)\b",
            "DAILY",
        ),
    ]
    frequency = None
    for pattern, freq_val in freq_patterns:
        if re.search(pattern, text_clean, re.IGNORECASE):
            frequency = freq_val
            break

    # 4. Extract Medicine Name
    medicine_name = None
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # First attempt: text before dosage on same line
    if dosage:
        for line in lines:
            if dosage.lower() in line.lower():
                idx = line.lower().find(dosage.lower())
                name_part = line[:idx].strip()
                # Remove common prescription prefixes (Rx, Tab, Cap, Syrup, Inj, etc.)
                name_part = re.sub(
                    r"(?i)\b(rx|tab|tablet|cap|capsule|syp|syrup|inj|injection|dr|dr\.|m/s)[:\s.-]*",
                    "",
                    name_part,
                ).strip()
                name_part = re.sub(r"^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "", name_part).strip()
                if len(name_part) >= 2:
                    medicine_name = name_part
                    break

    # Second attempt: If no dosage match, check for explicit Rx / Tab / Cap prefix line
    if not medicine_name and lines:
        for line in lines:
            rx_match = re.search(
                r"(?i)\b(rx|tab|tablet|cap|capsule|syp|syrup|inj)[:\s.-]+([a-zA-Z0-9\s]+)", line
            )
            if rx_match:
                candidate = rx_match.group(2).strip()
                cleaned = re.sub(r"^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "", candidate).strip()
                if len(cleaned) >= 3:
                    medicine_name = cleaned
                    break

    return {
        "medicine_name": medicine_name,
        "dosage": dosage,
        "quantity": quantity,
        "frequency": frequency,
        "prescription_details": text.strip(),
    }
