# Architecture

**Milestone 1 deliverable — system architecture and tech decisions.**

## System overview

```mermaid
flowchart TB
    subgraph clients["Clients"]
        browser["React SPA<br/>patients · caregivers · admins"]
    end

    subgraph edge["Edge"]
        nginx["nginx<br/>static bundle + /api proxy"]
    end

    subgraph api["Django REST Framework"]
        auth["accounts<br/>JWT · OAuth2 · RBAC"]
        profiles["profiles<br/>patients · conditions · contacts"]
        common["common<br/>reference data · permissions"]
        future["Milestone 2-4<br/>medications · ocr · reminders<br/>adherence · refills · analytics"]
    end

    subgraph workers["Background (wired now, used from M2)"]
        celery["Celery worker"]
        beat["Celery beat<br/>reminder scheduling"]
    end

    subgraph data["Data"]
        pg[("PostgreSQL 16")]
        redis[("Redis<br/>broker + cache")]
        files[("Media storage<br/>prescription images")]
    end

    subgraph external["External services"]
        google["Google OAuth2"]
        fcm["Firebase Cloud Messaging"]
        twilio["Twilio SMS"]
        sendgrid["SendGrid email"]
        openai["OpenAI + Tesseract<br/>OCR pipeline"]
    end

    browser -->|HTTPS| nginx
    nginx --> auth
    nginx --> profiles
    nginx --> common
    nginx --> future

    auth --> pg
    profiles --> pg
    common --> pg
    future --> pg
    future --> files

    auth -.verify id_token.-> google
    celery --> redis
    beat --> redis
    celery --> pg
    celery -.-> fcm
    celery -.-> twilio
    celery -.-> sendgrid
    future -.-> openai

    style future stroke-dasharray: 5 5
    style workers stroke-dasharray: 5 5
    style external stroke-dasharray: 5 5
```

Dashed boxes are wired but not yet exercised: Milestone 1 delivers the solid
path — browser to API to PostgreSQL.

## Request path: signing in

```mermaid
sequenceDiagram
    participant U as Patient
    participant SPA as React SPA
    participant API as DRF
    participant DB as PostgreSQL

    U->>SPA: email + password
    SPA->>API: POST /api/v1/auth/login/
    API->>DB: fetch user, verify Argon2 hash
    DB-->>API: user row
    API-->>SPA: access (30 min) + refresh (7 days) + user
    SPA->>SPA: store tokens, hydrate auth slice

    Note over SPA,API: 30 minutes later
    SPA->>API: GET /api/v1/profiles/patients/ (expired access)
    API-->>SPA: 401
    SPA->>API: POST /api/v1/auth/token/refresh/
    API-->>SPA: new access + rotated refresh
    SPA->>API: retry the original request
    API-->>SPA: 200
```

The refresh and replay happen inside `src/api/client.js`; no feature code sees a
401. Concurrent 401s share one refresh call, so ten requests firing after
expiry do not start ten refreshes.

## Authorisation model

```mermaid
flowchart LR
    req["Request"] --> jwt{"Valid JWT?"}
    jwt -->|no| a401["401"]
    jwt -->|yes| role{"Role check<br/>IsAdmin / IsPatient / IsCaregiver"}
    role -->|fails| a403["403"]
    role -->|passes| qs["get_queryset()<br/>accessible_patient_profiles()"]
    qs --> obj{"Object permission<br/>owner? manager?<br/>ACTIVE assignment?"}
    obj -->|fails| a404["404 / 403"]
    obj -->|passes| ok["200"]
```

Three layers, and the middle one matters most: every profile endpoint filters
through `accessible_patient_profiles()`, so a record the caller may not see is
never in the queryset to begin with. A forgotten object-permission check cannot
leak data, because the row was never fetched. The list endpoint returns 404 for
someone else's id rather than 403 — a 403 would confirm the record exists.

## Technology decisions

| Decision | Chosen | Why |
|---|---|---|
| Backend framework | Django REST Framework | The specification's first choice. Its ORM, migrations, admin and auth cover most of Milestone 1 with code we do not have to write or test. |
| Database | PostgreSQL 16 | Named in the specification. Partial unique indexes (one primary emergency contact per patient) and JSONB (secondary medicine categories) are both used. |
| Auth | JWT (SimpleJWT) + Google OAuth2 | Stateless tokens suit a SPA plus the future mobile client. Refresh rotation with blacklisting means a stolen refresh token is usable once. |
| Password hashing | Argon2 | Memory-hard, and the current OWASP recommendation. |
| Primary keys | UUIDv4 | Ids appear in URLs shared between patient and caregiver. |
| API schema | drf-spectacular | The OpenAPI document is generated from the code, so `docs/api/openapi.yaml` cannot drift from what the server actually does. |
| Background jobs | Celery + Redis | Reminders in Milestone 2 need scheduled, retryable delivery. Configured now so Milestone 2 adds tasks rather than plumbing. |
| Frontend build | Vite + React 19 | Fast dev server, and the specification names React. |
| Frontend state | Redux Toolkit | Session state is read by nearly every screen; prop drilling it would be worse. Server data uses a small `useApi` hook instead — it is cache, not state. |
| Styling | Tailwind CSS v4 | Named in the specification. v4 needs no config file. |
| Tests | pytest + Vitest | pytest is specified. Vitest shares Vite's transform pipeline, so tests and build never disagree. |

## Security posture at Milestone 1

- Argon2 password hashing, with Django's validators plus a 10-character minimum.
- Access tokens live 30 minutes; refresh tokens rotate and the old one is blacklisted.
- Login is throttled to 10/min, registration and password reset to 5/hour — the
  endpoints where trying repeatedly is the whole attack.
- Password reset says the same thing whether or not the address is registered,
  so it cannot be used to enumerate accounts. Login does the same.
- Google ID tokens are verified against Google's public keys **and** our own
  client id; without the audience check, a token minted for any other
  application would be accepted.
- Every credential comes from the environment. `scan_secrets.py` runs in CI on
  every push.
- Production settings refuse to start without a real `SECRET_KEY` and
  `ALLOWED_HOSTS`, and force HTTPS, HSTS and secure cookies.
- Uploads are capped at 10 MB, which matters from Milestone 3.

## Deployment

```mermaid
flowchart LR
    dev["docker compose up<br/>db · redis · backend · worker · beat · frontend"]
    ci["GitHub Actions<br/>lint · tests · image build"]
    reg["ghcr.io<br/>pillsync-backend / pillsync-frontend"]
    host["Render / AWS / Azure"]

    dev --> ci --> reg --> host
```

`docker-compose.yml` runs the whole stack locally. CI builds both images on
every push once there is an app to containerise; the CD workflow publishes them
on demand in Milestone 4.
