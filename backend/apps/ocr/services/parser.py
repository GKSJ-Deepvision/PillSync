"""Turn OCR text from a prescription or a medicine box into structured data.

Deliberately pure Python with no Django imports: it is the part of the OCR
pipeline most likely to be wrong, so it has to be cheap to test against many
real-world formats, and reusable from the ML workbench.

The formats it has to cope with are the ones actual prescriptions use, which
are inconsistent:

    Tab. Metformin 500 mg  1-0-1  x 30 days  (after food)
    Cap Amoxicillin 500mg TDS for 5 days
    2. Syp Cough Relief 5 ml BD
    Tab Levothyroxine 25 mcg OD, empty stomach

so nothing here assumes a single layout. Every field that is a guess rather
than something written on the page is recorded in `reasons`, so the review
screen can show the patient *why* it wants them to look twice.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

# Kept as plain strings, equal to apps.common.choices.DoseSlot values, so this
# module never imports Django. A test asserts the two stay in step.
MORNING, AFTERNOON, EVENING, NIGHT = "MORNING", "AFTERNOON", "EVENING", "NIGHT"
SLOT_ORDER = (MORNING, AFTERNOON, EVENING, NIGHT)

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}  # fmt: skip


@dataclass
class SlotDose:
    slot: str
    quantity: Decimal = Decimal("1")

    def as_dict(self) -> dict:
        return {"slot": self.slot, "quantity": str(self.quantity)}


@dataclass
class ParsedMedicine:
    raw_line: str
    name: str = ""
    form: str = ""
    strength: str = ""
    strength_unit: str = ""
    slots: list[SlotDose] = field(default_factory=list)
    # Same vocabulary as apps.common.choices.ScheduleFrequency.
    frequency: str = "DAILY"
    interval_days: int = 1
    days_of_week: list[int] = field(default_factory=list)
    duration_days: int | None = None
    total_quantity: Decimal | None = None
    instructions: str = ""
    as_needed: bool = False
    reasons: list[str] = field(default_factory=list)

    @property
    def doses_per_day(self) -> int:
        return len(self.slots)

    @property
    def units_per_day(self) -> Decimal:
        """Units taken on a day the medicine is due."""
        return sum((s.quantity for s in self.slots), Decimal("0"))

    def doses_in_course(self, days: int) -> int:
        """How many dosing days fall inside a course of `days` days."""
        if self.frequency == "INTERVAL":
            return -(-days // max(self.interval_days, 1))
        if self.frequency == "SPECIFIC_DAYS":
            return -(-days * len(self.days_of_week) // 7)
        return days


@dataclass
class ParsedHeader:
    patient_name: str = ""
    doctor_name: str = ""
    clinic_name: str = ""
    reference_number: str = ""
    issued_on: date | None = None
    expires_on: date | None = None

    def as_dict(self) -> dict:
        return {
            "patient_name": self.patient_name,
            "doctor_name": self.doctor_name,
            "clinic_name": self.clinic_name,
            "reference_number": self.reference_number,
            "issued_on": self.issued_on.isoformat() if self.issued_on else None,
            "expires_on": self.expires_on.isoformat() if self.expires_on else None,
        }

    @property
    def has_content(self) -> bool:
        return any(
            (
                self.doctor_name,
                self.clinic_name,
                self.reference_number,
                self.issued_on,
                self.expires_on,
            )
        )


@dataclass
class ParsedPrescription:
    header: ParsedHeader
    medicines: list[ParsedMedicine]
    warnings: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

_WS = re.compile(r"[ \t ]+")

# OCR reads a 1 as l or I and a 0 as O constantly, most of all in handwriting-like
# fonts. A token made only of digits and those look-alikes, with at least one
# real digit, is a number ("5OO" is 500, "3O" is 30). A token with no real
# digit ("Il", "lo") is left alone, because that is just a word.
_NUMBER_LIKE = re.compile(r"(?<![A-Za-z0-9])(?=[0-9OolI]*[0-9])[0-9OolI]+(?![A-Za-z0-9])")
_NUMBER_BEFORE_UNIT = re.compile(
    r"(?<![A-Za-z0-9])(?=[0-9OolI]*[0-9])[0-9OolI]+"
    r"(?=\s?(?i:mg|mcg|ug|gm|g|ml|iu|units?|tabs?|caps?|days?|d|weeks?|w)\b)"
)
_LOOKALIKES = str.maketrans("OolI", "0011")


def _fix_digits(line: str) -> str:
    def repair(match: re.Match) -> str:
        return match.group(0).translate(_LOOKALIKES)

    return _NUMBER_LIKE.sub(repair, _NUMBER_BEFORE_UNIT.sub(repair, line))


def normalise_text(text: str) -> str:
    """Flatten the typographic variants and misreads OCR engines emit."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    for old, new in (
        ("µ", "u"), ("μ", "u"), ("½", "1/2"), ("¼", "1/4"), ("¾", "3/4"),
        ("–", "-"), ("—", "-"), ("−", "-"), ("×", "x"), ("℞", "Rx"), ("’", "'"),
    ):  # fmt: skip
        text = text.replace(old, new)
    # A pipe touching a hyphen is a misread 1 in "1-0-1"; any other pipe is a
    # ruled line or table border and carries no meaning.
    text = re.sub(r"(?<=-)\||\|(?=-)", "1", text)
    text = text.replace("|", " ").replace("~", " ")

    lines = []
    for line in text.split("\n"):
        line = _fix_digits(_WS.sub(" ", line).strip())
        lines.append(re.sub(r"^[_`'\"<>«»\s]+", "", line))
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------

_DATE_NUMERIC = re.compile(r"\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b")
_DATE_ISO = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_DATE_DAY_MONTH_NAME = re.compile(
    r"\b(\d{1,2})(?:st|nd|rd|th)?[\s\-]+([A-Za-z]{3,9})\.?,?[\s\-]+(\d{2,4})\b"
)
_DATE_MONTH_NAME_DAY = re.compile(r"\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b")


def _year(value: str) -> int:
    year = int(value)
    return 2000 + year if year < 100 else year


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None


def parse_date(text: str) -> date | None:
    """Find the first date in `text`.

    Numeric dates are read day-first (05/09/2026 is 5 September). That is the
    convention on the prescriptions this platform targets, and it is only
    ambiguous when both numbers are 12 or under - when the second number is
    above 12 it can only be a day, so the reading is flipped.
    """
    if m := _DATE_ISO.search(text):
        return _safe_date(int(m[1]), int(m[2]), int(m[3]))
    if m := _DATE_DAY_MONTH_NAME.search(text):
        month = MONTHS.get(m[2][:4].lower()) or MONTHS.get(m[2][:3].lower())
        if month:
            return _safe_date(_year(m[3]), month, int(m[1]))
    if m := _DATE_MONTH_NAME_DAY.search(text):
        month = MONTHS.get(m[1][:4].lower()) or MONTHS.get(m[1][:3].lower())
        if month:
            return _safe_date(_year(m[3]), month, int(m[2]))
    if m := _DATE_NUMERIC.search(text):
        first, second, year = int(m[1]), int(m[2]), _year(m[3])
        if second > 12 >= first:
            first, second = second, first
        return _safe_date(year, second, first)
    return None


# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

_DEGREES = re.compile(
    r"\b(?:MBBS|MD|MS|DNB|BDS|DM|MCh|FRCS|MRCP|PhD|BAMS|BHMS|Consultant|Physician|"
    r"Surgeon|General|Reg|Regn|Registration)\b.*$",
    re.I,
)
_DOCTOR = re.compile(r"\b(?:Dr|Doctor)\.?\s+([A-Z][A-Za-z.'\-]*(?:\s+[A-Z][A-Za-z.'\-]*){0,3})")
_CLINIC = re.compile(
    r"clinic|hospital|nursing home|medical (?:centre|center)|health ?care|diagnostic|polyclinic|pharmacy",
    re.I,
)
_PATIENT = re.compile(
    r"^(?:patient(?:'s)?\s*name|patient|name|pt\.?)\s*[:\-]\s*(?P<name>.+?)"
    r"(?:\s{2,}|\s+(?:age|sex|gender|date|dob|wt|weight|ph|mob)\b|[,(]|$)",
    re.I,
)
_REFERENCE = re.compile(
    r"\b(?:rx|prescription|presc)\.?\s*(?:no|number|id|#)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-]{2,})",
    re.I,
)
_VALID_UNTIL = re.compile(
    r"\b(?:valid\s*(?:till|until|upto|up to)|expiry|expires?|exp)\b\s*[:\-]?\s*(.+)", re.I
)
_VALID_FOR = re.compile(r"\bvalid\s*for\s*(\d{1,3})\s*(days?|weeks?|months?)\b", re.I)
_ISSUE_DATE = re.compile(r"\b(?:date|dated|dt)\b\s*[:\-]?\s*(.+)", re.I)

_UNIT_DAYS = {"d": 1, "day": 1, "days": 1, "w": 7, "week": 7, "weeks": 7, "wk": 7, "wks": 7,
              "m": 30, "mo": 30, "mos": 30, "month": 30, "months": 30}  # fmt: skip


def _parse_header(lines: list[str]) -> ParsedHeader:
    header = ParsedHeader()

    for line in lines[:8]:
        if not header.clinic_name and _CLINIC.search(line) and not _PATIENT.match(line):
            header.clinic_name = re.sub(r"^\W+|\W+$", "", line)[:120]

    for line in lines:
        if not header.doctor_name and (m := _DOCTOR.search(line)):
            name = _DEGREES.sub("", m.group(1)).strip(" .,-")
            if len(name) >= 2:
                header.doctor_name = f"Dr {name}"
        if not header.patient_name and (m := _PATIENT.match(line)):
            candidate = m.group("name").strip(" .,-")
            if candidate and not re.search(r"\d", candidate):
                header.patient_name = candidate[:120]
        if not header.reference_number and (m := _REFERENCE.search(line)):
            header.reference_number = m.group(1)[:64]

        if not header.expires_on and (m := _VALID_UNTIL.search(line)):
            header.expires_on = parse_date(m.group(1))
        if (
            not header.issued_on
            and (m := _ISSUE_DATE.search(line))
            and not _VALID_UNTIL.search(line)
        ):
            header.issued_on = parse_date(m.group(1))

    if header.issued_on is None:
        # A bare date on its own line, top of the page, is nearly always the issue date.
        for line in lines[:10]:
            if re.fullmatch(r"[\d/.\-\s]{6,}|.{0,12}\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}", line):
                header.issued_on = parse_date(line)
                if header.issued_on:
                    break

    if header.expires_on is None and header.issued_on:
        for line in lines:
            if m := _VALID_FOR.search(line):
                days = int(m.group(1)) * _UNIT_DAYS[m.group(2).lower()]
                header.expires_on = header.issued_on + timedelta(days=days)
                break

    return header


# ---------------------------------------------------------------------------
# Medicine blocks
# ---------------------------------------------------------------------------

_FORMS = {
    "tab": "Tablet", "tabs": "Tablet", "tablet": "Tablet", "tablets": "Tablet",
    "cap": "Capsule", "caps": "Capsule", "capsule": "Capsule", "capsules": "Capsule",
    "syp": "Syrup", "syrup": "Syrup", "susp": "Suspension", "suspension": "Suspension",
    "inj": "Injection", "injection": "Injection", "drop": "Drops", "drops": "Drops",
    "oint": "Ointment", "ointment": "Ointment", "cream": "Cream", "gel": "Gel",
    "lotion": "Lotion", "sachet": "Sachet", "powder": "Powder", "inhaler": "Inhaler",
    "spray": "Spray",
}  # fmt: skip

_FORM_WORDS = "|".join(sorted(_FORMS, key=len, reverse=True))
# "T." is common shorthand for "Tab."; the period is required so a bare T (as in
# the T3/T4 thyroid hormones) is never read as a tablet marker.
_LEADING_FORM = re.compile(
    rf"^\s*(?:\(?\d{{1,2}}[\).:]|[-*•])?\s*(?:(?P<qual>eye|ear|nasal|oral)\s+)?"
    rf"(?P<form>{_FORM_WORDS}|t(?=\.))\b\.?\s*",
    re.I,
)
# Words that can follow a form word *inside one medicine*: "500 mg tablet twice
# daily", "capsule after food", "tablet at bedtime". None of them is a drug name,
# so a form word followed by one of them is not the start of a second medicine.
_AFTER_FORM_NOT_A_NAME = (
    r"once|twice|thrice|daily|every|for|after|before|at|with|in|on|when|as|per|each|"
    r"morning|noon|afternoon|evening|night|bedtime|nightly|weekly|during"
)
# Two prescriptions lines run together ("Tab A 500 mg BD Tab B 1 mg OD"): a form
# word that follows something other than a number starts a new medicine. The
# number exclusion keeps "Tab Paracetamol 500 mg 1 tab TDS" as one.
_RUN_TOGETHER = re.compile(
    r"(?<=[^\d\s])(?<!\d\.)(?<!\d\))(?<!\d:)"
    r"(?<!\beye)(?<!\bear)(?<!\bnasal)(?<!\boral)"  # "Eye drops" is one form, not two medicines
    rf"\s+(?=(?:{_FORM_WORDS})\b\.?\s+(?!(?:{_AFTER_FORM_NOT_A_NAME})\b)[A-Za-z]{{3,}})",
    re.I,
)
_NUMBERED = re.compile(r"^\s*\(?\d{1,2}[\).:]\s+(?=[A-Za-z])")

_HEADER_LINE = re.compile(
    r"^\s*(?:date|dated|name|patient|age|sex|gender|wt|weight|ht|height|bp|pulse|temp|spo2|reg|"
    r"regn|dr|doctor|address|phone|ph|mob|mobile|tel|email|signature|sign|follow|review|advice|"
    r"diagnosis|dx|c/o|allerg|hospital|clinic|diet|note|notes|valid|expiry|rx\s*(?:no|#)|opd|uhid|"
    r"consultant|timing|timings|visit|next)\b",
    re.I,
)
_RX_MARK = re.compile(r"^\s*(?:Rx|R/)\b\.?:?\s*(.*)$", re.I)

_NUM = r"(?:\d{1,2}(?:\.\d+)?|\d/\d|[lIOo])"
_TRIPLE = re.compile(
    rf"(?<![\w/.])({_NUM})\s*-\s*({_NUM})\s*-\s*({_NUM})(?:\s*-\s*({_NUM}))?(?![\w/])"
)
_DATE_LIKE = re.compile(r"\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b")

_STRENGTH = re.compile(
    r"(?P<num>\d+(?:\.\d+)?(?:\s*/\s*\d+(?:\.\d+)?)?)\s*"
    r"(?P<unit>mcg|ug|mg|gm|iu|units?|g|%)(?![a-z])"
    r"(?:\s*/\s*(?P<per>\d+(?:\.\d+)?)?\s*(?P<per_unit>ml|g)(?![a-z]))?",
    re.I,
)
_DOSE_QTY = re.compile(
    r"(?<![\d./-])(?P<q>\d+(?:\.\d+)?|1/2|1/4|3/4)\s*"
    r"(?P<u>tabs?|tablets?|caps?|capsules?|ml|drops?|puffs?|sachets?|units?)\b",
    re.I,
)

_FREQ_ONCE = re.compile(
    r"\b(?:OD|QD|q\.?d\.?|once\s+(?:a\s+|per\s+)?(?:day|daily)|once\s+daily|daily|1\s*x\s*(?:a\s+)?day|one\s+time\s+daily)\b",
    re.I,
)
_FREQ_TWICE = re.compile(
    r"\b(?:BD|BID|B\.?D\.?|twice\s+(?:a\s+)?(?:day|daily)|two\s+times\s+(?:a\s+)?day|2\s*times\s+(?:a\s+)?day|2\s*x\s*(?:a\s+)?day)\b",
    re.I,
)
_FREQ_THRICE = re.compile(
    r"\b(?:TDS|TID|T\.?D\.?S\.?|thrice(?:\s+(?:a\s+)?day)?|three\s+times\s+(?:a\s+)?(?:day|daily)|3\s*times\s+(?:a\s+)?day|3\s*x\s*(?:a\s+)?day)\b",
    re.I,
)
_FREQ_FOUR = re.compile(
    r"\b(?:QID|QDS|four\s+times\s+(?:a\s+)?(?:day|daily)|4\s*times\s+(?:a\s+)?day|4\s*x\s*(?:a\s+)?day)\b",
    re.I,
)
_FREQ_EVERY = re.compile(r"\b(?:every|q)\s*(\d{1,2})\s*(?:h|hr|hrs|hours?)\b", re.I)
_AS_NEEDED = re.compile(
    r"\b(?:SOS|PRN|as\s+needed|when\s+required|if\s+required|when\s+needed|as\s+required)\b", re.I
)
_FREQ_WEEKLY = re.compile(
    r"\b(?:once\s+(?:a\s+)?week(?:ly)?|weekly|every\s+week|1\s*/\s*week|1\s*x\s*(?:a\s+)?week)\b",
    re.I,
)
_FREQ_ALTERNATE = re.compile(
    r"\b(?:on\s+)?(?:alternate|alt\.?)\s+days?\b|\bevery\s+other\s+day\b", re.I
)
_ON_DAYS = re.compile(
    r"\b(?:on|every)\s+((?:(?:mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?|sun)(?:day)?s?\b[\s,&/.]*(?:and\s+)?)+)",
    re.I,
)
_WEEKDAYS = {"mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6, "sun": 7}

_SLOT_WORDS = (
    (MORNING, re.compile(r"\b(?:morning|mane|breakfast)\b", re.I)),
    (AFTERNOON, re.compile(r"\b(?:afternoon|noon|lunch)\b", re.I)),
    (EVENING, re.compile(r"\b(?:evening|tea\s*time)\b", re.I)),
    (NIGHT, re.compile(r"\b(?:night|nocte|bed\s*time|H\.?S\.?|dinner)\b", re.I)),
)

_DURATION_PREFIXED = re.compile(
    r"\b(?:x|for(?:\s+next)?|next)\s*(\d{1,3})\s*(days?|d|weeks?|wks?|w|months?|mos?)\b", re.I
)
_DURATION_BARE = re.compile(r"\b(\d{1,3})\s*(days?|weeks?|wks?|months?)\b", re.I)

_TOTAL_MARKED = re.compile(
    r"(?:#|qty\.?|quantity|disp(?:ense)?\.?|no\.?\s+of\s+(?:tabs?|tablets?|caps?|capsules?))\s*[:=]?\s*(\d{1,4})\b",
    re.I,
)

_INSTRUCTIONS_CI = (
    (
        re.compile(r"\b(?:after|post)\s*(?:food|meals?|breakfast|lunch|dinner)\b", re.I),
        "After food",
    ),
    (
        re.compile(r"\b(?:before|pre)\s*(?:food|meals?|breakfast|lunch|dinner)\b", re.I),
        "Before food",
    ),
    (re.compile(r"\bwith\s+(?:food|meals?)\b", re.I), "With food"),
    (re.compile(r"\bempty\s+stomach\b", re.I), "On an empty stomach"),
    (re.compile(r"\b(?:with|in)\s+(?:a\s+glass\s+of\s+)?water\b", re.I), "With water"),
    (re.compile(r"\bwith\s+milk\b", re.I), "With milk"),
    (re.compile(r"\bat\s+bed\s*time\b", re.I), "At bedtime"),
)
# Uppercase-only: "ac" and "pc" are ordinary letter runs in lower case.
_INSTRUCTIONS_CS = (
    (re.compile(r"\bPC\b"), "After food"),
    (re.compile(r"\bAC\b"), "Before food"),
)


def _to_decimal(token: str) -> Decimal:
    """Read a per-slot quantity, tolerating fractions and OCR letter/digit mix-ups."""
    token = token.strip()
    if token in {"l", "I"}:
        return Decimal("1")
    if token in {"O", "o"}:
        return Decimal("0")
    if "/" in token:
        top, bottom = token.split("/", 1)
        return Decimal(top) / Decimal(bottom)
    try:
        return Decimal(token)
    except InvalidOperation:
        return Decimal("0")


def _strength_of(text: str) -> tuple[str, str, tuple[int, int] | None]:
    for match in _STRENGTH.finditer(text):
        unit = match.group("unit").lower()
        unit = {"gm": "g", "unit": "units"}.get(unit, unit)
        if unit == "units" and not match.group("per_unit"):
            # "20 units at bedtime" is a dose of insulin, not a strength. Only
            # a concentration such as "100 units/ml" describes the product.
            continue
        if match.group("per_unit"):
            per = match.group("per") or ""
            unit = f"{unit}/{per}{'mL' if match.group('per_unit').lower() == 'ml' else 'g'}"
        number = re.sub(r"\s+", "", match.group("num"))
        return number, unit, match.span()
    return "", "", None


def _parse_frequency(text: str, block: ParsedMedicine) -> tuple[int, int] | None:
    """Fill `block.slots` from whatever frequency notation the line uses.

    Returns the span of the notation, so the caller can cut the drug name off
    in front of it.
    """
    if _AS_NEEDED.search(text):
        block.as_needed = True
        block.reasons.append("Taken only when needed, so no fixed reminder times are set.")
        match = _AS_NEEDED.search(text)
        return match.span() if match else None

    # Not every day. These matter more than the daily forms: a medicine taken
    # weekly (alendronate, methotrexate) read as daily is a dangerous mistake,
    # so it is recognised explicitly rather than falling through to "no times".
    named = [slot for slot, pattern in _SLOT_WORDS if pattern.search(text)]
    if match := _ON_DAYS.search(text):
        days = sorted(
            {
                _WEEKDAYS[w[:3].lower()]
                for w in re.findall(r"[A-Za-z]+", match.group(1))
                if w[:3].lower() in _WEEKDAYS
            }
        )
        if days:
            block.frequency, block.days_of_week = "SPECIFIC_DAYS", days
            block.slots = [SlotDose(named[0] if named else MORNING)]
            if not named:
                block.reasons.append(
                    "No time of day is printed for these days, so morning was assumed."
                )
            return match.span()
    weekly, alternate = _FREQ_WEEKLY.search(text), _FREQ_ALTERNATE.search(text)
    if weekly or alternate:
        block.frequency = "INTERVAL"
        block.interval_days = 7 if weekly else 2
        block.slots = [SlotDose(named[0] if named else MORNING)]
        if weekly:
            block.reasons.append(
                "Taken once a week. The day is not printed, so it starts today. "
                "Change the start date to the day you take it."
            )
        if not named:
            block.reasons.append("No time of day is printed, so morning was assumed.")
        return (weekly or alternate).span()

    if match := _TRIPLE.search(_DATE_LIKE.sub(" " * 8, text)):
        parts = [g for g in match.groups() if g is not None]
        slots = (
            (MORNING, AFTERNOON, EVENING, NIGHT) if len(parts) == 4 else (MORNING, AFTERNOON, NIGHT)
        )
        for slot, token in zip(slots, parts, strict=True):
            quantity = _to_decimal(token)
            if quantity > 0:
                block.slots.append(SlotDose(slot, quantity))
        return match.span()

    if match := _FREQ_FOUR.search(text):
        block.slots = [SlotDose(s) for s in SLOT_ORDER]
        return match.span()
    if match := _FREQ_THRICE.search(text):
        block.slots = [SlotDose(MORNING), SlotDose(AFTERNOON), SlotDose(NIGHT)]
        return match.span()
    if match := _FREQ_TWICE.search(text):
        block.slots = [SlotDose(MORNING), SlotDose(NIGHT)]
        return match.span()

    if match := _FREQ_EVERY.search(text):
        hours = int(match.group(1))
        per_day = max(1, round(24 / hours)) if hours else 1
        chosen = {
            1: (MORNING,), 2: (MORNING, NIGHT), 3: (MORNING, AFTERNOON, NIGHT),
        }.get(per_day, SLOT_ORDER)  # fmt: skip
        block.slots = [SlotDose(s) for s in chosen]
        if per_day > 4 or hours not in {6, 8, 12, 24}:
            block.reasons.append(
                f"'Every {hours} hours' does not map cleanly onto morning/afternoon/evening/night "
                "slots. Check the dose times."
            )
        return match.span()

    named = [slot for slot, pattern in _SLOT_WORDS if pattern.search(text)]
    once = _FREQ_ONCE.search(text)
    if len(named) >= 2 or (named and not once):
        block.slots = [SlotDose(s) for s in named]
        first = min((p.search(text).start() for s, p in _SLOT_WORDS if s in named), default=0)
        return (first, first + 1)
    if once:
        chosen_slot = named[0] if named else MORNING
        if not named:
            block.reasons.append("Written as once daily with no time, so morning was assumed.")
        block.slots = [SlotDose(chosen_slot)]
        return once.span()
    return None


def _parse_duration(text: str) -> tuple[int | None, tuple[int, int] | None]:
    match = _DURATION_PREFIXED.search(text) or _DURATION_BARE.search(text)
    if not match:
        return None, None
    count = int(match.group(1))
    unit = match.group(2).lower()
    days = count * _UNIT_DAYS.get(unit, 1)
    return (days if days > 0 else None), match.span()


def _instructions_of(text: str) -> str:
    found: list[str] = []
    for pattern, label in (*_INSTRUCTIONS_CI, *_INSTRUCTIONS_CS):
        if pattern.search(text) and label not in found:
            found.append(label)
    return ", ".join(found)


_SMALL_WORDS = {"and", "with", "of", "plus", "in", "for"}


def _tidy_word(word: str) -> str:
    """Repair a drug-name token: OCR digit look-alikes, then capitalisation."""
    letters = sum(c.isalpha() for c in word)
    digits = [c for c in word if c.isdigit()]
    # "Metf0rmin": a stray 0, 1 or 5 inside a long alphabetic token is a
    # misread letter. Short tokens are left alone - "D3" and "B12" are real.
    if letters >= 4 and 0 < len(digits) <= 2 and set(digits) <= set("015") and word.isalnum():
        word = word.translate(str.maketrans("015", "ols"))
    if len(word) >= 3 and word.lower() not in _SMALL_WORDS and (word.isupper() or word.islower()):
        return word.capitalize()
    return word


def _clean_name(raw: str) -> str:
    name = re.sub(r"[\s(\[{,;:\-.]+$", "", raw)
    name = re.sub(r"^[\s(\[{,;:\-.]+", "", name)
    name = re.sub(r"\s{2,}", " ", name)
    return " ".join(_tidy_word(word) for word in name.split(" "))


def _parse_block(text: str) -> ParsedMedicine:
    block = ParsedMedicine(raw_line=text)
    working = text

    if match := _LEADING_FORM.match(working):
        block.form = _FORMS.get(match.group("form").lower(), "Tablet")
        if match.group("qual"):
            block.form = f"{match.group('qual').title()} {block.form}"
        working = working[match.end() :]
    else:
        working = _NUMBERED.sub("", working, count=1)

    number, unit, strength_span = _strength_of(working)
    block.strength, block.strength_unit = number, unit

    # "Metformin 500 mg tablet twice daily": the form can follow the strength.
    if not block.form and strength_span:
        trailing = re.match(rf"\s*(?P<form>{_FORM_WORDS})\b", working[strength_span[1] :], re.I)
        if trailing:
            block.form = _FORMS.get(trailing.group("form").lower(), "Tablet")

    freq_span = _parse_frequency(_DATE_LIKE.sub(" ", working), block)

    duration, duration_span = _parse_duration(working)
    block.duration_days = duration

    block.instructions = _instructions_of(working)

    marked_total = _TOTAL_MARKED.search(working)
    if marked_total:
        block.total_quantity = Decimal(marked_total.group(1))

    # Per-dose quantities for abbreviation-style frequencies ("2 tabs BD").
    # A triple like 1-0-1 already carries its own quantities.
    if block.slots and not _TRIPLE.search(_DATE_LIKE.sub(" ", working)):
        without_strength = working
        if strength_span:
            without_strength = (
                working[: strength_span[0]]
                + " " * (strength_span[1] - strength_span[0])
                + working[strength_span[1] :]
            )
        if dose := _DOSE_QTY.search(without_strength):
            amount = _to_decimal(dose.group("q"))
            if amount > 0:
                block.slots = [SlotDose(s.slot, amount) for s in block.slots]
    elif not block.slots and not block.as_needed and block.total_quantity is None:
        without_strength = working
        if strength_span:
            without_strength = (
                working[: strength_span[0]]
                + " " * (strength_span[1] - strength_span[0])
                + working[strength_span[1] :]
            )
        if dose := _DOSE_QTY.search(without_strength):
            block.total_quantity = _to_decimal(dose.group("q"))

    if block.total_quantity is None and block.duration_days and block.slots:
        occasions = block.doses_in_course(block.duration_days)
        block.total_quantity = block.units_per_day * occasions
        block.reasons.append(
            f"Quantity worked out as {block.total_quantity:g} "
            f"({block.units_per_day:g} on each of {occasions} dosing days), not printed on the page."
        )

    cut_points = [span[0] for span in (strength_span, freq_span, duration_span) if span is not None]
    if marked_total:
        cut_points.append(marked_total.start())
    if dose_match := _DOSE_QTY.search(working):
        cut_points.append(dose_match.start())
    name_source = working[: min(cut_points)] if cut_points else working
    block.name = _clean_name(name_source)

    # "Dolo 650": a bare trailing number with no unit is a strength, not a name.
    if not block.strength and (m := re.search(r"\s+(\d{2,4})$", block.name)):
        block.strength = m.group(1)
        block.name = block.name[: m.start()].strip()
        block.reasons.append("Strength has no unit on the page. Check it before saving.")

    if not block.slots and not block.as_needed:
        block.reasons.append("No dose times found. Add them before saving.")
    return block


def _is_start(line: str) -> bool:
    if not line or _HEADER_LINE.match(line):
        return False
    if _LEADING_FORM.match(line):
        return True
    has_strength = bool(_STRENGTH.search(line))
    if _NUMBERED.match(line) and (has_strength or _TRIPLE.search(line)):
        return True
    return has_strength and bool(re.match(r"^\s*[A-Za-z]{3,}", line))


def _looks_like_continuation(line: str) -> bool:
    return bool(
        _FREQ_WEEKLY.search(line)
        or _FREQ_ALTERNATE.search(line)
        or _ON_DAYS.search(line)
        or _TRIPLE.search(_DATE_LIKE.sub(" ", line))
        or _FREQ_ONCE.search(line)
        or _FREQ_TWICE.search(line)
        or _FREQ_THRICE.search(line)
        or _FREQ_FOUR.search(line)
        or _FREQ_EVERY.search(line)
        or _AS_NEEDED.search(line)
        or _DURATION_PREFIXED.search(line)
        or _DURATION_BARE.search(line)
        or _TOTAL_MARKED.search(line)
        or _instructions_of(line)
    )


def _split_run_together(lines: list[str]) -> list[str]:
    parts: list[str] = []
    for line in lines:
        parts.extend(part for part in _RUN_TOGETHER.split(line) if part)
    return parts


def _group_blocks(lines: list[str]) -> list[str]:
    blocks: list[str] = []
    in_rx = False
    for line in _split_run_together(lines):
        if not line:
            continue
        rx = _RX_MARK.match(line)
        if rx:
            in_rx = True
            line = rx.group(1).strip()
            if not line:
                continue

        if _is_start(line) or (
            in_rx and not _HEADER_LINE.match(line) and re.match(r"^\s*[A-Za-z]{3,}", line)
        ):
            blocks.append(line)
        elif blocks and not _HEADER_LINE.match(line) and _looks_like_continuation(line):
            blocks[-1] = f"{blocks[-1]} {line}"
    return blocks


def parse_prescription_text(text: str) -> ParsedPrescription:
    """Parse the OCR text of a prescription."""
    lines = normalise_text(text).split("\n")
    header = _parse_header(lines)

    medicines = []
    for raw in _group_blocks(lines):
        block = _parse_block(raw)
        # A name of one or two characters is the OCR reading a stray mark.
        if len(block.name) >= 3:
            medicines.append(block)

    warnings: list[str] = []
    if not medicines:
        warnings.append("No medicines could be read from this text.")
    return ParsedPrescription(header=header, medicines=medicines, warnings=warnings)


# ---------------------------------------------------------------------------
# Medicine boxes and strips
# ---------------------------------------------------------------------------

_LABEL_FORM = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/&]{2,60}?)\s+(?:film[\s-]*coated\s+|extended[\s-]*release\s+)?"
    r"(?P<form>tablets?|capsules?|syrup|suspension|injection|drops|ointment|cream|gel)\b",
    re.I,
)
_LABEL_EXPIRY = re.compile(
    r"\b(?:exp(?:iry)?\.?(?:\s*date)?|use\s+before|best\s+before)\s*[:.\-]?\s*"
    r"(\d{1,2}\s*[/\-]\s*\d{2,4}|[A-Za-z]{3,9}\.?\s*[,\-]?\s*\d{2,4})",
    re.I,
)
_LABEL_PACK = re.compile(
    r"(?<!each\s)(?<!contains\s)\b(\d{1,4})\s*(?:'s|tablets?|tabs?|capsules?|caps)\b", re.I
)


def _parse_month_year(text: str) -> date | None:
    text = text.strip()
    if m := re.match(r"(\d{1,2})\s*[/\-]\s*(\d{2,4})$", text):
        month, year = int(m.group(1)), _year(m.group(2))
    elif m := re.match(r"([A-Za-z]{3,9})\.?\s*[,\-]?\s*(\d{2,4})$", text):
        month = MONTHS.get(m.group(1)[:4].lower()) or MONTHS.get(m.group(1)[:3].lower())
        year = _year(m.group(2))
        if not month:
            return None
    else:
        return None
    if not 1 <= month <= 12:
        return None
    # Printed expiry is a month; the medicine is good until the end of it.
    last = _safe_date(year + (month == 12), (month % 12) + 1, 1)
    return last - timedelta(days=1) if last else None


def parse_medicine_label(text: str) -> ParsedPrescription:
    """Parse the OCR text of a medicine box or blister strip.

    A box carries a name, strength, form, pack size and expiry - but no dosing
    instructions, so the result has no schedule and the patient adds one.
    """
    lines = [ln for ln in normalise_text(text).split("\n") if ln]
    block = ParsedMedicine(raw_line=" | ".join(lines[:4]))
    warnings: list[str] = []

    for line in lines:
        number, unit, _span = _strength_of(line)
        if (m := _LABEL_FORM.match(line)) and not block.name:
            block.name = _clean_name(m.group("name"))
            block.form = _FORMS[
                (
                    m.group("form").lower().rstrip("s")
                    if m.group("form").lower() not in _FORMS
                    else m.group("form").lower()
                )
            ]
            if number:
                block.strength, block.strength_unit = number, unit
        elif number and not block.strength and not block.name:
            block.name = _clean_name(line[: _STRENGTH.search(line).start()])
            block.strength, block.strength_unit = number, unit
        elif number and not block.strength:
            block.strength, block.strength_unit = number, unit

    if not block.name and lines:
        block.name = _clean_name(lines[0])
        block.reasons.append("Name taken from the first line of the label. Check it.")

    for line in lines:
        if m := _LABEL_PACK.search(line):
            block.total_quantity = Decimal(m.group(1))
            break
    block.reasons.append("A box has no dosing instructions. Add the times you take it.")

    expiry = None
    for line in lines:
        if m := _LABEL_EXPIRY.search(line):
            expiry = _parse_month_year(m.group(1))
            break
    if expiry and expiry < date.today():
        warnings.append(
            f"This medicine appears to have expired on {expiry:%d %b %Y}. Do not take it."
        )

    header = ParsedHeader(expires_on=expiry)
    if not block.name:
        return ParsedPrescription(header, [], ["No medicine name could be read from this label."])
    return ParsedPrescription(header=header, medicines=[block], warnings=warnings)
