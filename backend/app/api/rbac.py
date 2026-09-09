from fastapi import APIRouter, Depends

from app.core.rbac import admin_only, caregiver_only, patient_only
from app.models.user import User

router = APIRouter(prefix="/rbac", tags=["Role-Based Access Control"])


@router.get("/patient")
def patient_dashboard(current_user: User = Depends(patient_only)):
    return {
        "message": "Patient access granted",
        "username": current_user.username,
        "role": current_user.role,
    }


@router.get("/caregiver")
def caregiver_dashboard(current_user: User = Depends(caregiver_only)):
    return {
        "message": "Caregiver access granted",
        "username": current_user.username,
        "role": current_user.role,
    }


@router.get("/admin")
def admin_dashboard(current_user: User = Depends(admin_only)):
    return {
        "message": "Admin access granted",
        "username": current_user.username,
        "role": current_user.role,
    }