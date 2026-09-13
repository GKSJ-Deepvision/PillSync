import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleBasedRoute, PublicRoute } from './ProtectedRoute';

// Auth & Landing pages
import { LandingPage } from '../features/landing/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';

// App pages
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';

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
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { OCRPage } from '../features/ocr/pages/OCRPage';
import { RefillPage } from '../features/refills/pages/RefillPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

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
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
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
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ocr"
          element={
            <ProtectedRoute>
              <OCRPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/refills"
          element={
            <ProtectedRoute>
              <RefillPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Welcome Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Catch all - redirect to root landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
