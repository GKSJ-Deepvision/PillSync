from datetime import date

from pydantic import BaseModel, Field, model_validator


class MedicineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    dosage: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)
    frequency: str = Field(min_length=1, max_length=100)
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("End date cannot be before start date")
        return self


class MedicineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    dosage: str | None = Field(default=None, min_length=1, max_length=100)
    quantity: int | None = Field(default=None, gt=0)
    frequency: str | None = Field(default=None, min_length=1, max_length=100)
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("End date cannot be before start date")
        return self


class MedicineResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    dosage: str
    quantity: int
    frequency: str
    start_date: date | None
    end_date: date | None

    model_config = {"from_attributes": True}
