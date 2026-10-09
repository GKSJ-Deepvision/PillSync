# accounts — Module 1: User Authentication & Role-Based Access

Owns identity and authorisation for the whole platform.

**Implement here**
- Custom `User` model, JWT authentication, OAuth2 login, session management
- Secure password management (hashing, reset, change, strength policy)
- Roles and permissions: `PATIENT`, `CAREGIVER`, `ADMIN`
- Caregiver ↔ patient assignment and permission checks
- Admin user management and platform activity auditing

## Caregiver-patient assignments

`CaregiverPatientRelationship` is the authorization record for caregiver
monitoring. It stores a caregiver, a patient, and its creation time, prevents
duplicate pairs, and rejects self-assignment and invalid roles during model
validation.

Because the repository has no invitation or consent service, assignments are
created through the authenticated administrator-only endpoint:

`POST /api/relationships/caregiver-patients/`

with `caregiver_id` and `patient_id`. Caregivers can list their own assignments
with `GET /api/relationships/caregiver-patients/`, retrieve one of their own
records, and revoke one with `DELETE
/api/relationships/caregiver-patients/<relationship_id>/`. Administrators can
retrieve or revoke any assignment. Emergency contact fields on `Profile` do not
grant caregiver access.

**Expected files:** `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `services/`, `migrations/`, `tests/`

**Milestone:** 1 (Week 1–2)
