import re

DOSAGE_PATTERN = re.compile(
    r"\b\d+(?:\.\d+)?\s*" r"(?:mg|mcg|g|kg|ml|l|iu|%|mg/ml|mcg/ml)\b",
    re.IGNORECASE,
)

EXPLICIT_QUANTITY_PATTERN = re.compile(
    r"\b(?:quantity|qty|count)\s*[:\-]?\s*(\d+)\b",
    re.IGNORECASE,
)

IMPLICIT_QUANTITY_PATTERN = re.compile(
    r"\b(\d+)\s+(?:tablets?|capsules?|pills?|units?|strips?)\b",
    re.IGNORECASE,
)

FREQUENCY_PATTERN = re.compile(
    r"\b("
    r"once\s+daily|"
    r"twice\s+daily|"
    r"thrice\s+daily|"
    r"once\s+(?:a|per)\s+day|"
    r"twice\s+(?:a|per)\s+day|"
    r"thrice\s+(?:a|per)\s+day|"
    r"\d+\s+times?\s+(?:a|per)\s+day|"
    r"\d+\s+times?\s+daily|"
    r"every\s+\d+\s+(?:hours?|hrs?)|"
    r"every\s+other\s+day|"
    r"once|"
    r"twice|"
    r"thrice|"
    r"morning|"
    r"afternoon|"
    r"evening|"
    r"night|"
    r"bedtime|"
    r"daily|"
    r"weekly"
    r")\b",
    re.IGNORECASE,
)

PRESCRIPTION_KEYWORDS = (
    "take",
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "dose",
    "doses",
    "daily",
    "twice",
    "once",
    "thrice",
    "every",
    "morning",
    "afternoon",
    "evening",
    "night",
    "bedtime",
    "oral",
    "before food",
    "after food",
    "with food",
)


MEDICINE_NAME_STOP_WORDS = {
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "pill",
    "pills",
    "medicine",
    "medication",
    "analgesic",
    "antipyretic",
    "prescription",
    "for",
    "oral",
    "use",
}


def normalize_ocr_text(text: str) -> list[str]:
    """
    Clean OCR output and return meaningful non-empty lines.
    """
    normalized_lines = []

    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()

        if not line:
            continue

        normalized_lines.append(line)

    return normalized_lines


def extract_dosage(text: str) -> str | None:
    """
    Extract the first common medicine dosage such as 500 mg or 5 ml.
    """
    match = DOSAGE_PATTERN.search(text)

    if match is None:
        return None

    return match.group(0).strip()


def extract_quantity(text: str) -> int | None:
    """
    Extract medicine quantity.

    Explicitly labelled quantities such as 'Quantity: 10 tablets'
    take priority over general patterns such as '1 tablet'.
    """
    explicit_match = EXPLICIT_QUANTITY_PATTERN.search(text)

    if explicit_match is not None:
        return int(explicit_match.group(1))

    implicit_match = IMPLICIT_QUANTITY_PATTERN.search(text)

    if implicit_match is not None:
        return int(implicit_match.group(1))

    return None


def extract_frequency(text: str) -> str | None:
    """
    Extract a medication frequency such as 'twice daily'
    or 'every 8 hours'.
    """
    match = FREQUENCY_PATTERN.search(text)

    if match is None:
        return None

    return match.group(1).strip()


def looks_like_medicine_name(line: str) -> bool:
    """
    Determine whether a line is a reasonable medicine-name candidate.
    """
    cleaned = line.strip(" ,.;:|-_")

    if not cleaned:
        return False

    lowered = cleaned.lower()

    if lowered in MEDICINE_NAME_STOP_WORDS:
        return False

    if DOSAGE_PATTERN.search(cleaned):
        return False

    if EXPLICIT_QUANTITY_PATTERN.search(cleaned):
        return False

    if IMPLICIT_QUANTITY_PATTERN.search(cleaned):
        return False

    if FREQUENCY_PATTERN.search(cleaned):
        return False

    if any(keyword in lowered for keyword in PRESCRIPTION_KEYWORDS):
        return False

    if len(cleaned) < 3:
        return False

    if not re.search(r"[A-Za-z]", cleaned):
        return False

    return True


def extract_medicine_name(lines: list[str]) -> str | None:
    """
    Extract a likely medicine name from OCR lines.

    The method favors lines near dosage information because medicine
    names on packages are commonly located close to their dosage.
    """
    candidates = [line.strip(" ,.;:|-_") for line in lines if looks_like_medicine_name(line)]

    if not candidates:
        return None

    for index, line in enumerate(lines):
        if DOSAGE_PATTERN.search(line):
            nearby_indexes = (
                index - 2,
                index - 1,
                index + 1,
                index + 2,
            )

            for nearby_index in nearby_indexes:
                if 0 <= nearby_index < len(lines):
                    candidate = lines[nearby_index].strip(" ,.;:|-_")

                    if candidate in candidates:
                        return candidate

    return candidates[0]


def extract_prescription_details(lines: list[str]) -> str | None:
    """
    Extract lines that contain dosage instructions or
    prescription-related information.
    """
    details = []

    for line in lines:
        lowered = line.lower()

        has_instruction_keyword = any(keyword in lowered for keyword in PRESCRIPTION_KEYWORDS)

        has_frequency = FREQUENCY_PATTERN.search(line) is not None

        if has_instruction_keyword or has_frequency:
            cleaned = line.strip(" ,.;:|-_")

            if cleaned and cleaned not in details:
                details.append(cleaned)

    if not details:
        return None

    return "; ".join(details)


def extract_medicine_information(text: str) -> dict:
    """
    Convert raw OCR text into structured medicine information.
    """
    lines = normalize_ocr_text(text)
    normalized_text = "\n".join(lines)

    return {
        "medicine_name": extract_medicine_name(lines),
        "dosage": extract_dosage(normalized_text),
        "quantity": extract_quantity(normalized_text),
        "frequency": extract_frequency(normalized_text),
        "prescription_details": extract_prescription_details(lines),
    }
