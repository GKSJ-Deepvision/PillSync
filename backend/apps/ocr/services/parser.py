from __future__ import annotations

import re
from difflib import get_close_matches

from ..schemas import MedicineExtraction

DOSAGE_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b", re.I)
QUANTITY_PATTERN = re.compile(r"(?:qty|quantity|#)\s*[:.]?\s*(\d+)", re.I)
FREQUENCY_PATTERN = re.compile(
    r"\b(?:(?:once|twice|thrice)\s+daily|once|twice|thrice|daily|weekly|monthly|every\s+\d+\s+hours?|\d+\s*(?:x|times?)\s*(?:a|per)?\s*day)\b",
    re.I,
)


def parse_prescription_text(
    text: str, ocr_confidence: float, recognized_names: list[str] | None = None
) -> list[MedicineExtraction]:
    medicines: list[MedicineExtraction] = []
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split()).strip(" -:.")
        if not line or line.lower() in {
            "prescription",
            "medications",
            "medicines",
            "patient",
            "doctor",
            "date",
        }:
            continue
        dosage_match = DOSAGE_PATTERN.search(line)
        quantity_match = QUANTITY_PATTERN.search(line)
        frequency_match = FREQUENCY_PATTERN.search(line)
        matches = [match for match in (dosage_match, frequency_match, quantity_match) if match]
        end = min((match.start() for match in matches), default=len(line))
        name = re.sub(r"^\d+[.)]?\s*", "", line[:end]).strip(" ,-:")
        if not name or not re.search(r"[A-Za-z]{3,}", name):
            continue
        if recognized_names:
            name = (
                get_close_matches(name, recognized_names, n=1, cutoff=0.45)[0]
                if get_close_matches(name, recognized_names, n=1, cutoff=0.45)
                else name
            )
        remainder = line[len(name) :]
        for match in matches:
            remainder = remainder.replace(match.group(0), "")
        medicines.append(
            MedicineExtraction(
                name=re.sub(r"\s+", " ", name),
                dosage=dosage_match.group(0) if dosage_match else None,
                quantity=quantity_match.group(1) if quantity_match else None,
                frequency=frequency_match.group(0) if frequency_match else None,
                instructions=re.sub(r"\s+", " ", remainder).strip(" ,-:") or None,
                confidence=round(max(0.0, min(1.0, ocr_confidence)), 4),
            )
        )
    return medicines
