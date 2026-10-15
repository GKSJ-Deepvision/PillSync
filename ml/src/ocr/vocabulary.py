"""Shared medicine name vocabulary + fuzzy matcher.

This is the single "is this text actually a medicine?" gate used by both the
OCR parser (``backend/apps/ocr/services/parser.py``) and the OCR recognizers
in this package. It exists because the raw OCR text coming off a prescription
photo mixes real medicine lines with unrelated boilerplate -- the doctor's
name, "MBBS, MD", "Rx", dates, signatures, etc. Previously nothing filtered
that boilerplate out, so it was happily returned to the app as if it were a
prescribed medicine.

The vocabulary is built from every medicine name this repository knows
about:
    - ``ml/data/raw/medicine_reference/medicine_dataset.csv`` (~150 unique
      names; the file has 50k rows but reuses a small pool of drug names)
    - the handwritten OCR dataset's 78 brand names + generics
    - the printed OCR dataset's 10 generic names

Matching uses RapidFuzz's ``ratio`` (falls back to the stdlib ``difflib`` if
RapidFuzz isn't installed) so that OCR noise such as "TabOmeprazcte" or
"Paracetamal" still resolves to the correct canonical name, while a short,
unrelated fragment like "MBBS MD" or "Rx" scores far below the match
threshold and gets dropped.
"""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

try:
    from rapidfuzz import fuzz as _fuzz
    from rapidfuzz import process as _process

    _HAVE_RAPIDFUZZ = True

except ImportError:  # pragma: no cover - exercised when rapidfuzz isn't installed
    from difflib import SequenceMatcher

    _HAVE_RAPIDFUZZ = False

    def _ratio_fallback(a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a, b).ratio() * 100


ROOT = Path(__file__).resolve().parents[2]  # .../ml
REFERENCE_CSV = ROOT / "data" / "raw" / "medicine_reference" / "medicine_dataset.csv"
BUILTIN_MEDICINE_NAMES = Path(__file__).with_name("medicine_names.txt")
HANDWRITTEN_LABEL_FILES = [
    ROOT / "data" / "raw" / "ocr_handwritten" / split / f"{split.lower()}_labels.csv"
    for split in ("Training", "Validation", "Testing")
]
PRINTED_GENERIC_NAMES = [
    "Amoxicillin",
    "Atorvastatin",
    "Azithromycin",
    "Cetirizine",
    "Diclofenac",
    "Ibuprofen",
    "Metformin",
    "Omeprazole",
    "Pantoprazole",
    "Paracetamol",
]

# Lines that are unambiguously *not* a medicine, seen verbatim (or near
# enough) in the synthetic printed-prescription dataset. These are rejected
# outright before fuzzy matching even runs, since short fragments like "Rx"
# or "MD" can otherwise score deceptively high against a short drug name.
NON_MEDICINE_STOPWORDS = {
    "rx",
    "dr",
    "md",
    "mbbs",
    "mbbs md",
    "date",
    "patient",
    "doctor",
    "prescription",
    "medicines",
    "medications",
    "signature",
    "clinic",
    "hospital",
    "age",
    "sex",
    "address",
}

_NON_ALPHA = re.compile(r"[^a-z]+")
_DOSAGE_FORM_PREFIX = re.compile(
    r"^(tab|tabs|tablet|cap|caps|capsule|syp|syrup|inj|injection|oint|ointment|drops?)\b\.?\s*",
    re.IGNORECASE,
)
_LEADING_ALPHA_RUN = re.compile(r"^[A-Za-z][A-Za-z\s]*")


@dataclass(frozen=True)
class MedicineMatch:
    name: str
    generic_name: str | None
    score: float


def _normalize(text: str) -> str:
    text = _DOSAGE_FORM_PREFIX.sub("", text.strip())
    return _NON_ALPHA.sub("", text.lower())


class MedicineVocabulary:
    """Fuzzy lookup over every medicine name the project has data for."""

    def __init__(self) -> None:
        self._generic_by_name: dict[str, str] = {}
        self._canonical_by_key: dict[str, str] = {}

        for name in PRINTED_GENERIC_NAMES:
            self._add(name)
        self._load_bundled_names()
        self._load_handwritten_names()
        self._load_reference_csv()

        # Precompute normalized keys once so matching doesn't re-normalize
        # ~150 names on every call.
        self._keys = list(self._canonical_by_key.keys())

    def _load_bundled_names(self) -> None:
        with BUILTIN_MEDICINE_NAMES.open(encoding="utf-8") as handle:
            for name in handle:
                self._add(name)

    def _add(self, name: str, generic: str | None = None) -> None:
        name = name.strip()
        if not name:
            return
        key = _normalize(name)
        if not key or len(key) < 3:
            return
        self._canonical_by_key.setdefault(key, name)
        if generic:
            self._generic_by_name.setdefault(name, generic)

    def _load_handwritten_names(self) -> None:
        for label_file in HANDWRITTEN_LABEL_FILES:
            if not label_file.exists():
                continue
            with label_file.open(newline="", encoding="utf-8") as handle:
                for row in csv.DictReader(handle):
                    name = row.get("MEDICINE_NAME", "")
                    generic = row.get("GENERIC_NAME") or None
                    self._add(name, generic=generic)

    def _load_reference_csv(self) -> None:
        # Only the "Name" column is trustworthy here: the reference dataset
        # is synthetic and re-randomizes Category/Strength/Manufacturer per
        # row for the same drug name, so those columns are not reliable
        # per-drug facts and are intentionally not surfaced as if they were.
        if not REFERENCE_CSV.exists():
            return
        with REFERENCE_CSV.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                self._add(row.get("Name", ""))

    def __len__(self) -> int:
        return len(self._canonical_by_key)

    def match(
        self,
        text: str,
        threshold: float = 68.0,
        tie_margin: float = 6.0,
    ) -> MedicineMatch | None:
        """Return the best vocabulary match for ``text``, or ``None``.

        ``text`` is typically a raw OCR line (may include "Tab", dosage,
        frequency digits, stray punctuation, etc.) -- callers do not need to
        pre-clean it beyond basic whitespace stripping.
        """
        # Callers may hand us a whole OCR line ("Tab Amoxicillin 500 mg
        # twice daily") rather than an isolated name. Scoring the full line
        # against short vocabulary entries drags the ratio down just from
        # the extra trailing text, so we also try the leading alphabetic
        # run (i.e. everything before the first digit) and keep whichever
        # candidate scores best.
        candidates = {_normalize(text)}
        alpha_run = _LEADING_ALPHA_RUN.match(text.strip())
        if alpha_run:
            candidates.add(_normalize(alpha_run.group(0)))
        candidates.discard("")

        best_overall_key = None
        best_overall_score = 0.0
        best_overall_second = 0.0
        for key in candidates:
            if len(key) < 3 or key in NON_MEDICINE_STOPWORDS:
                continue
            found_key, score, second = self._best_for_key(key)
            if score > best_overall_score:
                best_overall_key, best_overall_score, best_overall_second = found_key, score, second

        best_key, best_score, second_score = best_overall_key, best_overall_score, best_overall_second
        if best_key is None or best_score < threshold:
            return None
        if best_score - second_score < tie_margin and second_score >= threshold - tie_margin:
            return None

        canonical = self._canonical_by_key[best_key]
        return MedicineMatch(
            name=canonical,
            generic_name=self._generic_by_name.get(canonical),
            score=round(best_score, 1),
        )

    def _best_for_key(self, key: str) -> tuple[str | None, float, float]:
        """Return (best_matching_key, best_score, second_best_score)."""
        if _HAVE_RAPIDFUZZ:
            # rapidfuzz.process runs the comparison loop in C and returns the
            # top-2 matches in one call, which is an order of magnitude
            # faster than scoring ~150 candidates in a Python loop.
            # Plain (full-string) ratio is used rather than partial_ratio:
            # partial_ratio looks for the best-aligned substring, which lets
            # short names like "Ace" or "Aceta" score a spurious 100% just
            # by appearing inside an unrelated longer OCR string (e.g.
            # "paracetamal" contains the substring "aceta"). Full-string
            # ratio compares the whole candidate, which is what we want once
            # the dosage-form prefix has already been stripped in
            # ``_normalize``.
            top = _process.extract(key, self._keys, scorer=_fuzz.ratio, limit=2)
            if not top:
                return None, 0.0, 0.0
            best_key, best_score = top[0][0], top[0][1]
            second_score = top[1][1] if len(top) > 1 else 0.0
            return best_key, best_score, second_score

        best_key, best_score = None, 0.0
        second_score = 0.0
        for candidate_key in self._keys:
            score = _ratio_fallback(key, candidate_key)
            if score > best_score:
                second_score = best_score
                best_score, best_key = score, candidate_key
            elif score > second_score:
                second_score = score
        return best_key, best_score, second_score


@lru_cache(maxsize=1)
def get_vocabulary() -> MedicineVocabulary:
    """Process-wide singleton; building the index costs ~1s for ~50k names."""
    return MedicineVocabulary()
