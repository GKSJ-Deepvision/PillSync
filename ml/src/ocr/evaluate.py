"""Measure prescription-reading accuracy, field by field, on a synthetic set.

    python ml/src/ocr/evaluate.py                        # needs the tesseract binary
    python ml/src/ocr/evaluate.py --no-ocr               # parser only, on clean text
    python ml/src/ocr/evaluate.py --write docs/reports/ocr-evaluation.md

Real prescriptions are medical records and must never be committed here, and no
public labelled set of them exists. So this generates prescriptions with *known*
contents from real drug names in the seeded FDA catalogue, writes them in the
styles Indian and international prescriptions actually use (1-0-1, BD, TDS, OD,
"twice daily", brand names), draws them onto images, degrades the images, reads
them with the real Tesseract engine the application uses, and scores the result
against the known contents.

Run in four conditions so the cost of a worse image is visible:

* text only      the parser and matcher alone (an OCR engine that never errs)
* clean          crisp rendered text
* skewed         the page rotated a couple of degrees, as a hand-held photo is
* degraded       blurred, speckled and low contrast - a poor photo

The honest limits are spelled out in the report: one typeface, no handwriting, no
real paper, glare or shadow. It measures the pipeline; it does not predict
performance on real photographs.
"""

from __future__ import annotations

import argparse
import csv
import random
import re
import shutil
import statistics
import sys
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "backend"))

# The parser and matcher are pure Python, so the parser-only run needs nothing
# installed. Django and Pillow are imported only when real OCR is requested.
from apps.ocr.services import matcher, parser  # noqa: E402

SEED_CSV = ROOT / "backend" / "apps" / "common" / "data" / "medicines_seed.csv"
FORMS = {"tablet", "capsule", "tablet, film coated", "tablet, coated", "tablet, extended release"}

# pattern -> (text, doses per day, exact slots or None)
STYLES = {
    "triple": lambda n, s, d: (f"{n}. Tab {{name}} {s} mg 1-0-1 x {d} days", 2, {"MORNING", "NIGHT"}),
    "triple_night": lambda n, s, d: (f"{n}. Tab {{name}} {s} mg 0-0-1 x {d} days", 1, {"NIGHT"}),
    "triple_all": lambda n, s, d: (f"{n}. Tab {{name}} {s} mg 1-1-1 x {d} days", 3, None),
    "words": lambda n, s, d: (f"{n}) {{name}} {s}mg tablet twice daily for {d} days", 2, None),
    "od": lambda n, s, d: (f"Cap. {{name}} {s} mg OD at bedtime x {d} days", 1, None),
    "tds": lambda n, s, d: (f"Tab {{name}} {s} mg TDS for {d} days", 3, None),
    "bd": lambda n, s, d: (f"{n}. {{name}} {s} mg BD after food x {d} days", 2, None),
}

CONDITIONS = ["text only", "clean", "skewed", "degraded"]


@dataclass
class Truth:
    written: str
    generic: str
    strength: str
    per_day: int
    slots: set[str] | None
    duration: int
    brand_written: bool


def load_candidates() -> list[dict]:
    """Single-ingredient oral tablets and capsules with a plain numeric mg strength."""
    seen, rows = set(), []
    with open(SEED_CSV, encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            generic = row["generic_name"].strip()
            first = generic.split()[0].lower()
            if (
                row["dosage_form"].strip().lower() in FORMS
                and row["strength_unit"].strip() == "mg/1"
                and re.fullmatch(r"\d{1,4}", row["strength"].strip())
                and 5 <= len(first) <= 16
                and first.isalpha()
                and "/" not in generic
                and " and " not in generic.lower()
                and first not in seen
            ):
                seen.add(first)
                rows.append(row)
    return rows


def build_set(count: int, meds_per_rx: int, rng: random.Random):
    candidates = load_candidates()
    rng.shuffle(candidates)
    chosen = candidates[: count * meds_per_rx]
    prescriptions = []
    for i in range(count):
        lines, truths = ["Dr. Meera Iyer", "City Care Clinic", "Date: 12/03/2026", "Rx"], []
        for j, row in enumerate(chosen[i * meds_per_rx : (i + 1) * meds_per_rx], start=1):
            style = rng.choice(list(STYLES))
            duration = rng.choice([5, 7, 10, 14, 30])
            strength = row["strength"].strip()
            template, per_day, slots = STYLES[style](j, strength, duration)

            generic_first = row["generic_name"].split()[0]
            brand = row["brand_name"].strip()
            brand_first = brand.split()[0] if brand else ""
            use_brand = (
                rng.random() < 0.25
                and brand_first.isalpha()
                and brand_first.lower() != generic_first.lower()
                and 4 <= len(brand_first) <= 16
            )
            written = brand_first if use_brand else generic_first
            lines.append(template.format(name=written.title()))
            truths.append(Truth(written.title(), row["generic_name"], strength, per_day, slots, duration, use_brand))
        prescriptions.append(("\n".join(lines), truths))
    return prescriptions


# --- Rendering ------------------------------------------------------------


def render(text: str, condition: str, rng: random.Random):
    from PIL import Image, ImageDraw, ImageFilter, ImageFont

    size = 34
    lines = text.split("\n")
    image = Image.new("RGB", (1500, 60 + len(lines) * (size + 26)), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=size)
    for i, line in enumerate(lines):
        draw.text((40, 30 + i * (size + 26)), line, fill="black", font=font)

    if condition == "skewed":
        image = image.rotate(rng.uniform(-2.5, 2.5), expand=True, fillcolor="white")
    elif condition == "degraded":
        image = image.rotate(rng.uniform(-2, 2), expand=True, fillcolor="white")
        image = image.filter(ImageFilter.GaussianBlur(1.2))
        pixels = image.load()
        for _ in range(int(image.width * image.height * 0.012)):
            x, y = rng.randrange(image.width), rng.randrange(image.height)
            shade = rng.randint(90, 200)
            pixels[x, y] = (shade, shade, shade)
        # Wash the contrast out: dark grey ink on a grey page, like a poor photo.
        image = image.point(lambda v: int(70 + v * 0.55))
    return image


# --- Scoring --------------------------------------------------------------


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def similar(a: str, b: str) -> float:
    return SequenceMatcher(None, norm(a), norm(b)).ratio()


def same_drug(entry, truth: Truth) -> bool:
    """Is the matched catalogue entry the drug the prescription meant?

    The FDA catalogue has misspellings of its own ("Fosinopirl Sodium") and
    brand entries whose generic name is a marketing name, so an exact string
    comparison would count a perfect match as an error. A near-identical first
    word - of the generic name, or of the brand actually written - is the same drug.
    """
    generic = truth.generic.split()[0]
    candidates = [entry.generic.split()[0], (entry.brand or "x").split()[0]]
    if any(similar(c, generic) >= 0.85 for c in candidates):
        return True
    return truth.brand_written and any(similar(c, truth.written) >= 0.85 for c in candidates)


def score(truths: list[Truth], parsed, entries, ocr_confidence: float | None = None) -> dict:
    """Align parsed medicines to the truth by name, then score each field."""
    remaining = list(parsed.medicines)
    counts = {
        "truth": len(truths), "found": 0, "spurious": 0,
        "name": 0, "strength": 0, "per_day": 0, "slots": 0, "slots_total": 0, "duration": 0,
        "catalogue_correct": 0, "catalogue_wrong_auto": 0, "suggested_only": 0,
    }
    for t in truths:
        best = max(remaining, key=lambda m: similar(m.name, t.written), default=None)
        if best is None or similar(best.name, t.written) < 0.6:
            continue
        remaining.remove(best)
        counts["found"] += 1
        counts["name"] += similar(best.name, t.written) >= 0.9
        counts["strength"] += best.strength == t.strength
        counts["per_day"] += best.doses_per_day == t.per_day
        if t.slots is not None:
            counts["slots_total"] += 1
            counts["slots"] += {s.slot for s in best.slots} == t.slots
        counts["duration"] += best.duration_days == t.duration

        result = matcher.match_reference(
            best.name, strength=best.strength, unit=best.strength_unit, form=best.form, entries=entries
        )
        if result.level == "AUTO" and (
            ocr_confidence is not None and ocr_confidence < matcher.AUTO_APPLY_MIN_OCR_CONFIDENCE
        ):
            # The application downgrades this to a suggestion when the page read badly.
            counts["suggested_only"] += 1
        elif result.level == "AUTO":
            same = same_drug(result.entry, t)
            counts["catalogue_correct"] += same
            counts["catalogue_wrong_auto"] += not same
    counts["spurious"] = len(remaining)
    return counts


def read_text(image, engine):
    from apps.ocr.services import preprocess

    return engine.read(preprocess.prepare(image))


def pct(n: int, d: int) -> str:
    return "n/a" if d == 0 else f"{100 * n / d:.1f}%"


def run(count: int, meds: int, seed: int, ocr: bool) -> str:
    rng = random.Random(seed)
    prescriptions = build_set(count, meds, rng)
    total_meds = sum(len(t) for _text, t in prescriptions)

    entries = [
        matcher.Entry(str(i), r["generic_name"], r["brand_name"], r["strength"], r["strength_unit"],
                      r["dosage_form"], r["category"])
        for i, r in enumerate(csv.DictReader(open(SEED_CSV, encoding="utf-8", newline="")))
    ]

    engine = None
    conditions = CONDITIONS
    if not ocr:
        conditions = ["text only"]
    else:
        from django.conf import settings

        if not settings.configured:
            settings.configure(TESSERACT_CMD="")
        from apps.ocr.services.engines import TesseractEngine

        engine = TesseractEngine()

    results = {}
    confidences = {c: [] for c in conditions}
    for condition in conditions:
        totals: dict[str, int] = {}
        for text, truths in prescriptions:
            page_confidence = None
            if condition == "text only":
                recognised = text
            else:
                out = read_text(render(text, condition, rng), engine)
                recognised = out.text
                page_confidence = out.confidence
                if out.confidence is not None:
                    confidences[condition].append(out.confidence)
            counts = score(
                truths, parser.parse_prescription_text(recognised), entries, page_confidence
            )
            for key, value in counts.items():
                totals[key] = totals.get(key, 0) + int(value)
        results[condition] = totals
        print(f"  {condition}: done", file=sys.stderr)

    lines = [
        "# OCR evaluation",
        "",
        f"Synthetic set: **{count} prescriptions, {total_meds} medicines**, seed {seed}. Drug names, "
        "strengths and forms come from the seeded FDA catalogue; each line is written in one of "
        f"{len(STYLES)} common prescribing styles (1-0-1, 0-0-1, 1-1-1, BD, TDS, OD, \"twice daily\"), "
        "about a quarter using a brand name instead of the generic.",
        "",
        "Each condition renders the prescription to an image, reads it with "
        + ("real Tesseract (the engine the app uses)" if ocr else "*no OCR - text is fed straight to the parser*")
        + ", parses it, and scores it against the known contents.",
        "",
        "## Field-level accuracy",
        "",
        "Accuracy of a field = correct / medicines that were found. \"Found\" is the share of the "
        "real medicines that were extracted at all.",
        "",
        "| Condition | Medicines found | Name | Strength | Doses per day | Exact time slots | Course length | Mean OCR confidence |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for c in conditions:
        r = results[c]
        conf = f"{statistics.fmean(confidences[c]):.2f}" if confidences.get(c) else "-"
        lines.append(
            f"| {c} | {pct(r['found'], r['truth'])} | {pct(r['name'], r['found'])} | "
            f"{pct(r['strength'], r['found'])} | {pct(r['per_day'], r['found'])} | "
            f"{pct(r['slots'], r['slots_total'])} | {pct(r['duration'], r['found'])} | {conf} |"
        )

    lines += ["", "## Catalogue matching", "",
              "Whether an extracted medicine was matched to the right catalogue drug. Only a *confident* "
              "match is applied automatically; a doubtful one is shown to the patient as a suggestion. "
              "The number to watch is **wrong automatic matches**: the case where the app attaches the "
              "wrong drug without asking.",
              "", "| Condition | Correct automatic matches | Wrong automatic matches | Suggested only (page read badly) | Spurious extra items |",
              "|---|---:|---:|---:|---:|"]
    for c in conditions:
        r = results[c]
        lines.append(
            f"| {c} | {pct(r['catalogue_correct'], r['found'])} | "
            f"{r['catalogue_wrong_auto']} ({pct(r['catalogue_wrong_auto'], r['found'])}) | "
            f"{r['suggested_only']} | {r['spurious']} |"
        )

    lines += ["", "## What these numbers do and do not show", "",
              "- Rendered text is far easier than a photograph. Treat the *clean* row as an upper bound "
              "and the *degraded* row as a stress test, not as what a patient's phone will produce.",
              "- One typeface, no handwriting, no paper texture, no glare, no shadows, no curved pages. "
              "Handwritten prescriptions, which are common, are outside what Tesseract can read reliably.",
              "- The parser is tuned on real prescribing conventions but scored on this generator's "
              "styles; a style it has never seen would score lower. The review screen exists for that reason.",
              "- The set is synthetic by necessity: real prescriptions are medical records and cannot be "
              "committed or shared.",
              ""]
    return "\n".join(lines)


def main() -> None:
    parser_ = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser_.add_argument("--prescriptions", type=int, default=40)
    parser_.add_argument("--meds", type=int, default=3, help="medicines per prescription")
    parser_.add_argument("--seed", type=int, default=11)
    parser_.add_argument("--no-ocr", action="store_true", help="parser only, skip Tesseract")
    parser_.add_argument("--write", type=Path)
    args = parser_.parse_args()

    ocr = not args.no_ocr
    if ocr and shutil.which("tesseract") is None:
        sys.exit("tesseract is not installed. Install it, or pass --no-ocr for the parser-only run.")

    report = run(args.prescriptions, args.meds, args.seed, ocr)
    print(report)
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
