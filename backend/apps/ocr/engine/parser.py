"""
Multi-medicine prescription parser (rule-based, for PRINTED text from Tesseract).

Handles three layouts seen in real prescriptions:
  * list style      "1. Tab. Metformin 500 mg  1-0-1 after food x 30 days"
  * table style     "1) TAB. DEMO MEDICINE 1  1 Morning, 1 Night  10 Days  (Tot:20 Tab)"
  * pharmacy label  "ATENOLOL 100 MG TABS ... TAKE 1 TABLET BY MOUTH BEFORE BEDTIME ... Quantity 30"

Returns ONE ITEM PER MEDICINE. Handwriting is NOT handled here - see vision.py / pipeline.py.
Drop into: backend/apps/ocr/services/parser.py   (pure Python, no Django needed)
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from difflib import get_close_matches

# ---------- vocab -----------------------------------------------------------
FORMS = r"(?:tab(?:let)?s?|cap(?:sule)?s?|syp|syrup|inj(?:ection)?|oint(?:ment)?|drops?|susp(?:ension)?|cream|gel)"
UNITS = r"(?:mg|mcg|µg|ug|g|ml|iu|%)"
STRENGTH_RE = re.compile(rf"(\d+(?:\.\d+)?)\s*({UNITS})(?![a-z])", re.IGNORECASE)
FORM_PREFIX_RE = re.compile(
    rf"^\s*(?:\d{{1,2}}\s*[.)\-:]\s*)?(?P<form>{FORMS})\b\.?,?\s*", re.IGNORECASE
)
NUMBERED_RE = re.compile(r"^\s*\d{1,2}\s*[.)\-:]\s+\S")
HEADER_RE = re.compile(
    r"^\s*(?:dr\.?\s|doctor|patient|name\s*:|age|sex|gender|date|dob|mbbs|m\.b\.b\.s|md\b|reg|clinic|hospital|"
    r"address|phone|ph\b|mob|diagnosis|dx|c/o|signature|sign\b|rx\s*$|℞|id\s*:|temp)",
    re.IGNORECASE,
)
# once these appear, the medicine list is over (stops footer/charts being glued to the last medicine)
STOP_RE = re.compile(
    r"^\s*(?:advice|follow\s*-?\s*up|charts?\b|signature|physician|note\s*:)", re.IGNORECASE
)

WORD_NUMS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "twelve": 12,
    "fourteen": 14,
    "fifteen": 15,
    "twenty": 20,
    "thirty": 30,
}
NUMWORD = "|".join(WORD_NUMS)

FREQ_WORDS = [
    (r"\b(?:once|1\s*(?:time|x))\s*(?:a|per)?\s*(?:day|daily)\b|\bod\b|\bqd\b", 1),
    (r"\b(?:twice|2\s*(?:times?|x))\s*(?:a|per)?\s*(?:day|daily)?\b|\bbd\b|\bbid\b", 2),
    (
        r"\b(?:thrice|3\s*(?:times?|x)|three\s*times)\s*(?:a|per)?\s*(?:day|daily)?\b|\btds\b|\btid\b",
        3,
    ),
    (r"\b(?:4\s*(?:times?|x)|four\s*times)\s*(?:a|per)?\s*(?:day|daily)?\b|\bqid\b", 4),
]
SLOT_NAMES = ("morning", "afternoon", "night")
PATTERN_RE = re.compile(
    r"(?<![\d.])(\d(?:\.\d)?|½)\s*-\s*(\d(?:\.\d)?|½)\s*-\s*(\d(?:\.\d)?|½)(?:\s*-\s*(\d(?:\.\d)?|½))?(?![\d])"
)

# table style "1 Morning, 1/2 Night" - tolerant of OCR slips (Moming, A&, Aft)
SLOT_RE = re.compile(
    r"(?<![\d/])(\d+/\d+|\d+(?:\.\d+)?|½)\s*"
    r"(mo[rm]{1,2}n?i?ng|morn|aft(?:ernoon)?|a&|noon|eve(?:ning)?|night|bed\s*time)(?![a-z])",
    re.IGNORECASE,
)
SLOT_CANON = {
    "mo": "morning",
    "af": "afternoon",
    "a&": "afternoon",
    "no": "afternoon",
    "ev": "evening",
    "ni": "night",
    "be": "night",
}

DURATION_RE = re.compile(
    rf"(?:\bx|\bfor|×)\s*(\d+|{NUMWORD})\s*(days?|d|weeks?|wks?|months?|mos?)\b"
    rf"|\b(\d+|{NUMWORD})\s*(days?|weeks?|months?)\b",
    re.IGNORECASE,
)
QTY_RE = re.compile(r"(?:qty|quantity|#|tot(?:al)?|disp(?:ense)?)\s*[:=.]?\s*(\d+)", re.IGNORECASE)
PER_DOSE_RE = re.compile(rf"(\d+(?:\.\d)?|½|one|two|half)\s*(?:{FORMS})\b", re.IGNORECASE)
FOOD_RE = re.compile(
    r"\b(?:before|after|with)\s+(?:food|meals?|breakfast|lunch|dinner)\b|empty stomach",
    re.IGNORECASE,
)
FOOD_OCR_FIX = re.compile(r"\b8efore\b", re.IGNORECASE)
DOCTOR_RE = re.compile(r"\bDr\.?\s+([A-Z][A-Za-z.]*(?:\s+[A-Z][A-Za-z.]*){0,2})", re.MULTILINE)
DATE_RE = re.compile(r"\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\b")
EXPIRY_RE = re.compile(
    r"(?:expires?|exp\.?|use\s*by)\s*[:.]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})", re.IGNORECASE
)
REFILLS_RE = re.compile(
    r"refills?\s*(?:remaining)?\s*[:.]?\s*(\d+)(?:\s*of\s*(\d+))?", re.IGNORECASE
)
FRAC = {"½": 0.5, "one": 1.0, "two": 2.0, "half": 0.5}


def _num(tok: str) -> float:
    t = tok.lower()
    if t in FRAC:
        return FRAC[t]
    if "/" in t:
        a, b = t.split("/")
        return float(a) / float(b)
    return float(t)


# ---------- output ----------------------------------------------------------
@dataclass
class Medicine:
    name: str = ""
    strength: str = ""
    form: str = ""
    units_per_dose: float = 1.0
    doses_per_day: float | None = None  # None => "as needed" / unknown
    times_of_day: list[str] = field(default_factory=list)
    duration_days: int | None = None
    quantity: int | None = None
    quantity_source: str = ""  # "printed" | "calculated" | ""
    food_instruction: str = ""
    as_needed: bool = False
    confidence: float = 0.0
    needs_review: bool = True
    warnings: list[str] = field(default_factory=list)
    raw_text: str = ""

    def to_dict(self):
        return asdict(self)


def score(med: Medicine) -> None:
    s = 0.35 if med.name else 0.0
    s += 0.20 if med.strength else 0
    s += 0.25 if (med.doses_per_day or med.as_needed) else 0
    s += 0.20 if med.quantity else 0
    med.confidence = round(s, 2)
    med.needs_review = med.confidence < 0.8 or len(med.name) < 3 or bool(med.warnings)


# ---------- block splitting -------------------------------------------------
def _is_medicine_start(line: str) -> bool:
    if not line.strip() or HEADER_RE.match(line):
        return False
    if FORM_PREFIX_RE.match(line) or NUMBERED_RE.match(line):
        return True
    return bool(
        re.match(
            rf"^\s*[A-Za-z][A-Za-z\-]{{2,}}(?:\s+[A-Za-z\-]+)?\s+\d+(?:\.\d+)?\s*{UNITS}\b",
            line,
            re.IGNORECASE,
        )
    )


def split_blocks(text: str) -> list[str]:
    """One block per medicine; wrapped lines ('1-0-1 after food x 30 days') join the block above."""
    blocks: list[list[str]] = []
    open_ = True
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if STOP_RE.match(line):
            open_ = False
            continue
        if _is_medicine_start(line):
            blocks.append([line])
            open_ = True
        elif blocks and open_ and not HEADER_RE.match(line):
            blocks[-1].append(line)
    return [" ".join(b) for b in blocks]


# ---------- field extraction ------------------------------------------------
def _parse_frequency(block: str, med: Medicine) -> None:
    slots = SLOT_RE.findall(block)
    if slots:  # table style: "1 Morning, 1 Night"
        vals = [_num(v) for v, _ in slots]
        med.times_of_day = [
            SLOT_CANON.get(re.sub(r"\s", "", n.lower())[:2], "morning") for _, n in slots
        ]
        med.doses_per_day = len(slots)
        if len(set(vals)) == 1:
            med.units_per_dose = vals[0]
        return
    m = PATTERN_RE.search(block)
    if m:  # "1-0-1"
        vals = [0.5 if v == "½" else float(v) for v in m.groups() if v is not None]
        med.times_of_day = [SLOT_NAMES[i] for i, v in enumerate(vals[:3]) if v > 0]
        if len(vals) == 4 and vals[3] > 0:
            med.times_of_day.append("bedtime")
        nonzero = [v for v in vals if v > 0]
        med.doses_per_day = len(nonzero)
        if nonzero and len(set(nonzero)) == 1:
            med.units_per_dose = nonzero[0]
        return
    if re.search(r"\b(sos|prn|as\s+needed|when\s+required)\b", block, re.IGNORECASE):
        med.as_needed, med.doses_per_day = True, None
        return
    if re.search(
        r"\b(hs|at\s+bed\s*time|before\s+bed\s*time|bedtime|at\s+night)\b", block, re.IGNORECASE
    ):
        med.doses_per_day, med.times_of_day = 1, ["night"]
        return
    for pat, n in FREQ_WORDS:
        if re.search(pat, block, re.IGNORECASE):
            med.doses_per_day = n
            med.times_of_day = {
                1: ["morning"],
                2: ["morning", "night"],
                3: ["morning", "afternoon", "night"],
                4: ["morning", "afternoon", "night", "bedtime"],
            }[n]
            return


def _parse_duration(block: str) -> int | None:
    m = DURATION_RE.search(block)
    if not m:
        return None
    raw = (m.group(1) or m.group(3)).lower()
    n = WORD_NUMS.get(raw) or int(raw)
    unit = (m.group(2) or m.group(4)).lower()
    return n * (30 if unit.startswith("mo") else 7 if unit.startswith("w") else 1)


def parse_block(block: str, known: list[str] | None = None) -> Medicine:
    med = Medicine(raw_text=block)
    block = FOOD_OCR_FIX.sub("before", block)

    body = re.sub(r"^\s*\d{1,2}\s*[.)\-:]\s*", "", block)  # strip "1." / "2)"
    fm = FORM_PREFIX_RE.match(body)
    if fm:
        f = fm.group("form").lower()
        med.form = "tab" if f.startswith("tab") else "cap" if f.startswith("cap") else f
        body = body[fm.end() :]

    slot = SLOT_RE.search(body)
    strength_m = STRENGTH_RE.search(body)
    if slot and (not strength_m or slot.start() < strength_m.start()):
        name = body[: slot.start()].strip(" ,-")  # table style: keep "Medicine 1"
    else:
        nm = re.match(
            r"\s*([A-Za-z][A-Za-z\-]*(?:\s*\+\s*[A-Za-z][A-Za-z\-]*|\s+[A-Za-z][A-Za-z\-]*)*)\s*(?=\d|$|,|\()",
            body,
        )
        name = (nm.group(1) if nm else "").strip()
    name = re.sub(
        r"\b(?:after|before|with|daily|twice|once|sos|od|bd|tds|qid|hs|take)\b.*$",
        "",
        name,
        flags=re.IGNORECASE,
    ).strip()
    med.strength = "+".join(f"{n}{u.lower()}" for n, u in STRENGTH_RE.findall(body))

    if known and name:  # fix OCR typos: Metformln -> Metformin
        hit = get_close_matches(name.title(), known, n=1, cutoff=0.82)
        if hit:
            name = hit[0]
    med.name = name.title() if (name.islower() or name.isupper() or not known) else name

    _parse_frequency(body, med)
    med.duration_days = _parse_duration(body)
    pd = PER_DOSE_RE.search(body)
    if pd and not PATTERN_RE.search(body) and not SLOT_RE.search(body):
        med.units_per_dose = _num(pd.group(1))

    f = FOOD_RE.search(body)
    med.food_instruction = f.group(0).lower() if f else ""

    q = QTY_RE.search(body)
    if q:
        med.quantity, med.quantity_source = int(q.group(1)), "printed"
    if med.doses_per_day and med.duration_days:
        calc = round(med.units_per_dose * med.doses_per_day * med.duration_days)
        if med.quantity is None:
            med.quantity, med.quantity_source = calc, "calculated"
        elif med.quantity != calc:
            med.warnings.append(
                f"Printed quantity {med.quantity} differs from schedule x duration ({calc})."
            )
    score(med)
    return med


def _merge_duplicates(meds: list[Medicine]) -> list[Medicine]:
    """A label photographed twice (front/back) yields the same drug twice with complementary fields."""
    out: list[Medicine] = []
    for m in meds:
        twin = next(
            (
                o
                for o in out
                if o.name.lower() == m.name.lower()
                and o.strength == m.strength
                and not (o.doses_per_day and m.doses_per_day)
            ),
            None,
        )
        if not twin:
            out.append(m)
            continue
        for k in ("form", "food_instruction", "quantity_source"):
            if not getattr(twin, k):
                setattr(twin, k, getattr(m, k))
        for k in ("doses_per_day", "duration_days", "quantity"):
            if getattr(twin, k) is None:
                setattr(twin, k, getattr(m, k))
        twin.times_of_day = twin.times_of_day or m.times_of_day
        twin.as_needed = twin.as_needed or m.as_needed
        if not twin.quantity_source and twin.quantity:
            twin.quantity_source = "printed"
        score(twin)
    return out


def parse_prescription(text: str, known_medicines: list[str] | None = None) -> dict:
    meds = [m for m in (parse_block(b, known_medicines) for b in split_blocks(text)) if m.name]
    meds = _merge_duplicates(meds)
    doc = DOCTOR_RE.search(text)
    dt = DATE_RE.search(text)
    ex = EXPIRY_RE.search(text)
    rf = REFILLS_RE.search(text)
    return {
        "doctor": doc.group(0).strip() if doc else "",
        "prescription_date": dt.group(1) if dt else "",
        "expires_on": ex.group(1) if ex else "",
        "refills_remaining": int(rf.group(1)) if rf else None,
        "medicines": [m.to_dict() for m in meds],
        "medicine_count": len(meds),
        "needs_review": any(m.needs_review for m in meds) or not meds,
    }
