# PillSync Architecture

## Overview

PillSync is a healthcare medication-management application with a React/Vite frontend and a Django REST Framework backend.

## Main components

- Frontend: React + Vite
- Backend: Django 5.2 + Django REST Framework
- Authentication: Supabase JWT
- Database: Supabase/PostgreSQL
- OCR: Tesseract-based prescription extraction with the project's OCR processing pipeline
- Containerisation: Docker
- CI/CD: GitHub Actions

## User roles

- Patient
- Caregiver
- Admin

## Django applications

The backend contains the following Django applications:

- accounts
- adherence
- analytics
- common
- medications
- notifications
- ocr
- prescriptions
- profiles
- refills
- reminders

## Main workflow

1. User authenticates through the application.
2. The frontend communicates with Django REST API endpoints for backend-managed operations.
3. Medication and adherence information is stored in Supabase/PostgreSQL.
4. Prescription images can be processed through the OCR pipeline.
5. Extracted medication information is validated before being used.
6. Dose logs are used for adherence calculations and trends.
7. Refill information is used for low-stock/refill notifications.
8. Role-specific dashboards display the appropriate information.

## Frontend structure

The frontend uses React and Vite with shared routing, layouts and protected routes. It also contains role-specific patient, caregiver and admin features.

## Backend structure

The Django backend is organised into separate applications for accounts, adherence, analytics, common functionality, medications, notifications, OCR, prescriptions, profiles, refills and reminders.

## Supabase data access and Row Level Security

Most application API operations are handled through the Django REST Framework backend. However, selected frontend features also access Supabase directly.

`CaregiverAdherencePage.jsx` directly queries Supabase for caregiver-related data, including:

- `caregiver_links`
- `profiles`
- `dose_logs`

These requests use the configured Supabase client. Access to the underlying records is controlled by Supabase Row Level Security (RLS) policies.

Therefore, the application's effective data-access architecture includes both Django API endpoints and controlled direct Supabase queries.

Authentication and RLS policies must remain correctly configured so that users can access only the records permitted for their role and relationship.

## OCR workflow

The OCR feature accepts prescription images through the backend OCR endpoint. The processing pipeline extracts medication-related information such as medication name, dosage, quantity and frequency. Extracted information is validated before being returned to the application.

In addition to Tesseract-based extraction, the pipeline can call a hosted vision model (Gemini, Anthropic or OpenAI, selected through configuration). The model's JSON response is normalised and validated: fields are range-checked, quantities are cross-checked against dose frequency and duration, and handwritten or low-confidence results are flagged for user review.

## Deployment architecture

The project provides Dockerfiles for both backend and frontend and a Docker Compose configuration for local/container-based execution.

Live deployment details are recorded separately after an actual hosting deployment is completed.