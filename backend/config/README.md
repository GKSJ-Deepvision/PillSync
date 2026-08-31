# config — Project configuration

This branch uses the **FastAPI alternative** mentioned in `backend/README.md`, so
this folder holds FastAPI's equivalent of Django's `config/`:

- `settings.py` — `pydantic-settings` `Settings` class; every value is read from the
  environment (see `backend/.env.example`), nothing is hardcoded here.
- `database.py` — the async SQLAlchemy engine, the `async_sessionmaker`, and the
  `get_db` FastAPI dependency that yields a request-scoped `AsyncSession`.
- `main.py` — the application entrypoint. Exposes `app = FastAPI(...)`, wires up
  CORS, the global exception handlers, the `/api/v1` router, and a lifespan hook
  that verifies the database is reachable on startup. Run it with:
  `uvicorn config.main:app --reload`.
- `exceptions.py` — global exception handlers and the standard JSON error envelope.

Never hardcode a secret key, database password or provider token here. Add the
variable to `.env.example` with an empty or dummy value instead.

Per-app routers live in `apps/<app>/routes.py` and are mounted from
`api/v1/router.py`, not from here — that keeps `config/` app-agnostic.
