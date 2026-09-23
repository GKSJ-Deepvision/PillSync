"""
OCR extraction for prescription / medicine-label images.

run_ocr() wraps pytesseract (thin, easy to mock in tests).
parse_fields() is pure text -> structured-fields logic, so it can be
unit-tested against known strings without needing an actual image or
tesseract installed in the test environment.
"""

import re

import pytesseract
from django.conf import settings
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = getattr(settings, "TESSERACT_CMD", "tesseract")

# Matches dosage amounts like "500mg", "5 mg", "10ml", "2.5mcg"
DOSAGE_RE = re.compile(r"\b\d+(?:\.\d+)?\s?(mg|mcg|ml|g|iu)\b", re.IGNORECASE)

# Matches quantities like "30 tablets", "1 bottle", "QTY: 60"
QUANTITY_RE = re.compile(
    r"\b(?:qty|quantity)?\s*[:\-]?\s*(\d+)\s*(tablets?|capsules?|tabs?|pills?|bottles?|ml)\b",
    re.IGNORECASE,
)

# A quantity that sits alone in its own row, e.g. "30" next to "Refills 3" —
# common on prescription labels where the dispensed count has no unit word.
STANDALONE_QUANTITY_RE = re.compile(r"^(\d{1,4})\s*(?:refills?.*)?$", re.IGNORECASE)

# Explicit "Quantity: 30" label, possibly with the number on the next line.
QUANTITY_LABEL_RE = re.compile(r"\bquantity\b\s*[:\-]?\s*\n?\s*(\d+)", re.IGNORECASE)

# Matches frequency phrasing like "twice daily", "1x/day", "every 8 hours",
# and common label shorthand like "before bedtime" / "with food".
FREQUENCY_RE = re.compile(
    r"\b(once|twice|three times|1x|2x|3x)\s*(?:a\s*day|daily|/day)?\b"
    r"|\bevery\s+\d+\s+hours?\b"
    r"|\bbefore\s+bed(?:time)?\b"
    r"|\bwith\s+(?:meals?|food)\b"
    r"|\bin\s+the\s+(?:morning|evening)\b",
    re.IGNORECASE,
)

# Lines that are clearly layout/header/legal text on a real pharmacy label —
# never the medicine name, even though they're often near the top.
NAME_SKIP_PATTERNS = re.compile(
    r"pharmacy|address|phone|refill|expire|caution|important|federal law|"
    r"rx:|rx #|ndc|bin \d|rph|use by|quantity|date:|call your|side effect|"
    r"report|fda|take \d|take with|take exactly|do not|may cause|discontinue|"
    r"transfer of this drug|directed by|prescribed",
    re.IGNORECASE,
)

# Lines that are dosing instructions, never the actual dispensed quantity —
# e.g. "TAKE 1 TABLET BY MOUTH..." should not be read as "quantity: 1 tablet".
INSTRUCTION_LINE_RE = re.compile(r"^\s*take\b", re.IGNORECASE)


def run_ocr(image_file) -> str:
    """Runs Tesseract OCR on an uploaded image file and returns raw text."""
    image = Image.open(image_file)
    return pytesseract.image_to_string(image)


def _extract_quantity(lines: list, raw_text: str) -> str:
    # 1. An explicit "Quantity: 30" label wins if present.
    label_match = QUANTITY_LABEL_RE.search(raw_text)
    if label_match:
        return label_match.group(1)

    # 2. A "<number> <unit>" phrase — but skip dosing-instruction lines like
    #    "TAKE 1 TABLET BY MOUTH", which aren't the dispensed quantity.
    for line in lines:
        if INSTRUCTION_LINE_RE.search(line):
            continue
        m = QUANTITY_RE.search(line)
        if m:
            return m.group(0).strip()

    # 3. A standalone number on its own line (e.g. "30" next to "Refills 3"),
    #    which is how dispensed quantity often appears with no unit word.
    for line in lines:
        m = STANDALONE_QUANTITY_RE.match(line)
        if m:
            return m.group(1)

    return ""


def parse_fields(raw_text: str) -> dict:
    """
    Extracts medicine name, dosage, quantity, and frequency from raw OCR
    text. Best-effort, regex-based — good enough to pre-fill a form the
    patient can correct, not a substitute for pharmacist verification.
    """
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]

    dosage_match = DOSAGE_RE.search(raw_text)
    quantity = _extract_quantity(lines, raw_text)
    frequency_match = FREQUENCY_RE.search(raw_text)

    medicine_name = ""

    # Strategy 1: the medicine name usually sits on the same line as the
    # dosage (e.g. "ATENOLOL 100 MG TABS") — take the words before the dose.
    if dosage_match:
        for line in lines:
            if DOSAGE_RE.search(line) and not NAME_SKIP_PATTERNS.search(line):
                split_point = DOSAGE_RE.search(line)
                candidate = line[: split_point.start()].strip(" -:")
                if candidate:
                    medicine_name = candidate
                    break

    # Strategy 2: fall back to the first meaningful line that isn't
    # header/legal noise and isn't purely numeric or a dosage/quantity match.
    if not medicine_name:
        for line in lines:
            if not line:
                continue
            if NAME_SKIP_PATTERNS.search(line):
                continue
            if re.fullmatch(r"[\d\s\-/.:]+", line):
                continue
            if DOSAGE_RE.fullmatch(line) or QUANTITY_RE.fullmatch(line):
                continue
            medicine_name = line
            break

    return {
        "medicine_name": medicine_name,
        "dosage": dosage_match.group(0).strip() if dosage_match else "",
        "quantity": quantity,
        "frequency": frequency_match.group(0).strip() if frequency_match else "",
    }


def extract_from_image(image_file) -> dict:
    """Full pipeline: OCR the image, then parse structured fields from it."""
    raw_text = run_ocr(image_file)
    fields = parse_fields(raw_text)
    return {"raw_text": raw_text, **fields}
