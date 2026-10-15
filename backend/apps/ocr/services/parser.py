from __future__ import annotations

import re
import sys
from difflib import get_close_matches
from pathlib import Path

from ..schemas import MedicineExtraction

# Make the shared medicine vocabulary (ml/src/ocr/vocabulary.py) importable
# regardless of whether the backend is run from the repo root or as an
# installed package.
_ML_ROOT = Path(__file__).resolve().parents[4]
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

try:
    from ml.src.ocr.vocabulary import get_vocabulary

    _VOCAB_AVAILABLE = True
except ImportError:  # pragma: no cover - vocabulary module always ships with this repo
    _VOCAB_AVAILABLE = False

DOSAGE_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b", re.I)
QUANTITY_PATTERN = re.compile(r"(?:qty|quantity|#)\s*[:.]?\s*(\d+)", re.I)
FREQUENCY_PATTERN = re.compile(
    r"\b(?:(?:once|twice|thrice)\s+daily|once|twice|thrice|daily|weekly|monthly|every\s+\d+\s+hours?|\d+\s*(?:x|times?)\s*(?:a|per)?\s*day)\b",
    re.I,
)
# Numeric "morning-afternoon-night" dosing schedules commonly written on
# prescriptions, e.g. "1-0-1" (take in the morning and at night) or "0-1-0".
NUMERIC_FREQUENCY_PATTERN = re.compile(r"\b([01])\s*-\s*([01])\s*-\s*([01])\b")
# Lines that are clearly metadata, not a medicine list, and should never be
# treated as one even if they happen to precede a number (e.g. a date).
NON_MEDICINE_LINES = {
    "prescription",
    "medications",
    "medicines",
    "patient",
    "doctor",
    "date",
}


def parse_prescription_text(
    text: str, ocr_confidence: float, recognized_names: list[str] | None = None
) -> list[MedicineExtraction]:
    vocabulary = get_vocabulary() if _VOCAB_AVAILABLE else None
    medicines: list[MedicineExtraction] = []
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split()).strip(" -:.")
        if not line or line.lower() in NON_MEDICINE_LINES:
            continue
        dosage_match = DOSAGE_PATTERN.search(line)
        quantity_match = QUANTITY_PATTERN.search(line)
        frequency_match = FREQUENCY_PATTERN.search(line) or NUMERIC_FREQUENCY_PATTERN.search(line)
        matches = [match for match in (dosage_match, frequency_match, quantity_match) if match]
        end = min((match.start() for match in matches), default=len(line))
        name = re.sub(r"^\d+[.)]?\s*", "", line[:end]).strip(" ,-:")
        if not name or not re.search(r"[A-Za-z]{3,}", name):
            continue
        if recognized_names:
            close = get_close_matches(name, recognized_names, n=1, cutoff=0.45)
            if close:
                name = close[0]

        # This is the actual "only add medicines" gate: reject any line
        # whose leading text doesn't fuzzy-match a known medicine name, so
        # boilerplate like "Dr S Patel" or "MBBS, MD" never gets returned
        # as if it were a prescribed drug. Lines that already came back
        # normalized via recognized_names (the trained OCR models) are
        # trusted as-is since those models were themselves trained on a
        # closed set of real medicine names.
        confidence = ocr_confidence
        if vocabulary is not None and not (recognized_names and name in recognized_names):
            match = vocabulary.match(name)
            if match is None:
                continue
            name = match.name
            # Blend the OCR confidence with how confident the fuzzy name
            # match was, so a barely-legible line doesn't get reported with
            # the same confidence as a crisp one.
            confidence = min(confidence, match.score / 100) if confidence else match.score / 100

        remainder = line[end:]
        for match in matches:
            remainder = remainder.replace(match.group(0), "")
        medicines.append(
            MedicineExtraction(
                name=re.sub(r"\s+", " ", name),
                dosage=dosage_match.group(0) if dosage_match else None,
                quantity=quantity_match.group(1) if quantity_match else None,
                frequency=frequency_match.group(0) if frequency_match else None,
                instructions=re.sub(r"\s+", " ", remainder).strip(" ,-:") or None,
                confidence=round(max(0.0, min(1.0, confidence)), 4),
            )
        )
    return medicines
