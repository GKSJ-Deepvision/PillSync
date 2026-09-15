# PillSync — Milestone 1 Frontend

PillSync is an **intelligent medication-management and caregiver-support platform** that links patients, caregivers, and administrators in a unified healthcare network. This repository contains the **Milestone 1 React frontend** — a complete, polished, and functional UI ready for Django REST API backend integration.

---

## 📋 Milestone 1 Scope

Milestone 1 delivers the complete frontend foundation:

- ✅ Authentication system (Login, Register, Forgot/Reset Password)
- ✅ Three role types: **Patient**, **Caregiver**, **Admin**
- ✅ Role-based navigation (sidebar auto-adjusts per role)
- ✅ Role-based route protection
- ✅ Patient Dashboard, Profile, Edit Profile, Settings
- ✅ Patient medication management, dose scheduling, adherence summaries, and notifications
- ✅ Caregiver Dashboard, Profile, My Patients, Patient Details, Alerts
- ✅ Admin Dashboard, User Management (with modals), Activity Log
- ✅ Reusable component library (Button, Input, Card, Modal, Loading, etc.)
- ✅ Centralized Axios API service layer (ready for Django REST backend)
- ✅ Mock data layer separated from UI components
- ✅ Workflow documentation
- ✅ Automated tests (Vitest + React Testing Library)
- ✅ ESLint configured
- ✅ Production build tested

---

## 🛠 Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| React | ^19 | UI Framework |
| Vite | ^8 | Build Tool & Dev Server |
| JavaScript (JSX) | ES2020+ | Application Language |
| Tailwind CSS | ^3 | Component Styling |
| React Router DOM | ^7 | Client-Side Routing |
| Axios | ^1 | HTTP Client |
| React Context API | Built-in | Auth State Management |
| Lucide React | Latest | Icon Library |
| Vitest | Latest | Unit Testing |
| React Testing Library | Latest | Component Testing |
| ESLint | ^10 | Code Quality |

---

## 🚀 Installation & Running Locally

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# 1. Navigate to the frontend directory
cd pillsync-frontend

# 2. Install all dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start the development server
npm run dev
```

The application will be available at: **http://localhost:5173**

In a second terminal, start the backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

The Django API runs at **http://localhost:8000/api** and persists data in `backend/db.sqlite3`.

---

## 🌍 Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

> **Note:** The frontend service layer uses the Django REST API at `VITE_API_BASE_URL`.

---

## 🔐 Authentication

### Backend Authentication (Milestone 1)

Authentication uses Django REST Framework JWT tokens. The frontend stores the access token and current user in `localStorage`, while passwords, roles, account status, and audit events are persisted in SQLite.

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Patient** | patient@pillsync.com | password123 |
| **Caregiver** | caregiver@pillsync.com | password123 |
| **Admin** | admin@pillsync.com | password123 |

The backend setup and endpoint details are documented in [backend/README.md](backend/README.md).

---

## 👥 Roles

### Patient
- View personalized dashboard with medication summaries
- Manage profile and edit personal information
- Add medications, log dose status, review adherence, and manage notifications
- Navigation: Dashboard, Profile, Medicines, Schedule, Adherence, Notifications, Settings

### Caregiver
- View care coordination dashboard with patient summaries
- Manage assigned patients and view detailed records
- View and resolve patient alerts
- Navigation: Dashboard, Profile, My Patients, Alerts, Settings

### Admin
- View system-wide statistics and audit trails
- Manage all user accounts (view, edit, disable/enable)
- Search and filter activity logs
- Navigation: Dashboard, Profile, User Management, Activity Log, Settings

---

## 🗺 Routing

| Route | Access | Component |
|-------|--------|-----------|
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/forgot-password` | Public | ForgotPassword |
| `/reset-password` | Public | ResetPassword |
| `/unauthorized` | Public | Unauthorized |
| `/dashboard` | Protected | Role-based dashboard |
| `/profile` | Protected | Role-based profile |
| `/settings` | Protected | Settings |
| `/profile/edit` | Patient only | EditProfile |
| `/medicines` | Patient only | Medicines |
| `/schedule` | Patient only | Schedule |
| `/adherence` | Patient only | Adherence |
| `/notifications` | Patient only | Notifications |
| `/patients` | Caregiver only | MyPatients |
| `/patients/:id` | Caregiver only | PatientDetails |
| `/alerts` | Caregiver only | Alerts |
| `/users` | Admin only | UserManagement |
| `/activity-log` | Admin only | ActivityLog |

---

## 📁 Folder Structure

```
pillsync-frontend/
│
├── public/
│
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Loading.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── EmptyState.jsx
│   │   └── RoleBadge.jsx
│   │
│   ├── pages/
│   │   ├── auth/            # Authentication pages
│   │   ├── patient/         # Patient-specific pages
│   │   ├── caregiver/       # Caregiver-specific pages
│   │   └── admin/           # Admin-specific pages
│   │
│   ├── layouts/             # Page layout wrappers
│   │   ├── AuthLayout.jsx
│   │   └── DashboardLayout.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx  # Global auth state (React Context API)
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx    # All route declarations
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRoute.jsx
│   │
│   ├── services/            # API service layer
│   │   ├── api.js           # Axios instance + interceptors
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── patientService.js
│   │
│   ├── data/
│   │   └── mockData.js      # All mock data (decoupled from UI)
│   │
│   ├── tests/               # Vitest test suites
│   │   ├── auth.test.jsx
│   │   ├── dashboards.test.jsx
│   │   └── routes.test.jsx
│   │
│   ├── App.jsx              # Root component (Router + AuthProvider)
│   ├── main.jsx             # React DOM entry point
│   ├── index.css            # Global styles + Tailwind directives
│   └── setupTests.js        # Vitest + Jest DOM setup
│
├── docs/
│   └── MILESTONE_1_WORKFLOWS.md
│
├── index.html               # Vite HTML entry point
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment variable template
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── eslint.config.js
├── package.json
└── README.md
```

---

## 🔌 API Service Architecture

The API layer is centralized in `src/services/`:

### `api.js` — Axios Instance
- Base URL from `VITE_API_BASE_URL` environment variable
- Request interceptor: automatically attaches `Authorization: Bearer <token>` header
- Response interceptor: handles 401 Unauthorized errors by clearing localStorage and dispatching a global logout event

### Service Files
- `authService.js` — login, register, forgotPassword, resetPassword, logout
- `userService.js` — fetchProfile, updateProfile
- `patientService.js` — fetchMyPatients, fetchPatientDetails, fetchUserList, fetchActivityLogs

> No Axios requests are made directly inside UI components. All API interactions go through the service layer.

---

## 🧪 Testing

Run all tests:

```bash
npm test
```

Tests use **Vitest** and **React Testing Library**. The test suite covers:

- Auth page rendering (Login, Register, ForgotPassword)
- Dashboard rendering per role (Patient, Caregiver, Admin)
- Protected route redirects for unauthenticated users
- Role-based route access enforcement

Tests run **without a backend** — all dependencies are mocked.

---

## 🔍 Linting

```bash
npm run lint
```

ESLint is configured with React Hooks and React Refresh plugins.

---

## 📦 Production Build

```bash
npm run build
```

Output is generated in the `dist/` folder. Preview the production build with:

```bash
npm run preview
```

---

## 📈 Completed Milestone 2

- OCR medicine-label extraction with confirmation
- Refill estimates based on quantity and frequency
- Medication safety information for supported combinations
- Missed-dose risk scoring and adherence-pattern detection
- Persistent medication, dose, adherence, and notification workflows

Milestone 2 intelligence features are explainable decision-support estimates based on the patient&apos;s recorded medication and adherence data. They are not a diagnosis or a replacement for advice from a qualified healthcare professional.

## 🔮 Deferred Integrations

- **WhatsApp / SMS Alerts** — Real-time external notification delivery
- **Adherence PDF exports** — Report generation beyond the live summary
- **Voice Reminders** — Audio dosage reminders
- **Wearables Integration** — Sync with health devices
- **Pharmacy Integration** — Direct refill ordering

---

## ⚠️ Security Notice

> Frontend role-based access control (RoleRoute) is a **UI convenience only**. All true authorization and security enforcement will be handled by the Django REST API backend. Never rely on frontend-only role checking for sensitive operations.

---

## 📄 License

PillSync is developed for educational and demonstration purposes as part of a university project milestone.
