from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.database import engine
import apps.models as models
from apps.auth_routes import router as auth_router
from apps.medicine_routes import router as medicine_router

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PillSync Backend",
    description="API Gateway for Medicine Reminder & Medication Tracking Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers together
app.include_router(auth_router)
app.include_router(medicine_router)

@app.get("/")
def health_check():
    return {"status": "online", "message": "PillSync FastAPI Server is running smoothly!"}