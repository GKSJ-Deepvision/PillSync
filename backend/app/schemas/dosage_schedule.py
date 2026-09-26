from datetime import time

from pydantic import BaseModel, Field, field_validator


class DosageScheduleCreate(BaseModel):
    medicine_id: int = Field(gt=0)
    dosage_amount: int = Field(gt=0)
    time_of_day: time
    frequency: str = Field(min_length=1, max_length=50)

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        allowed_frequencies = {
            "daily",
            "weekly",
            "once daily",
            "twice daily",
            "three times daily",
            "every other day",
        }

        normalized = value.strip().lower()

        if normalized not in allowed_frequencies:
            raise ValueError(
                "Frequency must be one of: "
                "daily, weekly, once daily, twice daily, "
                "three times daily, every other day"
            )

        return normalized


class DosageScheduleUpdate(BaseModel):
    dosage_amount: int | None = Field(default=None, gt=0)
    time_of_day: time | None = None
    frequency: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str | None) -> str | None:
        if value is None:
            return None

        allowed_frequencies = {
            "daily",
            "weekly",
            "once daily",
            "twice daily",
            "three times daily",
            "every other day",
        }

        normalized = value.strip().lower()

        if normalized not in allowed_frequencies:
            raise ValueError(
                "Frequency must be one of: "
                "daily, weekly, once daily, twice daily, "
                "three times daily, every other day"
            )

        return normalized


class DosageScheduleResponse(BaseModel):
    id: int
    medicine_id: int
    dosage_amount: int
    time_of_day: time
    frequency: str

    model_config = {"from_attributes": True}
