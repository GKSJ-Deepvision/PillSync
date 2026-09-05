"""Shared base models and the platform's reference data tables."""

from __future__ import annotations

import uuid

from django.db import models

from apps.common.choices import MedicineCategory


class UUIDTimeStampedModel(models.Model):
    """Base for every PillSync model.

    UUID primary keys because record identifiers travel in URLs the patient and
    their caregiver both see; sequential integers would leak how many patients
    and prescriptions the platform holds.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class MedicalCondition(UUIDTimeStampedModel):
    """A condition a patient can be treated for.

    Reference data, seeded by `manage.py seed_reference_data`. Patients link to
    rows here rather than typing free text, so "diabetes", "Diabetes Type 2" and
    "T2DM" do not become three different conditions the analytics cannot group.
    """

    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=32,
        choices=MedicineCategory.choices,
        default=MedicineCategory.OTHER,
        help_text="Medicine category most often prescribed for this condition.",
    )
    is_chronic = models.BooleanField(
        default=True,
        help_text="Chronic conditions drive long-term adherence tracking and refill prediction.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "medical condition"
        verbose_name_plural = "medical conditions"
        indexes = [models.Index(fields=["category", "is_active"])]

    def __str__(self) -> str:
        return self.name


class MedicineReference(UUIDTimeStampedModel):
    """A medicine product from the FDA National Drug Code Directory.

    This is the *catalogue* - the list of medicines that exist. A patient's own
    medicine record (added in Milestone 2) points at a row here so that dosage
    form, strength and category do not have to be retyped or guessed, and so OCR
    output in Milestone 3 has something authoritative to match against.

    Seeded from `apps/common/data/medicines_seed.csv`, which is built by
    `ml/src/common/build_medicine_reference.py` from public FDA data.
    """

    product_ndc = models.CharField(
        max_length=32,
        blank=True,
        db_index=True,
        help_text="FDA National Drug Code for the product.",
    )
    generic_name = models.CharField(max_length=255, db_index=True)
    brand_name = models.CharField(max_length=255, blank=True, db_index=True)
    dosage_form = models.CharField(max_length=128, blank=True)
    route = models.CharField(max_length=128, blank=True)
    strength = models.CharField(max_length=64, blank=True)
    strength_unit = models.CharField(max_length=64, blank=True)
    category = models.CharField(
        max_length=32,
        choices=MedicineCategory.choices,
        default=MedicineCategory.OTHER,
        db_index=True,
    )
    secondary_categories = models.JSONField(
        default=list,
        blank=True,
        help_text="Other categories this medicine also belongs to, e.g. a beta blocker "
        "used for both blood pressure and heart conditions.",
    )
    pharm_class = models.CharField(max_length=500, blank=True)
    requires_prescription = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("generic_name", "strength")
        verbose_name = "medicine reference"
        verbose_name_plural = "medicine reference"
        constraints = [
            models.UniqueConstraint(
                fields=["generic_name", "dosage_form", "strength", "strength_unit"],
                name="uniq_medicine_reference_presentation",
            )
        ]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["generic_name", "brand_name"]),
        ]

    def __str__(self) -> str:
        parts = [self.generic_name]
        if self.strength:
            parts.append(f"{self.strength} {self.strength_unit}".strip())
        if self.dosage_form:
            parts.append(f"({self.dosage_form})")
        return " ".join(parts)

    @property
    def display_name(self) -> str:
        """What a patient would recognise on the packet."""
        return self.brand_name or self.generic_name
