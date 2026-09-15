from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class MedicineExtraction(BaseModel):
    name: str
    dosage: Optional[str] = None
    quantity: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    confidence: float = Field(ge=0, le=1)


class OCRResponse(BaseModel):
    text: str
    medicines: list[MedicineExtraction]
    confidence: float = Field(ge=0, le=1)
    engine: str