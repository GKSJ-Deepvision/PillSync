from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.database import engine
import apps.models as models
from apps.auth_routes import router as auth_router
from apps.medicine_routes import router as medicine_router
from apps.adherence_routes import router as adherence_router
from apps.scheduler import scheduler, check_due_medicines

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to handle startup and shutdown events.
    Starts the AsyncIOScheduler background job on startup and shuts it down on exit.
    """
    # Register check_due_medicines background job to run every 60 seconds
    scheduler.add_job(
        check_due_medicines,
        "interval",
        seconds=60,
        id="check_due_medicines",
        replace_existing=True
    )
    scheduler.start()
    yield
    # Graceful shutdown of scheduler
    scheduler.shutdown(wait=False)

app = FastAPI(
    title="PillSync Backend",
    description="API Gateway for Medicine Reminder & Medication Tracking Platform",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(adherence_router)

@app.get("/")
def health_check():
    return {"status": "online", "message": "PillSync FastAPI Server is running smoothly!"}