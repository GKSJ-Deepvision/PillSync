import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleBasedRoute, PublicRoute } from './ProtectedRoute';

// Auth pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';

// App pages
import { DashboardPage } from '../pages/DashboardPage';

// Medications pages
import { MedicationsPage } from '../features/medications/pages/MedicationsPage';
import { MedicationDetailPage } from '../features/medications/pages/MedicationDetailPage';
import { MedicationFormPage } from '../features/medications/pages/MedicationFormPage';

// Reminders pages
import { RemindersPage } from '../features/reminders/pages/RemindersPage';

// Adherence pages
import { AdherencePage } from '../features/adherence/pages/AdherencePage';

// Caregiver & Admin Pages
import { PatientsPage } from '../features/caregiver/pages/PatientsPage';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';

// Placeholder pages for features
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 text-xs mt-2">Clinical module integration active.</p>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Common Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Medications Routes */}
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <MedicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications/new"
          element={
            <ProtectedRoute>
              <MedicationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications/:id"
          element={
            <ProtectedRoute>
              <MedicationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications/:id/edit"
          element={
            <ProtectedRoute>
              <MedicationFormPage />
            </ProtectedRoute>
          }
        />

        {/* Reminders Routes */}
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <RemindersPage />
            </ProtectedRoute>
          }
        />

        {/* Adherence Routes */}
        <Route
          path="/adherence"
          element={
            <ProtectedRoute>
              <AdherencePage />
            </ProtectedRoute>
          }
        />

        {/* Caregiver & Admin Role-Protected Routes */}
        <Route
          path="/patients"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'caregiver']}>
              <PatientsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'caregiver']}>
              <PatientsPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'caregiver']}>
              <AnalyticsPage />
            </RoleBasedRoute>
          }
        />

        {/* Admin-Only User Management Route */}
        <Route
          path="/admin/users"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </RoleBasedRoute>
          }
        />

        {/* Other Routes */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Messages & Clinical Alerts" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Account & Security Settings" />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
