import re


def parse_ocr_text(text):
    """
    Parse raw OCR text into structured medicine information.
    """

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    result = {
        "medicine_name": None,
        "dosage": None,
        "quantity": None,
        "frequency": None,
        "prescription_details": None,
    }

    if not lines:
        return result

    dosage_pattern = re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mls|%)\b",
        re.IGNORECASE,
    )

    quantity_pattern = re.compile(
        r"\b\d+\s*x\s*\d+\s*(?:tablets?|capsules?)?\b",
        re.IGNORECASE,
    )

    medicine_pattern = re.compile(
        r"\b[\w-]+(?:\s+[\w-]+)*\s+"
        r"(?:tablets?|capsules?|syrup|injection|cream|ointment|"
        r"solution|suspension|drops?)"
        r"(?:\s+IP)?\b",
        re.IGNORECASE,
    )

    frequency_keywords = (
        "once",
        "twice",
        "thrice",
        "daily",
        "morning",
        "evening",
        "night",
        "after food",
        "before food",
    )

    medicine_line = None

    # Look for a medicine-like line instead of blindly using the first OCR line.
    for line in lines:
        medicine_match = medicine_pattern.search(line)

        if medicine_match:
            medicine_line = medicine_match.group(0).strip()
            break

    for line in lines:
        if result["dosage"] is None:
            dosage_match = dosage_pattern.search(line)

            if dosage_match:
                result["dosage"] = dosage_match.group(0)

        if result["quantity"] is None:
            quantity_match = quantity_pattern.search(line)

            if quantity_match:
                result["quantity"] = quantity_match.group(0)

        if result["frequency"] is None:
            lower_line = line.lower()

            if any(keyword in lower_line for keyword in frequency_keywords):
                result["frequency"] = line

    if medicine_line:
        result["medicine_name"] = medicine_line

    excluded_lines = {
        result["medicine_name"],
        result["dosage"],
        result["quantity"],
        result["frequency"],
    }

    details = [line for line in lines if line not in excluded_lines]

    if details:
        result["prescription_details"] = " ".join(details)

    return result
