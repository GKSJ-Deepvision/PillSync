#!/usr/bin/env python3
"""Build PillSync's medicine reference catalogue from the FDA NDC Directory.

The NDC Directory is the public, official list of drug products marketed in the
United States. We use it as the seed catalogue behind medicine lookup and the
disease-based organisation the specification asks for (blood pressure, diabetes,
thyroid, antibiotics, vitamins, heart medications).

Source: https://www.accessdata.fda.gov/cder/ndctext.zip  (public domain)

Usage
-----
    python ml/src/common/build_medicine_reference.py            # download if needed, then build
    python ml/src/common/build_medicine_reference.py --refresh  # force a fresh download

Outputs
-------
    ml/data/raw/product.txt                        raw FDA extract (git-ignored)
    ml/data/processed/medicines_catalogue.csv      every categorised product (git-ignored)
    ml/data/samples/medicines_sample.csv           small tracked sample for tests
    backend/apps/common/data/medicines_seed.csv    curated seed the backend loads
    backend/apps/common/data/conditions_seed.json  condition catalogue for profiles
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

NDC_URL = "https://www.accessdata.fda.gov/cder/ndctext.zip"

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "ml" / "data" / "raw"
PROCESSED_DIR = REPO_ROOT / "ml" / "data" / "processed"
SAMPLES_DIR = REPO_ROOT / "ml" / "data" / "samples"
SEED_DIR = REPO_ROOT / "backend" / "apps" / "common" / "data"

PRODUCT_FILE = RAW_DIR / "product.txt"

# Only real medicines people take on a schedule. Allergenic extracts, plasma
# derivatives and cellular therapies are not what this platform tracks.
KEPT_PRODUCT_TYPES = {"HUMAN PRESCRIPTION DRUG", "HUMAN OTC DRUG"}

# Homeopathic preparations are ~13,700 of the directory. They carry ingredient
# names that match our category rules (vitamins, thyroid extracts) but they are
# not medicines a reminder and refill platform should be suggesting, and their
# multi-ingredient names crowd out the real drugs in search results.
EXCLUDED_MARKETING_CATEGORIES = ("HOMEOPATHIC",)

# A name listing this many active ingredients is a combination product whose
# label runs to several lines - unusable in a picker.
MAX_INGREDIENTS_IN_NAME = 3

# Dosage forms a patient can be reminded to take at home.
KEPT_FORM_PATTERNS = (
    "TABLET",
    "CAPSULE",
    "SOLUTION",
    "SUSPENSION",
    "SYRUP",
    "POWDER",
    "INJECTION",
    "GRANULE",
    "LOZENGE",
    "FILM",
    "TROCHE",
    "ELIXIR",
    "CONCENTRATE",
)

# The six categories the specification names, most specific first: a beta
# blocker is dispensed for blood pressure far more often than for arrhythmia,
# so BLOOD_PRESSURE wins that overlap.
CATEGORY_RULES: list[tuple[str, tuple[str, ...], tuple[str, ...]]] = [
    (
        "DIABETES",
        (
            "insulin",
            "biguanide",
            "sulfonylurea",
            "dipeptidyl peptidase 4 inhibitor",
            "sodium-glucose cotransporter 2 inhibitor",
            "glp-1 receptor agonist",
            "thiazolidinedione",
            "alpha-glucosidase inhibitor",
            "amylin analog",
            "glucagon",
        ),
        (
            "metformin",
            "glipizide",
            "glyburide",
            "glimepiride",
            "sitagliptin",
            "linagliptin",
            "empagliflozin",
            "dapagliflozin",
            "canagliflozin",
            "liraglutide",
            "semaglutide",
            "dulaglutide",
            "tirzepatide",
            "pioglitazone",
            "acarbose",
            "insulin",
        ),
    ),
    (
        "THYROID",
        ("thyroxine", "thyroid hormone", "antithyroid", "thyroid"),
        ("levothyroxine", "liothyronine", "methimazole", "propylthiouracil"),
    ),
    (
        "BLOOD_PRESSURE",
        (
            "angiotensin converting enzyme inhibitor",
            "angiotensin 2 receptor blocker",
            "beta-adrenergic blocker",
            "calcium channel blocker",
            "thiazide diuretic",
            "loop diuretic",
            "aldosterone antagonist",
            "renin inhibitor",
            "alpha-adrenergic blocker",
            "centrally-acting alpha-2 adrenergic agonist",
            "antihypertensive",
        ),
        (
            "lisinopril",
            "enalapril",
            "ramipril",
            "losartan",
            "valsartan",
            "olmesartan",
            "telmisartan",
            "irbesartan",
            "amlodipine",
            "nifedipine",
            "diltiazem",
            "verapamil",
            "metoprolol",
            "atenolol",
            "bisoprolol",
            "carvedilol",
            "propranolol",
            "hydrochlorothiazide",
            "chlorthalidone",
            "furosemide",
            "spironolactone",
            "clonidine",
            "doxazosin",
            "prazosin",
        ),
    ),
    (
        "HEART",
        (
            "hmg-coa reductase inhibitor",
            "antiarrhythmic",
            "anticoagulant",
            "vitamin k antagonist",
            "factor xa inhibitor",
            "direct thrombin inhibitor",
            "platelet aggregation inhibitor",
            "p2y12 platelet inhibitor",
            "cardiac glycoside",
            "nitrate vasodilator",
            "antianginal",
        ),
        (
            "atorvastatin",
            "simvastatin",
            "rosuvastatin",
            "pravastatin",
            "warfarin",
            "apixaban",
            "rivaroxaban",
            "dabigatran",
            "clopidogrel",
            "ticagrelor",
            "digoxin",
            "amiodarone",
            "sotalol",
            "flecainide",
            "isosorbide",
            "nitroglycerin",
            "ezetimibe",
        ),
    ),
    (
        "ANTIBIOTICS",
        (
            "penicillin",
            "cephalosporin",
            "macrolide antimicrobial",
            "quinolone antimicrobial",
            "tetracycline",
            "sulfonamide antibacterial",
            "aminoglycoside",
            "lincosamide antibacterial",
            "carbapenem",
            "glycopeptide antibacterial",
            "nitroimidazole antimicrobial",
            "oxazolidinone antibacterial",
            "antibacterial",
        ),
        (
            "amoxicillin",
            "ampicillin",
            "penicillin",
            "cephalexin",
            "cefdinir",
            "cefuroxime",
            "ceftriaxone",
            "azithromycin",
            "clarithromycin",
            "erythromycin",
            "ciprofloxacin",
            "levofloxacin",
            "moxifloxacin",
            "doxycycline",
            "minocycline",
            "trimethoprim",
            "sulfamethoxazole",
            "clindamycin",
            "metronidazole",
            "nitrofurantoin",
            "vancomycin",
            "linezolid",
        ),
    ),
    (
        "VITAMINS",
        ("vitamin", "multivitamin", "mineral"),
        (
            "ascorbic acid",
            "cholecalciferol",
            "ergocalciferol",
            "cyanocobalamin",
            "folic acid",
            "thiamine",
            "riboflavin",
            "niacin",
            "pyridoxine",
            "biotin",
            "tocopherol",
            "retinol",
            "phytonadione",
            "ferrous",
            "calcium carbonate",
            "magnesium oxide",
            "zinc",
            "vitamin",
        ),
    ),
]

CATEGORY_LABELS = {
    "BLOOD_PRESSURE": "Blood Pressure",
    "DIABETES": "Diabetes",
    "THYROID": "Thyroid",
    "ANTIBIOTICS": "Antibiotics",
    "VITAMINS": "Vitamins",
    "HEART": "Heart Medications",
}

# How many products to keep per category in the committed seed file. Enough to
# make search and autocomplete feel real without adding megabytes to git.
SEED_PER_CATEGORY = 350
SAMPLE_ROWS = 120

FIELDNAMES = [
    "product_ndc",
    "generic_name",
    "brand_name",
    "dosage_form",
    "route",
    "strength",
    "strength_unit",
    "category",
    "categories",
    "pharm_class",
    "product_type",
    "requires_prescription",
]

_EPC = re.compile(r"([^,\[]+)\[EPC\]")
_WS = re.compile(r"\s+")


def clean(value: str) -> str:
    return _WS.sub(" ", (value or "").strip())


# The directory writes Greek-letter chemical prefixes as ".alpha.-tocopherol".
_GREEK_PREFIX = re.compile(r"^\.([a-z]+)\.-", re.I)
_INGREDIENT_SPLIT = re.compile(r",|\s+-\s+|\band\b", re.I)


def count_ingredients(name: str) -> int:
    """How many active ingredients a generic name lists.

    The directory separates them with commas, " - " or the word "and", so all
    three count. Used to drop combination products whose name cannot be shown
    in a picker.
    """
    parts = [part for part in _INGREDIENT_SPLIT.split(name) if part.strip()]
    return len(parts)


def title_case(value: str) -> str:
    """Title-case a drug name without mangling things like 'HCl' or 'XR'."""
    value = clean(value)
    if not value:
        return ""
    value = _GREEK_PREFIX.sub(lambda m: f"{m.group(1).capitalize()}-", value)
    words = []
    for word in value.split(" "):
        if len(word) <= 3 and word.isupper():
            words.append(word)
        elif word.isupper() or word.islower():
            words.append(word.capitalize())
        else:
            words.append(word)
    return " ".join(words)


def normalise_generic(name: str) -> str:
    """One spelling per combination product.

    The directory writes the same three-ingredient painkiller as
    "ACETAMINOPHEN, ASPIRIN AND CAFFEINE", "ACETAMINOPHEN AND ASPIRIN AND
    CAFFEINE" and "ACETAMINOPHEN ASPIRIN CAFFEINE". Splitting on every
    separator and rejoining with one collapses those into a single catalogue
    entry instead of three near-duplicates.
    """
    parts = [title_case(part) for part in _INGREDIENT_SPLIT.split(name) if part.strip()]
    return " / ".join(parts)


def download(force: bool = False) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if PRODUCT_FILE.exists() and not force:
        print(f"Using existing extract: {PRODUCT_FILE}")
        return

    print(f"Downloading {NDC_URL} ...")
    with urllib.request.urlopen(NDC_URL, timeout=300) as response:
        payload = response.read()
    print(f"  {len(payload) / 1024 / 1024:.1f} MB")

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        for name in ("product.txt", "package.txt"):
            if name in archive.namelist():
                (RAW_DIR / name).write_bytes(archive.read(name))
                print(f"  extracted {name}")


def categorise(pharm_classes: str, substance: str, generic: str) -> list[str]:
    haystack_class = pharm_classes.lower()
    haystack_name = f"{substance} {generic}".lower()

    matched = []
    for category, class_terms, name_terms in CATEGORY_RULES:
        if any(term in haystack_class for term in class_terms) or any(
            term in haystack_name for term in name_terms
        ):
            matched.append(category)
    return matched


def keep_form(dosage_form: str) -> bool:
    upper = dosage_form.upper()
    return any(pattern in upper for pattern in KEPT_FORM_PATTERNS)


def build() -> dict[str, int]:
    if not PRODUCT_FILE.exists():
        raise SystemExit(f"{PRODUCT_FILE} not found - run with --refresh first.")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    seen: set[tuple[str, str, str]] = set()
    by_category: dict[str, list[dict[str, str]]] = defaultdict(list)
    rows: list[dict[str, str]] = []

    with open(PRODUCT_FILE, encoding="latin-1", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for record in reader:
            product_type = clean(record.get("PRODUCTTYPENAME", ""))
            if product_type not in KEPT_PRODUCT_TYPES:
                continue
            if clean(record.get("NDC_EXCLUDE_FLAG", "")).upper() == "E":
                continue

            marketing = clean(record.get("MARKETINGCATEGORYNAME", "")).upper()
            if any(term in marketing for term in EXCLUDED_MARKETING_CATEGORIES):
                continue

            dosage_form = clean(record.get("DOSAGEFORMNAME", ""))
            if not keep_form(dosage_form):
                continue

            generic = clean(record.get("NONPROPRIETARYNAME", ""))
            brand = clean(record.get("PROPRIETARYNAME", ""))
            substance = clean(record.get("SUBSTANCENAME", ""))
            pharm_classes = clean(record.get("PHARM_CLASSES", ""))
            if not generic:
                continue

            categories = categorise(pharm_classes, substance, generic)
            if not categories:
                continue

            strength = clean(record.get("ACTIVE_NUMERATOR_STRENGTH", "")).split(";")[0]
            unit = clean(record.get("ACTIVE_INGRED_UNIT", "")).split(";")[0]

            # Keep the whole ingredient list, never just the part before the
            # first comma: truncating turns "Acetaminophen, Aspirin, and
            # Caffeine" into plain "Acetaminophen", which is a different drug.
            # Products with more ingredients than we can label are dropped -
            # a 17-ingredient multivitamin has no usable generic name, and it
            # is the brand name people recognise on the bottle anyway.
            if count_ingredients(generic) > MAX_INGREDIENTS_IN_NAME:
                continue
            generic_display = normalise_generic(generic)
            key = (generic_display.lower(), dosage_form.lower(), f"{strength} {unit}".lower())
            if key in seen:
                continue
            seen.add(key)

            epc = ", ".join(clean(match) for match in _EPC.findall(pharm_classes))

            row = {
                "product_ndc": clean(record.get("PRODUCTNDC", "")),
                "generic_name": generic_display,
                "brand_name": title_case(brand),
                "dosage_form": title_case(dosage_form),
                "route": title_case(clean(record.get("ROUTENAME", "")).split(";")[0]),
                "strength": strength,
                "strength_unit": unit,
                "category": categories[0],
                "categories": "|".join(categories),
                "pharm_class": epc,
                "product_type": product_type,
                "requires_prescription": str(product_type == "HUMAN PRESCRIPTION DRUG").lower(),
            }
            rows.append(row)
            by_category[categories[0]].append(row)

    rows.sort(key=lambda r: (r["category"], r["generic_name"], r["strength"]))
    write_csv(PROCESSED_DIR / "medicines_catalogue.csv", rows)

    # Curated seed: the most widely marketed generics in each category, with all
    # of their strengths. How many distinct NDC products carry a generic name is
    # a good proxy for how commonly it is dispensed - taking the first N rows
    # alphabetically instead would drop everyday drugs like metoprolol.
    seed: list[dict[str, str]] = []
    for category in CATEGORY_LABELS:
        bucket = by_category.get(category, [])
        per_generic: dict[str, list[dict[str, str]]] = defaultdict(list)
        for row in bucket:
            per_generic[row["generic_name"]].append(row)

        ranked = sorted(per_generic.items(), key=lambda item: (-len(item[1]), item[0]))
        taken = 0
        for _generic, group in ranked:
            if taken >= SEED_PER_CATEGORY:
                break
            group.sort(key=lambda r: (r["requires_prescription"] != "true", r["strength"]))
            seed.extend(group)
            taken += len(group)
    seed.sort(key=lambda r: (r["category"], r["generic_name"], r["strength"]))
    write_csv(SEED_DIR / "medicines_seed.csv", seed)

    sample = seed[:: max(1, len(seed) // SAMPLE_ROWS)][:SAMPLE_ROWS]
    write_csv(SAMPLES_DIR / "medicines_sample.csv", sample)

    write_conditions()

    counts = {category: len(by_category.get(category, [])) for category in CATEGORY_LABELS}
    counts["_catalogue_total"] = len(rows)
    counts["_seed_total"] = len(seed)
    counts["_sample_total"] = len(sample)
    return counts


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    size = path.stat().st_size / 1024
    print(f"  wrote {path.relative_to(REPO_ROOT).as_posix()}  ({len(rows)} rows, {size:.0f} KB)")


def write_conditions() -> None:
    """The chronic conditions a patient profile can track.

    Kept alongside the medicine catalogue because the two are queried together:
    a patient's conditions drive which medicine categories are surfaced first.
    """
    conditions = [
        {
            "code": "HYPERTENSION",
            "name": "Hypertension (High Blood Pressure)",
            "category": "BLOOD_PRESSURE",
            "chronic": True,
        },
        {"code": "TYPE_1_DIABETES", "name": "Type 1 Diabetes", "category": "DIABETES", "chronic": True},
        {"code": "TYPE_2_DIABETES", "name": "Type 2 Diabetes", "category": "DIABETES", "chronic": True},
        {"code": "HYPOTHYROIDISM", "name": "Hypothyroidism", "category": "THYROID", "chronic": True},
        {"code": "HYPERTHYROIDISM", "name": "Hyperthyroidism", "category": "THYROID", "chronic": True},
        {
            "code": "CORONARY_ARTERY_DISEASE",
            "name": "Coronary Artery Disease",
            "category": "HEART",
            "chronic": True,
        },
        {"code": "HEART_FAILURE", "name": "Heart Failure", "category": "HEART", "chronic": True},
        {"code": "ARRHYTHMIA", "name": "Cardiac Arrhythmia", "category": "HEART", "chronic": True},
        {
            "code": "HYPERLIPIDEMIA",
            "name": "High Cholesterol (Hyperlipidemia)",
            "category": "HEART",
            "chronic": True,
        },
        {"code": "ASTHMA", "name": "Asthma", "category": "OTHER", "chronic": True},
        {"code": "COPD", "name": "Chronic Obstructive Pulmonary Disease", "category": "OTHER", "chronic": True},
        {"code": "CKD", "name": "Chronic Kidney Disease", "category": "OTHER", "chronic": True},
        {"code": "OSTEOPOROSIS", "name": "Osteoporosis", "category": "VITAMINS", "chronic": True},
        {"code": "ANEMIA", "name": "Anemia", "category": "VITAMINS", "chronic": True},
        {
            "code": "VITAMIN_D_DEFICIENCY",
            "name": "Vitamin D Deficiency",
            "category": "VITAMINS",
            "chronic": False,
        },
        {"code": "INFECTION", "name": "Acute Infection", "category": "ANTIBIOTICS", "chronic": False},
        {"code": "ARTHRITIS", "name": "Arthritis", "category": "OTHER", "chronic": True},
        {"code": "EPILEPSY", "name": "Epilepsy", "category": "OTHER", "chronic": True},
        {"code": "DEPRESSION", "name": "Depression", "category": "OTHER", "chronic": True},
        {"code": "OTHER", "name": "Other", "category": "OTHER", "chronic": False},
    ]

    payload = {
        "categories": [
            {"code": code, "label": label} for code, label in CATEGORY_LABELS.items()
        ]
        + [{"code": "OTHER", "label": "Other"}],
        "conditions": conditions,
    }
    path = SEED_DIR / "conditions_seed.json"
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(REPO_ROOT).as_posix()}  ({len(conditions)} conditions)")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh", action="store_true", help="re-download the FDA extract before building"
    )
    args = parser.parse_args(argv)

    download(force=args.refresh)
    print("Building medicine reference ...")
    counts = build()

    print("\nProducts per category:")
    for code, label in CATEGORY_LABELS.items():
        print(f"  {label:<20} {counts[code]:>6}")
    print(f"\n  catalogue {counts['_catalogue_total']}  seed {counts['_seed_total']}"
          f"  sample {counts['_sample_total']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
