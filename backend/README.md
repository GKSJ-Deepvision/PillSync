# PillSync — Backend

Python API for the PillSync platform.

**Stack (from the project spec):** Python + Django REST Framework (FastAPI is the
approved alternative), PostgreSQL in production / SQLite for local development,
Tesseract OCR + spaCy + OpenAI API, JWT + OAuth2, Pytest + Django Test Client.

## Layout

| Path | Purpose |
|---|---|
| `config/` | Project settings (`settings/base.py`, `dev.py`, `prod.py`), root URLs, ASGI/WSGI, Celery |
| `apps/` | One Django app per spec module — see the README inside each |
| `tests/` | Cross-app tests: `unit/`, `integration/`, shared `fixtures/` |
| `requirements/` | `base.txt`, `dev.txt`, `prod.txt` |
| `scripts/` | Management and seed scripts |
| `static/`, `media/` | Static assets and uploaded files (uploads are **not** committed) |

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

On Windows the activate step is `.venv\Scripts\activate` instead.

## Checks CI will run on your branch

```bash
ruff check .
black --check .
isort --check-only .
pytest
```

Run all four locally before you push. `black .` and `isort .` fix formatting for you.

If you choose FastAPI instead of Django, keep the same folder layout, expose the app
as `config/main.py:app`, and keep `pytest` as the test runner — CI works either way.
