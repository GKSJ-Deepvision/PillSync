# config — Project configuration

- `settings/base.py` — shared settings; read every secret from the environment
- `settings/dev.py` — local development (SQLite, debug toolbar, console email)
- `settings/prod.py` — production (PostgreSQL, secure cookies, allowed hosts)
- `urls.py` — root URL router that includes each app's `urls.py`
- `asgi.py` / `wsgi.py` — server entrypoints
- `celery.py` — background worker for reminders, notifications and refill jobs

Never hardcode a secret key, database password or provider token here.
Add the variable to `.env.example` with an empty or dummy value instead.
