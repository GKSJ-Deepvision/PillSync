# Milestone 1 — Requirements, Database Design & Core Setup (Week 1–2)

- **Intern:** Rajasri Nallamilli (Intern #03)
- **Branch:** intern/03-rajasri-nallamilli
- **Assigned Scope in Team:** Frontend Setup, Role-based UI Routing Shell, Profile Management UI, UI Wireframes & Workflow Planning
- **Submitted on:** 2026-08-30

---

## Milestone 1 Evaluation Criteria Matrix

| Criterion | Status | Assigned Owner / Evidence |
|---|---|---|
| **Backend initialization completed** | ☐ In progress | Teammate (Backend) |
| **Authentication workflows implemented (JWT, OAuth2, sessions)** | ☐ In progress | Teammate (Auth/API) |
| **Database schema finalized** | ☐ In progress | Teammate (Database) |
| **Frontend setup completed** | ☑ **Done** | **Rajasri Nallamilli** — [frontend/src/](file:///c:/Users/rajas/OneDrive/PillSync/frontend/src/) (Vite + React, URL Routing) |
| **Role-based access control (Patient / Caregiver / Admin UI)** | ☑ **Done** | **Rajasri Nallamilli** — [AppRoutes.jsx](file:///c:/Users/rajas/OneDrive/PillSync/frontend/src/routes/AppRoutes.jsx) (`/patient`, `/caregiver`, `/admin`) |
| **User profile management (UI Shell)** | ☑ **Done** | **Rajasri Nallamilli** — [PatientProfile.jsx](file:///c:/Users/rajas/OneDrive/PillSync/frontend/src/pages/patient/PatientProfile.jsx) (`/profile`) |
| **UI wireframes and workflow planning** | ☑ **Done** | **Rajasri Nallamilli** — [UI_WIREFRAMES.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/wireframes/UI_WIREFRAMES.md) & [WORKFLOW_PLANNING.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/architecture/WORKFLOW_PLANNING.md) |
| **PostgreSQL configured** | ☐ In progress | Teammate (Database) |

---

## What I Built (Frontend & Design Scope)

1. **Frontend Setup & URL-Based Role Routing**:
   - Initialized React application with Vite, Lucide icons, and modern crimson design tokens (`#ED4264`, `#DC143C`).
   - Configured `react-router-dom` to allow **direct URL navigation** to all portal screens without authentication blocking:
     - `/` — Role Selection Landing Page
     - `/patient` — Patient Dashboard & Schedule Portal
     - `/caregiver` — Caregiver Portal & Monitored Patient Roster
     - `/admin` — Admin Management Console
     - `/login` — Login Page
     - `/register` — Account Registration Page
     - `/profile` — User Profile & Healthcare Management View

2. **UI Wireframe Specifications**:
   - Documented complete 25-screen layout blueprints, ASCII wireframes, color palette tokens, and responsive breakpoints in [docs/wireframes/UI_WIREFRAMES.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/wireframes/UI_WIREFRAMES.md).

3. **System Workflow Planning**:
   - Designed 4 Mermaid sequence & flowchart diagrams in [docs/architecture/WORKFLOW_PLANNING.md](file:///c:/Users/rajas/OneDrive/PillSync/docs/architecture/WORKFLOW_PLANNING.md) covering Auth & RBAC Matrix, Smart Reminder & Snooze Escalation, Prescription OCR Scanner Pipeline, and Adherence Tracking & Refill Prediction Engine.

---

## How to Run and Verify

```bash
# Verify Frontend build
cd frontend
npm run lint
npm run build

# Run Frontend locally (accessible directly via URL routes /patient, /caregiver, /admin)
npm run dev
```
