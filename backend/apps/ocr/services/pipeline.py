"""The OCR pipeline: image -> text -> structure -> catalogue match -> review.

Nothing here writes to a patient's medicines. `process_job` produces reviewable
`ExtractedMedicine` rows, and `confirm_job` - called only once the patient has
looked at them - is the one place that turns them into real medicines.
"""

from __future__ import annotations

import logging
import time
from datetime import date, timedelta
from decimal import Decimal
from difflib import SequenceMatcher

from django.db import transaction
from django.utils import timezone
from PIL import Image, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

from apps.common.choices import MedicineCategory, ScheduleFrequency
from apps.ocr.models import ExtractedMedicine, ItemStatus, JobKind, JobSource, JobStatus, OCRJob
from apps.ocr.services import engines, matcher, parser, preprocess

logger = logging.getLogger(__name__)

# Where a dose falls in the day when the prescription only says "morning".
DEFAULT_TIMES = {"MORNING": "08:00", "AFTERNOON": "13:00", "EVENING": "18:00", "NIGHT": "21:00"}


def _label(entry: matcher.Entry) -> str:
    strength = f" {entry.strength} {entry.unit}".rstrip() if entry.strength else ""
    form = f" ({entry.form})" if entry.form else ""
    return f"{entry.generic}{strength}{form}"


def _suggestion(entry: matcher.Entry, score: float | None = None) -> dict:
    data = {"id": entry.id, "label": _label(entry), "category": entry.category}
    if score is not None:
        data["score"] = score
    return data


def item_confidence(
    med: parser.ParsedMedicine, result: matcher.MatchResult, ocr: float | None
) -> float:
    """How far to trust one extracted medicine, 0-1.

    Completeness first - a name with no strength and no schedule is barely an
    extraction - then the catalogue match, then a discount for each thing the
    parser had to assume, then the OCR engine's own opinion of the page.
    """
    score = 0.30 if med.name else 0.0
    score += 0.20 if med.strength else 0.0
    score += 0.25 if (med.slots or med.as_needed) else 0.0
    score += 0.10 if (med.duration_days or med.total_quantity) else 0.0
    score += 0.15 * result.score if result.entry else 0.0
    score -= min(0.15, 0.04 * len(med.reasons))
    factor = 0.6 + 0.4 * ocr if ocr is not None else 1.0
    return round(max(0.0, min(1.0, score * factor)), 3)


def _names_agree(written: str, expected: str) -> bool:
    """Whether the name on the page is plausibly the patient the job is for."""
    a, b = written.lower().strip(), expected.lower().strip()
    if not a or not b:
        return True
    tokens_a = {t for t in a.replace(".", " ").split() if len(t) >= 3}
    tokens_b = {t for t in b.replace(".", " ").split() if len(t) >= 3}
    if tokens_a & tokens_b:
        return True
    return SequenceMatcher(None, a, b).ratio() >= 0.6


def corrected_name(written: str, entry: matcher.Entry) -> str:
    """Fix an obvious typo to the catalogue spelling; otherwise keep what was written.

    "Metformn" is a misread of "Metformin" and saving it verbatim would put a
    misspelt medicine on every reminder. But "Paracetamol" matches "Acetaminophen"
    through the alias table, and is exactly what an Indian patient expects to see,
    so only a near-miss of a spelling that appears in the catalogue is corrected -
    never a synonym.
    """
    query = matcher.core_tokens(written)
    if len(query) != 1:
        return written
    candidates = matcher.core_tokens(entry.generic) + matcher.core_tokens(entry.brand)
    scored = [(SequenceMatcher(None, query[0], c).ratio(), c) for c in candidates]
    if not scored:
        return written
    ratio, best = max(scored)
    return best.title() if 0.8 <= ratio < 1.0 else written


def _persist(job: OCRJob, parsed: parser.ParsedPrescription, ocr_confidence: float | None) -> None:
    job.header = parsed.header.as_dict()
    warnings = list(parsed.warnings)

    written = parsed.header.patient_name
    if written and not _names_agree(written, job.patient.full_name):
        warnings.append(
            f"This prescription is written for '{written}', but you are adding it to "
            f"{job.patient.full_name}'s profile. Check it is the right person before saving."
        )
    if (
        parsed.header.expires_on
        and parsed.header.expires_on < date.today()
        and job.kind == JobKind.PRESCRIPTION
    ):
        warnings.append(f"This prescription expired on {parsed.header.expires_on:%d %b %Y}.")
    job.warnings = warnings

    job.items.all().delete()
    entries = matcher.load_entries()
    confidences = []
    for position, med in enumerate(parsed.medicines):
        result = matcher.match_reference(
            med.name, strength=med.strength, unit=med.strength_unit, form=med.form, entries=entries
        )
        suggestions: list[dict] = []
        if result.entry is not None:
            suggestions.append(_suggestion(result.entry, result.score))
            suggestions.extend(_suggestion(alt) for alt in result.alternatives)

        # A confident match is applied automatically - unless the engine itself
        # says the page was hard to read. Then the "name" may be a misread of a
        # different real drug, so the match is downgraded to a suggestion the
        # patient must accept. Found by the OCR evaluation: on badly degraded
        # images one misread name was auto-matched to the wrong catalogue drug.
        applied = result.level == "AUTO" and (
            ocr_confidence is None or ocr_confidence >= matcher.AUTO_APPLY_MIN_OCR_CONFIDENCE
        )
        level = "POSSIBLE" if result.level == "AUTO" and not applied else result.level
        reasons = list(med.reasons)
        if level != result.level:
            reasons.append(
                "The photo was hard to read, so please confirm this is the right medicine."
            )

        confidence = item_confidence(med, result, ocr_confidence)
        confidences.append(confidence)
        ExtractedMedicine.objects.create(
            job=job,
            position=position,
            raw_line=med.raw_line,
            name=corrected_name(med.name, result.entry) if applied else med.name,
            form=med.form,
            strength=med.strength,
            strength_unit=med.strength_unit,
            slots=[s.as_dict() for s in med.slots],
            frequency=med.frequency,
            interval_days=med.interval_days,
            days_of_week=med.days_of_week,
            as_needed=med.as_needed,
            duration_days=med.duration_days,
            total_quantity=med.total_quantity,
            instructions=med.instructions,
            # Only a confident match is applied. A "possible" one is offered in
            # `suggestions` and waits for the patient, because wrongly attaching
            # a catalogue entry attaches its strength and category too.
            reference_id=result.entry.id if applied else None,
            match_level=level,
            match_score=result.score,
            suggestions=suggestions,
            confidence=confidence,
            reasons=reasons,
        )

    job.confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0.0


def _read_image(job: OCRJob) -> engines.OCRResult:
    try:
        with job.image.open("rb") as handle, Image.open(handle) as image:
            image.load()
            prepared = preprocess.prepare(image)
    except (UnidentifiedImageError, OSError) as exc:
        raise engines.OCRFailed("The uploaded file could not be opened as an image.") from exc
    return engines.get_engine().read(prepared)


def process_job(job: OCRJob) -> OCRJob:
    """Run a job to completion. Never raises: a failure becomes `status=FAILED`.

    Raising here would surface as a 500 to the patient, or - in a worker - as a
    silently retried task. Neither tells them the actual problem, which is
    almost always "this photo is unreadable, take another".
    """
    started = time.monotonic()
    job.status = JobStatus.PROCESSING
    job.error = ""
    job.save(update_fields=["status", "error", "updated_at"])

    ocr_confidence: float | None = None
    try:
        if job.source == JobSource.IMAGE:
            result = _read_image(job)
            job.raw_text, job.ocr_confidence, job.engine = (
                result.text,
                result.confidence,
                result.engine,
            )
            ocr_confidence = result.confidence
        else:
            job.engine = "text"

        parse = (
            parser.parse_medicine_label
            if job.kind == JobKind.MEDICINE_LABEL
            else parser.parse_prescription_text
        )
        parsed = parse(job.raw_text)
        _persist(job, parsed, ocr_confidence)
        job.status = JobStatus.COMPLETED

        if job.source == JobSource.IMAGE and (ocr_confidence or 1) < 0.45:
            job.warnings = [
                "The photo was hard to read. Check every field, or retake it in better light.",
                *job.warnings,
            ]
    except engines.OCRUnavailable as exc:
        logger.error("OCR engine unavailable: %s", exc)
        job.status, job.error = JobStatus.FAILED, str(exc)
    except engines.OCRFailed as exc:
        job.status, job.error = JobStatus.FAILED, str(exc)
    except Exception:  # noqa: BLE001 - see the docstring
        logger.exception("OCR job %s failed", job.pk)
        job.status = JobStatus.FAILED
        job.error = "Something went wrong reading this. Try again, or enter the medicines by hand."

    job.processing_ms = round((time.monotonic() - started) * 1000)
    job.save()
    return job


def reparse(job: OCRJob, raw_text: str) -> OCRJob:
    """Re-run extraction on corrected text, keeping the image and OCR figures.

    Lets a patient fix a misread word in the text box and see the medicines
    update, instead of editing every extracted field by hand.
    """
    job.raw_text = raw_text
    job.save(update_fields=["raw_text", "updated_at"])
    started = time.monotonic()
    parse = (
        parser.parse_medicine_label
        if job.kind == JobKind.MEDICINE_LABEL
        else parser.parse_prescription_text
    )
    _persist(job, parse(raw_text), job.ocr_confidence)
    job.status = JobStatus.COMPLETED
    job.processing_ms = round((time.monotonic() - started) * 1000)
    job.save()
    return job


# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------


def _category_for(item: ExtractedMedicine) -> str:
    return item.reference.category if item.reference_id else MedicineCategory.OTHER


@transaction.atomic
def confirm_job(job: OCRJob, *, stock: dict[str, Decimal] | None = None) -> dict:
    """Turn the reviewed items into real medicines, schedules and doses.

    `stock` maps item id -> units in hand, overriding what the prescription said.
    Returns {"prescription": Prescription | None, "medicines": [Medicine, ...]}.
    """
    from apps.medications.models import MedicationSchedule, Medicine
    from apps.prescriptions.models import Prescription
    from apps.refills.services import stock as stock_service
    from apps.reminders.services.generation import generate_for_medicine

    if job.status == JobStatus.CONFIRMED:
        raise ValidationError({"detail": "This has already been added to the patient's medicines."})
    if job.status not in {JobStatus.COMPLETED}:
        raise ValidationError({"detail": "Only a completed scan can be confirmed."})

    stock = stock or {}
    items = list(job.items.select_related("reference").filter(status=ItemStatus.PENDING))
    if not items:
        raise ValidationError({"detail": "There are no medicines left to add."})

    quantities: dict[str, Decimal] = {}
    problems: dict[str, str] = {}
    for item in items:
        quantity = stock.get(str(item.pk), item.total_quantity)
        if quantity is None:
            problems[str(item.pk)] = f"How many {item.name} do you have? Enter the quantity."
        else:
            quantities[str(item.pk)] = Decimal(quantity)
    if problems:
        raise ValidationError({"items": problems})

    prescription = None
    header = job.header or {}
    if job.kind == JobKind.PRESCRIPTION and any(
        header.get(k) for k in ("doctor_name", "clinic_name", "reference_number", "issued_on")
    ):
        prescription = Prescription.objects.create(
            patient=job.patient,
            doctor_name=header.get("doctor_name", ""),
            clinic_name=header.get("clinic_name", ""),
            reference_number=header.get("reference_number", ""),
            issued_on=date.fromisoformat(header["issued_on"]) if header.get("issued_on") else None,
            expires_on=(
                date.fromisoformat(header["expires_on"]) if header.get("expires_on") else None
            ),
            image=job.image.name if job.image else None,
            ocr_extracted=True,
            ocr_confidence=job.confidence,
            ocr_raw_text=job.raw_text,
        )

    today = timezone.localdate()
    medicines = []
    for item in items:
        ref = item.reference
        medicine = Medicine.objects.create(
            patient=job.patient,
            reference=ref,
            prescription=prescription,
            name=item.name,
            dosage_form=item.form or (ref.dosage_form if ref else ""),
            strength=item.strength or "",
            strength_unit=item.strength_unit or "",
            category=_category_for(item),
            instructions=item.instructions,
            quantity_remaining=quantities[str(item.pk)],
            quantity_per_refill=item.total_quantity,
            start_date=today,
            end_date=today + timedelta(days=item.duration_days - 1) if item.duration_days else None,
        )
        if not item.as_needed:
            for entry in item.slots:
                MedicationSchedule.objects.create(
                    medicine=medicine,
                    slot=entry["slot"],
                    time_of_day=DEFAULT_TIMES[entry["slot"]],
                    quantity_per_dose=Decimal(entry["quantity"]),
                    frequency=item.frequency or ScheduleFrequency.DAILY,
                    days_of_week=item.days_of_week if item.frequency == "SPECIFIC_DAYS" else [],
                    interval_days=item.interval_days if item.frequency == "INTERVAL" else 1,
                    start_date=today,
                    end_date=medicine.end_date,
                )
            generate_for_medicine(medicine)

        # Start the stock ledger and the refill forecast, as adding a medicine by
        # hand does; otherwise a scanned medicine would have neither.
        stock_service.record_initial(medicine, job.created_by)

        item.status = ItemStatus.CONFIRMED
        item.medicine = medicine
        item.save(update_fields=["status", "medicine", "updated_at"])
        medicines.append(medicine)

    job.status = JobStatus.CONFIRMED
    job.prescription = prescription
    job.confirmed_at = timezone.now()
    job.save(update_fields=["status", "prescription", "confirmed_at", "updated_at"])
    return {"prescription": prescription, "medicines": medicines}
