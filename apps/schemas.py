from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    ADMIN = "admin"

# Request schema for user registration
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.PATIENT
    caregiver_id: Optional[int] = None

# Response schema for returning user details (excludes password)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    caregiver_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Response schema for JWT token
class Token(BaseModel):
    access_token: str
    token_type: str

class MedicineCreate(BaseModel):
    name: str
    dosage: str
    disease: Optional[str] = None
    total_quantity: int
    daily_frequency: int
    times: Optional[List[str]] = []

class MedicineOut(MedicineCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdherenceStatus(str, Enum):
    TAKEN = "TAKEN"
    MISSED = "MISSED"
    SNOOZED = "SNOOZED"

class AdherenceLogCreate(BaseModel):
    medicine_id: int
    status: AdherenceStatus

class AdherenceLogOut(BaseModel):
    id: int
    medicine_id: int
    status: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class AdherenceReportOut(BaseModel):
    total_medicines: int
    total_doses_logged: int
    doses_taken: int
    doses_missed: int
    adherence_percentage: float

    model_config = ConfigDict(from_attributes=True)