from fastapi import FastAPI

from apps.accounts.urls import router as accounts_router

app = FastAPI(
    title="PillSync API",
    version="1.0.0",
)

app.include_router(accounts_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
