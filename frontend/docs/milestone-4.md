# Milestone 4 — Analytics, Testing & Deployment

## 1. Project Overview

**Project Name:** PillSync  
**Milestone:** Milestone 4 — Analytics, Testing & Deployment  
**Frontend:** [PillSync Live Website](https://pillsync-frontend-5wt4.onrender.com)  
**Backend API:** [PillSync Backend](https://pillsync-uqts.onrender.com)  
**Backend Health Check:** [Check Backend Readiness](https://pillsync-uqts.onrender.com/health/ready/)  
**Repository:** [PillSync on GitHub](https://github.com/GKSJ-Deepvision/PillSync)

PillSync is a medication management application designed to help users manage medicines, monitor medication adherence, track refill requirements, and support caregiver monitoring.

During this milestone, the focus was on analytics integration, caregiver dashboard functionality, API authorization, backend and frontend testing, production configuration, security validation, and deployment.

## 2. Analytics Dashboard and API Integration

### Work Completed

- Integrated the analytics dashboard API endpoint: `GET /api/analytics/dashboard/`.
- Worked on dashboard data aggregation for medication adherence and refill-related information.
- Integrated analytics data into the frontend dashboard.
- Added fallback handling to help the dashboard remain usable when API data is unavailable.
- Worked with medication monitoring information, including adherence, active medications, low-stock medicines, and refill predictions.
- Connected frontend components with backend API services to display available data.

### Live Application

- [Open PillSync Dashboard](https://pillsync-frontend-5wt4.onrender.com)
- [Backend API Base URL](https://pillsync-uqts.onrender.com/api)

**Status:** Dashboard integration implemented. Actual data availability depends on authentication, API responses, and the user's records.

## 3. Caregiver Dashboard and Patient Monitoring

### Work Completed

- Developed and refined caregiver dashboard functionality.
- Worked on the **My Patients** page and patient monitoring views.
- Integrated frontend services for caregiver-patient relationships and caregiver dashboard APIs.
- Added handling for assignment loading, empty states, API errors, and retry scenarios.
- Implemented monitoring views for authorized patient information, including adherence, active medication details, low-stock medicines, and refill predictions where supported by the API.
- Improved navigation between caregiver dashboard sections.
- Removed caregiver alert navigation where a corresponding backend API was not available.
- Removed fabricated caregiver profile details, including unsupported contact, registration, and hospital information.
- Added handling for revoked caregiver-patient assignments to prevent continued access through an inactive relationship.

### Authorization and Privacy

- Added or verified regression coverage for revoked caregiver-patient assignments returning an HTTP 404 response.
- Ensured caregiver monitoring depends on an authorized caregiver-patient relationship.
- Recognized that emergency-contact status alone does not grant permission to access a patient's medication information.

### Live Application

- [PillSync Frontend](https://pillsync-frontend-5wt4.onrender.com)
- [PillSync Backend](https://pillsync-uqts.onrender.com)

**Status:** Caregiver dashboard and supported patient monitoring functionality implemented. Features requiring unavailable backend APIs remain pending.

## 4. Backend API and Production Configuration

### Work Completed

- Worked with Django REST Framework API endpoints and frontend-backend integration.
- Validated Django application configuration using the management system checks.
- Checked migration consistency to identify uncommitted or missing model migrations.
- Validated production settings for allowed hosts, PostgreSQL database configuration, CSRF settings, secure cookies, reverse-proxy HTTPS handling, and HTTP Strict Transport Security (HSTS).
- Reviewed API authorization behavior and caregiver-patient access restrictions.
- Used the production requirements and Gunicorn configuration for deployment.

### Production Backend

- **Backend:** https://pillsync-uqts.onrender.com
- **Health endpoint:** https://pillsync-uqts.onrender.com/health/ready/
- **API base URL:** https://pillsync-uqts.onrender.com/api

The readiness endpoint is used to verify whether the deployed backend is ready to serve requests. Protected API endpoints may return HTTP 401 when accessed without valid authentication; this is expected behavior for authenticated resources.

**Status:** Production configuration checks completed, and the backend was deployed to Render.

## 5. Testing and Quality Assurance

Testing was performed to validate backend functionality, frontend behavior, code quality, and production build readiness.

### Backend Validation

| Validation                  | Result             |
| --------------------------- | ------------------ |
| Django system check         | Passed             |
| Migration consistency check | Passed             |
| Black formatting check      | Passed             |
| isort import-order check    | Passed             |
| Django backend test suite   | Passed — 152 tests |

Commands used:

```powershell
backend\.venv\Scripts\python.exe manage.py check
backend\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
backend\.venv\Scripts\python.exe -m black --check apps/accounts apps/analytics apps/api
backend\.venv\Scripts\python.exe -m isort --check-only apps/accounts apps/analytics apps/api
backend\.venv\Scripts\python.exe manage.py test
```

### Frontend Validation

| Validation                                | Result            |
| ----------------------------------------- | ----------------- |
| Frontend test suite using a single worker | Passed — 23 tests |
| ESLint checks                             | Passed            |
| Production build                          | Passed            |

Commands used:

```bash
npm test -- --pool=threads --maxWorkers=1
npm run lint
npm run build
```

### Additional Test Coverage

Frontend and backend validation included work related to:

- Caregiver assignment loading, empty states, error handling, and retry behavior.
- Authorized caregiver monitoring.
- Dashboard navigation.
- Revoked caregiver-patient assignment handling.
- Backend authorization regression testing.

### Testing Note

Running the frontend test suite with the default parallel worker configuration caused some Vitest worker processes to time out in the Windows development environment. The single-worker test command completed successfully with 23 passing tests.

**Status:** The recorded backend and frontend checks passed using the commands listed above.

## 6. Deployment on Render

PillSync was deployed using Render's hosting platform.

### Live Deployment Links

| Component               | URL                                              |
| ----------------------- | ------------------------------------------------ |
| Frontend application    | https://pillsync-frontend-5wt4.onrender.com      |
| Backend service         | https://pillsync-uqts.onrender.com               |
| Backend readiness check | https://pillsync-uqts.onrender.com/health/ready/ |
| Backend API base        | https://pillsync-uqts.onrender.com/api           |
| GitHub repository       | https://github.com/GKSJ-Deepvision/PillSync      |

### Deployment Configuration

**Backend**
- Framework: Django REST Framework.
- Application server: Gunicorn.
- Production settings module: `config.settings.prod`.
- Static files collected during the build process.
- PostgreSQL configured for production.
- Readiness endpoint configured at `/health/ready/`.

**Frontend**
- Framework: React with Vite.
- Production build generated using `npm run build`.
- Build output directory: `dist`.
- Hosted as a Render static site.

### Deployment Verification

- Verified that the backend readiness endpoint returned a successful response.
- Confirmed that the deployed frontend was accessible.
- Confirmed that authentication-protected API endpoints require appropriate credentials.

**Status:** Frontend and backend deployed. Successful hosting does not by itself guarantee that every application feature or external dependency is fully operational.

## 7. OCR and Prescription Processing

PillSync includes OCR-related functionality intended to support prescription image uploads and text extraction.

During testing, the upload interface reported that the prescription image had been uploaded successfully, but extracted prescription text was not returned as expected.

The current implementation needs additional verification to ensure that the upload endpoint invokes the OCR extraction service, saves the extracted text and confidence information, and returns the resulting processing status. Production Tesseract availability and configuration also need to be verified.

**Status:** OCR upload is available, but successful end-to-end text extraction has not been confirmed. This remains a known issue requiring further investigation.

## 8. Known Limitations and Pending Features

The following functionality was not confirmed as implemented during this milestone:

- **Admin dashboard:** A complete admin dashboard was not implemented.
- **Caregiver invitations:** A dedicated invitation workflow is pending.
- **Patient consent workflow:** A complete consent-management flow is pending.
- **Caregiver alerts and notifications:** The required backend APIs were not available for full integration.
- **Admin user management:** Dedicated user-management APIs were not completed.
- **Activity logs:** A complete admin activity-log API and interface were not completed.
- **OCR extraction:** End-to-end prescription text extraction requires further verification and debugging.

These limitations are documented to distinguish completed work from functionality that still requires implementation.

## 9. Skills and Experience Gained

During this milestone, practical experience was gained in the following areas:

- **Full-stack development:** Working with a React/Vite frontend and Django REST Framework backend.
- **REST API integration:** Connecting frontend services to backend endpoints and handling API responses.
- **Analytics integration:** Displaying medication adherence and refill-related information through dashboard interfaces.
- **Access control:** Working with caregiver-patient relationships and authorization checks.
- **Error handling:** Implementing loading states, empty states, error messages, and retry behavior.
- **Automated testing:** Running Django tests and frontend tests to validate application behavior.
- **Code quality:** Using Black, isort, ESLint, and Django system checks.
- **Production configuration:** Validating database, host, CSRF, cookie, and HTTPS-related settings.
- **Deployment:** Deploying frontend and backend services to Render and verifying backend readiness.
- **Debugging:** Identifying discrepancies between successful file uploads and the expected OCR processing output.
- **Responsible development:** Avoiding fabricated profile data and documenting unsupported or incomplete features.

## 10. Final Summary

Milestone 4 focused on improving PillSync's analytics and caregiver monitoring functionality, strengthening API authorization and error handling, validating backend and frontend quality, and deploying the application to Render.

The recorded validation results include **152 passing backend tests and 23 passing frontend tests**, alongside successful linting, formatting, migration consistency, Django system checks, and frontend production builds.

The live application is available at:

- **Frontend:** https://pillsync-frontend-5wt4.onrender.com
- **Backend:** https://pillsync-uqts.onrender.com
- **Readiness check:** https://pillsync-uqts.onrender.com/health/ready/

Further work is needed to complete or verify the OCR extraction flow and to implement features that depend on currently unavailable caregiver notification, invitation, consent, and administrative APIs.

Overall, this milestone provided practical experience in full-stack integration, automated testing, API security, production configuration, deployment, and identifying issues that require further development.
