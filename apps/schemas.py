from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime
from typing import Optional, List

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

# Response schema for returning user details (excludes password)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

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

class MedicineOut(MedicineCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True