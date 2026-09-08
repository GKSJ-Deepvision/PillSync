from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from apps.database import Base

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    
    medicines = relationship("Medicine", back_populates="owner")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    dosage = Column(String, nullable=False)             # e.g., "500mg"
    disease = Column(String, nullable=True)            # e.g., "Diabetes"
    total_quantity = Column(Integer, nullable=False)   # e.g., 60 tablets
    daily_frequency = Column(Integer, nullable=False) # e.g., 2 times a day
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="medicines")
    adherence_logs = relationship("AdherenceLog", back_populates="medicine")

class AdherenceLog(Base):
    __tablename__ = "adherence_logs"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    status = Column(String, nullable=False)            # "TAKEN", "MISSED", "SNOOZED"
    timestamp = Column(DateTime, default=datetime.utcnow)

    medicine = relationship("Medicine", back_populates="adherence_logs")