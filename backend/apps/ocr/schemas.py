from __future__ import annotations

from pydantic import BaseModel, Field


class MedicineExtraction(BaseModel):
    name: str
    dosage: str | None = None
    quantity: str | None = None
    frequency: str | None = None
    instructions: str | None = None
    confidence: float = Field(ge=0, le=1)


class OCRResponse(BaseModel):
    text: str
    medicines: list[MedicineExtraction]
    confidence: float = Field(ge=0, le=1)
    engine: str
