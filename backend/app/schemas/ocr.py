from pydantic import BaseModel


class OCRResponse(BaseModel):
    filename: str
    extracted_text: str
    medicine_name: str | None
    dosage: str | None
    quantity: int | None
    frequency: str | None
    prescription_details: str | None