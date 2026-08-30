from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.accounts.dependencies import get_current_user
from apps.accounts.models import User, UserRole
from apps.accounts.permissions import require_admin, require_caregiver, require_patient
from apps.accounts.schemas import LoginRequest, TokenResponse, UserRegister, UserResponse
from apps.accounts.services.auth import create_access_token, hash_password, verify_password
from config.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=UserRole.PATIENT,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    token = create_access_token(user.id, user.role.value)

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/patient-only")
def patient_only(current_user: User = Depends(require_patient)):
    return {
        "message": "Patient access granted",
        "user": current_user.full_name,
        "role": current_user.role.value,
    }


@router.get("/caregiver-only")
def caregiver_only(current_user: User = Depends(require_caregiver)):
    return {
        "message": "Caregiver access granted",
        "user": current_user.full_name,
        "role": current_user.role.value,
    }


@router.get("/admin-only")
def admin_only(current_user: User = Depends(require_admin)):
    return {
        "message": "Admin access granted",
        "user": current_user.full_name,
        "role": current_user.role.value,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
