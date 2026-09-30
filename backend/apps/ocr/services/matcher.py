"""Match a name read off a prescription to an entry in the medicine catalogue.

The catalogue is the FDA National Drug Code Directory, so it uses US names.
Prescriptions in the markets this platform targets use the international
non-proprietary names (paracetamol, not acetaminophen) and local brands (Dolo,
Glycomet). A pure fuzzy match would therefore miss the single most prescribed
medicine there is. `ALIASES` bridges that gap for the names that matter.

Matching is deliberately conservative. A wrong match is worse than none: it
would silently attach the wrong strength and category to a patient's medicine.
So there are three outcomes - a confident match, a possible match the patient is
asked to confirm, and no match - and only the first is applied automatically.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher

AUTO_THRESHOLD = 0.86
#: Below this mean OCR confidence a catalogue match is only ever suggested, never
#: applied: the "name" may be a misread of a different real drug.
AUTO_APPLY_MIN_OCR_CONFIDENCE = 0.5
# Below this a candidate is not even offered. 0.75 rather than a looser floor
# because the catalogue is large and full of near-neighbours: at 0.70 a drug that
# is *not* in it (pirfenidone) is offered as propafenone.
POSSIBLE_THRESHOLD = 0.75

# Names with different spellings on each side of the Atlantic, plus the brands
# most often printed on prescriptions. Keys and values are single lower-case
# tokens unless noted. Extend this before reaching for anything cleverer.
ALIASES: dict[str, str] = {
    # International non-proprietary name -> name used in the US catalogue
    "paracetamol": "acetaminophen", "salbutamol": "albuterol", "frusemide": "furosemide",
    "rifampicin": "rifampin", "glibenclamide": "glyburide", "adrenaline": "epinephrine",
    "noradrenaline": "norepinephrine", "lignocaine": "lidocaine", "pethidine": "meperidine",
    "amoxycillin": "amoxicillin", "cotrimoxazole": "sulfamethoxazole", "isoprenaline": "isoproterenol",
    "thyroxine": "levothyroxine", "vit": "vitamin", "cyanocobalamin": "cyanocobalamin",
    "ecosprin": "aspirin", "acetylsalicylic": "aspirin",
    # Brands common on prescriptions
    "dolo": "acetaminophen", "crocin": "acetaminophen", "calpol": "acetaminophen",
    "glycomet": "metformin", "glucophage": "metformin", "telma": "telmisartan",
    "amlokind": "amlodipine", "norvasc": "amlodipine", "thyronorm": "levothyroxine",
    "eltroxin": "levothyroxine", "synthroid": "levothyroxine", "atorva": "atorvastatin",
    "lipitor": "atorvastatin", "rosuvas": "rosuvastatin", "crestor": "rosuvastatin",
    "azithral": "azithromycin", "zithromax": "azithromycin", "augmentin": "amoxicillin",
    "amoxil": "amoxicillin", "cipro": "ciprofloxacin", "zestril": "lisinopril",
    "cozaar": "losartan", "losar": "losartan", "lasix": "furosemide", "coumadin": "warfarin",
    "januvia": "sitagliptin", "jalra": "vildagliptin", "glimestar": "glimepiride",
    "amaryl": "glimepiride", "ramipril": "ramipril", "cardace": "ramipril", "concor": "bisoprolol",
    "metolar": "metoprolol", "lopressor": "metoprolol", "nolvadex": "tamoxifen",
}  # fmt: skip

# Multi-word forms that are one name.
PHRASE_ALIASES: dict[str, str] = {
    "vitamin d3": "cholecalciferol", "vitamin d": "cholecalciferol", "vit d3": "cholecalciferol",
    "vitamin b12": "cyanocobalamin", "vit b12": "cyanocobalamin", "vitamin c": "ascorbic",
    "vitamin b9": "folic", "vitamin e": "tocopherol", "vitamin k": "phytonadione",
}  # fmt: skip

# Salts, release-profile suffixes and dosage-form words. They differ between the
# label and the catalogue ("Metformin HCl" vs "Metformin Hydrochloride") without
# changing which drug it is, so both sides are stripped of them before comparing.
FILLER = {
    "hydrochloride", "hcl", "sodium", "potassium", "calcium", "magnesium", "besylate", "maleate",
    "tartrate", "succinate", "sulfate", "sulphate", "mesylate", "phosphate", "acetate", "citrate",
    "bromide", "chloride", "fumarate", "hydrobromide", "nitrate", "monohydrate", "dihydrate",
    "er", "xr", "sr", "cr", "la", "dr", "ip", "bp", "usp", "tablets", "tablet", "capsules", "capsule",
    "acid", "and", "with", "plus", "the", "of",
}  # fmt: skip

_FAMILIES = (
    "tablet",
    "capsule",
    "syrup",
    "suspension",
    "solution",
    "injection",
    "drops",
    "cream",
    "gel",
    "powder",
)


@dataclass(frozen=True)
class Entry:
    """One presentation in the catalogue."""

    id: str
    generic: str
    brand: str
    strength: str
    unit: str
    form: str
    category: str


@dataclass
class MatchResult:
    entry: Entry | None = None
    score: float = 0.0
    alternatives: list[Entry] = field(default_factory=list)

    @property
    def level(self) -> str:
        if self.entry is None:
            return "NONE"
        return "AUTO" if self.score >= AUTO_THRESHOLD else "POSSIBLE"


def core_tokens(name: str) -> list[str]:
    """The tokens that identify the drug, after aliases and filler are removed."""
    text = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
    for phrase, replacement in PHRASE_ALIASES.items():
        if phrase in text:
            text = text.replace(phrase, replacement)
    tokens = [ALIASES.get(t, t) for t in text.split()]
    kept = [t for t in tokens if t not in FILLER and not t.isdigit()]
    return kept or tokens


def name_score(query: list[str], candidate: list[str]) -> float:
    """How alike two drug names are, from 0 to 1.

    Each ingredient in the query is matched to its best counterpart, then the
    total is divided by the larger ingredient count - so a query for one drug
    does not fully match a two-drug combination, and vice versa.
    """
    if not query or not candidate:
        return 0.0
    total = 0.0
    for token in query:
        total += max(SequenceMatcher(None, token, other).ratio() for other in candidate)
    return total / max(len(query), len(candidate))


def _split_ingredients(name: str) -> list[str]:
    """'A / B', 'A + B' and 'A and B' are all lists of ingredients."""
    parts = re.split(r"\s*(?:/|\+|,|\band\b)\s*", name, flags=re.I)
    return [p for p in parts if p.strip()]


def _tokens_for_entry_name(name: str) -> list[str]:
    tokens: list[str] = []
    for part in _split_ingredients(name):
        tokens.extend(core_tokens(part))
    return tokens


def _number(text: str) -> float | None:
    m = re.match(r"\s*(\d+(?:\.\d+)?)", text or "")
    return float(m.group(1)) if m else None


def _family(form: str) -> str:
    lowered = (form or "").lower()
    return next((f for f in _FAMILIES if f in lowered), "")


def _presentation_score(entry: Entry, strength: str, unit: str, form: str) -> float:
    score = 0.0
    wanted, have = _number(strength), _number(entry.strength)
    if wanted is not None and have is not None and abs(wanted - have) < 1e-9:
        score += 3.0
        if unit and entry.unit and unit.lower().split("/")[0] == entry.unit.lower().split("/")[0]:
            score += 1.0
    if form and _family(form) and _family(form) == _family(entry.form):
        score += 2.0
    # Prefer the plain presentation over "Tablet, Film Coated, Extended Release".
    return score - len(entry.form) / 1000


def rank_entries(
    query: str,
    entries: list[Entry],
    *,
    strength: str = "",
    unit: str = "",
    form: str = "",
) -> MatchResult:
    """Pick the best catalogue entry for `query`. Pure, so it is easy to test."""
    query_tokens: list[str] = []
    for part in _split_ingredients(query):
        query_tokens.extend(core_tokens(part))
    if not query_tokens:
        return MatchResult()

    # Score each distinct name once; 1,700 presentations share ~350 names.
    by_name: dict[str, list[Entry]] = {}
    for entry in entries:
        by_name.setdefault(entry.generic.lower(), []).append(entry)
        if entry.brand:
            by_name.setdefault(entry.brand.lower(), []).append(entry)

    scored = [(name_score(query_tokens, _tokens_for_entry_name(name)), name) for name in by_name]
    scored.sort(key=lambda pair: (-pair[0], len(pair[1])))
    if not scored or scored[0][0] < POSSIBLE_THRESHOLD:
        return MatchResult()

    best_score = scored[0][0]
    tied = {name for score, name in scored if score >= best_score - 0.02}
    pool: dict[str, Entry] = {}
    for name in tied:
        for entry in by_name[name]:
            pool[entry.id] = entry

    ranked = sorted(
        pool.values(), key=lambda e: _presentation_score(e, strength, unit, form), reverse=True
    )

    alternatives: list[Entry] = []
    seen = {ranked[0].generic.lower()}
    for score, name in scored[1:8]:
        if score < POSSIBLE_THRESHOLD:
            break
        for entry in by_name[name]:
            if entry.generic.lower() not in seen:
                alternatives.append(entry)
                seen.add(entry.generic.lower())
                break
        if len(alternatives) >= 3:
            break
    return MatchResult(entry=ranked[0], score=round(best_score, 3), alternatives=alternatives)


def load_entries() -> list[Entry]:
    """Every active catalogue presentation, as plain objects."""
    from apps.common.models import MedicineReference

    rows = MedicineReference.objects.filter(is_active=True).values_list(
        "id", "generic_name", "brand_name", "strength", "strength_unit", "dosage_form", "category"
    )
    return [
        Entry(str(pk), g, b or "", s or "", u or "", f or "", c) for pk, g, b, s, u, f, c in rows
    ]


def match_reference(
    name: str,
    *,
    strength: str = "",
    unit: str = "",
    form: str = "",
    entries: list[Entry] | None = None,
) -> MatchResult:
    return rank_entries(
        name,
        entries if entries is not None else load_entries(),
        strength=strength,
        unit=unit,
        form=form,
    )
