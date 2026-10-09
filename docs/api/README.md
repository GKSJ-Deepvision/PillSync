# API reference

**Milestone 1 deliverable — endpoint documentation.**

The full contract is [`openapi.yaml`](openapi.yaml), generated from the code by
drf-spectacular, so it cannot drift from what the server actually does.

```bash
cd backend
python manage.py spectacular --file ../docs/api/openapi.yaml   # regenerate
```

With the server running, the same schema is browsable:

| URL | What it is |
|---|---|
| `http://localhost:8000/api/docs/` | Swagger UI — try requests against your own data |
| `http://localhost:8000/api/redoc/` | Redoc — easier to read end to end |
| `http://localhost:8000/api/schema/` | The raw OpenAPI document |

Everything lives under `/api/v1/`. The version is in the path so a future
breaking change can ship as `/api/v2/` without stranding old clients.

## Authentication

Send the access token as a bearer token:

```http
Authorization: Bearer <access token>
```

Access tokens last 30 minutes, refresh tokens 7 days. Refresh tokens rotate:
using one returns a new pair and blacklists the old refresh token, so a stolen
token is usable at most once.

## Endpoints

### Auth — `/api/v1/auth/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `register/` | — | Create a patient or caregiver account; returns tokens |
| POST | `login/` | — | Email + password; returns tokens and the user |
| POST | `google/` | — | Exchange a verified Google ID token for tokens |
| POST | `logout/` | yes | Blacklist a refresh token |
| POST | `token/refresh/` | — | New access token from a refresh token |
| POST | `token/verify/` | — | Check whether a token is still valid |
| POST | `password/change/` | yes | Change password, current one required |
| POST | `password/reset/` | — | Email a reset link |
| POST | `password/reset/confirm/` | — | Set a new password from `uid` + `token` |

Rate limits: `login` 10/min, `register` and `password/reset` 5/hour.

### Users — `/api/v1/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/PATCH | `users/me/` | yes | Read or update your own account |
| GET | `admin/users/` | admin | List, search and filter users |
| GET/PATCH | `admin/users/{id}/` | admin | One user |
| POST | `admin/users/{id}/deactivate/` | admin | Deactivate (never delete) |
| POST | `admin/users/{id}/activate/` | admin | Reactivate |

### Caregiving — `/api/v1/caregiver-assignments/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `` | yes | Your links — as patient or as caregiver |
| POST | `` | patient | Invite a caregiver by email; created `PENDING` |
| GET/PATCH/DELETE | `{id}/` | party | One assignment |
| POST | `{id}/accept/` | patient | Grant access |
| POST | `{id}/decline/` | patient | Refuse the request |
| POST | `{id}/revoke/` | either | End an active link |

### Profiles — `/api/v1/profiles/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `patients/` | yes | Every profile you may see |
| POST | `patients/` | yes | Add a family member's profile |
| GET | `patients/me/` | yes | Your own profile |
| GET/PATCH/DELETE | `patients/{id}/` | owner/caregiver | One profile; DELETE deactivates |
| GET/POST | `patient-conditions/` | yes | Conditions a patient is treated for |
| GET/POST | `emergency-contacts/` | yes | Who to call |
| GET | `caregivers/me/` | caregiver | Your caregiver profile |

A caregiver has read access only while their assignment is `ACTIVE`, and never
write access to a patient's profile.

### Reference — `/api/v1/reference/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `medicines/` | yes | Medicine catalogue; `?search=`, `?category=` |
| GET | `conditions/` | yes | Condition list |
| GET | `categories/` | yes | Per-category medicine counts |
| GET | `enums/` | — | Every dropdown option in one call |

`GET /health/` (no prefix) is the liveness probe.

## Response shapes

Lists are paginated. `page_size` is client-controlled and capped, so one request
cannot pull the whole catalogue:

```json
{
  "count": 1764,
  "next": "http://localhost:8000/api/v1/reference/medicines/?page=2",
  "previous": null,
  "results": []
}
```

Every error uses one envelope, whatever went wrong:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request could not be processed. See details.",
    "details": { "email": ["An account with this email already exists."] }
  }
}
```

Codes: `validation_error`, `not_authenticated`, `permission_denied`,
`not_found`, `method_not_allowed`, `conflict`, `throttled`, `server_error`.

## A worked example

```bash
BASE=http://localhost:8000/api/v1

# 1. Register - the response already contains usable tokens
curl -s -X POST "$BASE/auth/register/" -H 'Content-Type: application/json' -d '{
  "email": "asha@example.com",
  "full_name": "Asha Patel",
  "password": "correct-horse-battery-42",
  "password_confirm": "correct-horse-battery-42",
  "role": "PATIENT"
}'

# 2. Or sign in later
ACCESS=$(curl -s -X POST "$BASE/auth/login/" -H 'Content-Type: application/json' \
  -d '{"email":"asha@example.com","password":"correct-horse-battery-42"}' \
  | python -c 'import sys,json; print(json.load(sys.stdin)["access"])')

# 3. Your own profile, created for you at registration
curl -s -H "Authorization: Bearer $ACCESS" "$BASE/profiles/patients/me/"

# 4. Add a family member
curl -s -X POST "$BASE/profiles/patients/" \
  -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"full_name":"Asha'"'"'s Mother","relationship_to_manager":"PARENT"}'

# 5. Search the catalogue
curl -s -H "Authorization: Bearer $ACCESS" \
  "$BASE/reference/medicines/?search=metformin&category=DIABETES"
```

A Postman collection can be generated by importing `openapi.yaml` directly.
