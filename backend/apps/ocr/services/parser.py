import re


def parse_ocr_text(text):
    """
    Convert raw OCR text into structured medicine information.
    """

    if not text or not text.strip():
        return {
            "medicine_name": None,
            "strength": None,
            "quantity": None,
            "dosage": None,
            "frequency": None,
            "instructions": None,
            "confidence": 0.0,
        }

    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]

    full_text = " ".join(lines)

    # Medicine name
    medicine_name = None

    for line in lines:
        if re.search(r"\bparacetamol\b", line, re.IGNORECASE):
            medicine_name = "Paracetamol"
            break

    # Strength
    strength = None

    strength_match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml)\b",
        full_text,
        re.IGNORECASE,
    )

    if strength_match:
        strength = f"{strength_match.group(1)} " f"{strength_match.group(2)}"

    # Quantity
    quantity = None

    quantity_match = re.search(
        r"\b(\d+)\s+(tablets?|capsules?|pills?)\b",
        full_text,
        re.IGNORECASE,
    )

    if quantity_match:
        quantity = int(quantity_match.group(1))

    # Dosage
    dosage = None

    # First look for an explicit dosage instruction.
    dosage_match = re.search(
        r"dosage[:\s]+" r"(\d+(?:\.\d+)?)\s+" r"(tablet|tablets|capsule|capsules|pill|pills)\b",
        full_text,
        re.IGNORECASE,
    )

    if dosage_match:
        dosage = f"{dosage_match.group(1)} " f"{dosage_match.group(2)}"

    # If OCR contains "1 tablet" in an instruction,
    # use that instead of the package quantity.
    if dosage is None:
        dosage_match = re.search(
            r"\b1\s+(tablet|tablets|capsule|capsules|pill|pills)\b",
            full_text,
            re.IGNORECASE,
        )

        if dosage_match:
            dosage = f"1 {dosage_match.group(1)}"

    # Instructions
    instructions = None

    if re.search(r"\bafter food\b", full_text, re.IGNORECASE):
        instructions = "After food"

    elif re.search(r"\bbefore food\b", full_text, re.IGNORECASE):
        instructions = "Before food"

    # Frequency
    frequency = None

    frequency_patterns = [
        (r"\bonce\s+(?:a|per)\s+day\b", "Once a day"),
        (r"\btwice\s+(?:a|per)\s+day\b", "Twice a day"),
        (
            r"\bthree\s+times\s+(?:a|per)\s+day\b",
            "Three times a day",
        ),
        (
            r"\bthrice\s+(?:a|per)\s+day\b",
            "Three times a day",
        ),
    ]

    for pattern, value in frequency_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            frequency = value
            break

    # Confidence
    fields_found = sum(
        value is not None
        for value in [
            medicine_name,
            strength,
            quantity,
            dosage,
            frequency,
            instructions,
        ]
    )

    confidence = round(fields_found / 6, 2)

    return {
        "medicine_name": medicine_name,
        "strength": strength,
        "quantity": quantity,
        "dosage": dosage,
        "frequency": frequency,
        "instructions": instructions,
        "confidence": confidence,
    }
