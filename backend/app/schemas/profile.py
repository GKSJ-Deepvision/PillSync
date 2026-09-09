from datetime import date

from pydantic import BaseModel, Field


class ProfileCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    date_of_birth: date | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    date_of_birth: date | None
    phone: str | None
    address: str | None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    date_of_birth: date | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)