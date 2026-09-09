from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.auth import router as auth_router
from app.api.rbac import router as rbac_router
from app.api.profile import router as profile_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    description="Backend API for the PillSync healthcare workflow platform.",
    version=settings.app_version,
)


# Allow the React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Session management
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.jwt_secret_key,
)


# API routers
app.include_router(auth_router)
app.include_router(rbac_router)
app.include_router(profile_router)


@app.get("/")
def root():
    return {
        "message": f"{settings.app_name} is running",
        "version": settings.app_version,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
    }