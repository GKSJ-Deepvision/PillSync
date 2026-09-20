import re
from typing import Any, Dict, Optional

def parse_ocr_text(text: str) -> Dict[str, Any]:
    """
    Parses raw OCR text to extract structured medicine details.
    Returns None for fields that cannot be confidently identified.
    """
    if not text:
        return {
            "medicine_name": None,
            "dosage": None,
            "quantity": None,
            "frequency": None,
            "prescription_details": None,
        }

    text_clean = text.replace('\n', ' ')
    
    # 1. Extract Dosage (e.g., 500 mg, 10 ml, 50mcg)
    dosage_match = re.search(r'\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g)\b', text_clean, re.IGNORECASE)
    dosage = dosage_match.group(0).strip() if dosage_match else None

    # 2. Extract Quantity (e.g., Qty 30, Quantity: 30, 30 tablets)
    qty_match = re.search(
        r'\b(?:qty|quantity)[:\s]*(\d+)\b|#\s*(\d+)\b|\b(\d+)\s*(?:tablets|tabs|capsules|caps)\b', 
        text_clean, 
        re.IGNORECASE
    )
    quantity = None
    if qty_match:
        # Get the first non-None captured group which contains the number
        quantity = int(next(g for g in qty_match.groups() if g is not None))

    # 3. Extract Frequency
    freq_patterns = [
        (r'\b(?:once\s+daily|once\s+a\s+day|od|1-0-0|0-0-1|daily)\b', 'DAILY'),
        (r'\b(?:twice\s+daily|twice\s+a\s+day|bd|bid|1-0-1)\b', 'TWICE_DAILY'),
        (r'\b(?:three\s+times\s+daily|tid|1-1-1)\b', 'THREE_TIMES_DAILY'),
    ]
    frequency = None
    for pattern, freq_val in freq_patterns:
        if re.search(pattern, text_clean, re.IGNORECASE):
            frequency = freq_val
            break

    # 4. Extract Medicine Name
    # Heuristic: The name usually precedes the dosage on the same line.
    medicine_name = None
    if dosage:
        for line in text.split('\n'):
            if dosage.lower() in line.lower():
                # Extract everything before the dosage
                idx = line.lower().find(dosage.lower())
                name_part = line[:idx].strip()
                # Clean up prefixes like 'Rx:'
                name_part = re.sub(r'(?i)\brx[:\s-]*', '', name_part).strip()
                # Remove leading/trailing non-alphanumeric chars (like bullets)
                name_part = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', name_part).strip()
                if name_part:
                    medicine_name = name_part
                break

    return {
        "medicine_name": medicine_name,
        "dosage": dosage,
        "quantity": quantity,
        "frequency": frequency,
        "prescription_details": text.strip(),
    }
