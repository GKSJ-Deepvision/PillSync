# PillSync Deployment Guide

This guide details running the production container stack and deploying PillSync to container-enabled platforms (e.g., Render, AWS ECS, or local Docker Compose).

## 1. Production Docker Compose Stack

The stack in `docker-compose.prod.yml` spins up:
- **db**: PostgreSQL 16 Alpine container with persistent data volume `pgdata_prod`.
- **redis**: Redis 7 Alpine caching & Celery broker.
- **backend**: Django Gunicorn WSGI server running on 4 workers at `0.0.0.0:8000`.
- **worker**: Celery worker executing background reminder dispatch and stock checks.
- **beat**: Celery beat running scheduled jobs (overdue reminders sweep, refill alert evaluations).
- **frontend**: Nginx reverse proxy serving the compiled React 19 / Vite single-page application on port 80.

### Starting the Stack

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Checking Status & Health
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 2. Render Deployment

The repository includes a `render.yaml` blueprint defining:
- Web service for `pillsync-backend` (Python 3.12, Gunicorn, PostgreSQL, Redis).
- Static site for `pillsync-frontend` (`npm run build`, output `./dist`).
- Managed PostgreSQL database `pillsync-db`.
- Managed Redis instance `pillsync-redis`.

To deploy:
1. Connect your repository to Render.
2. Select **Blueprints** and point to `render.yaml`.
3. Set environment variables for production secrets.
