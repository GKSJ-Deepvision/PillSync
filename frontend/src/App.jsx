import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./features/profile/ProfilePage";
import MedicationsPage from "./features/medications/MedicationsPage";
import MedicationForm from "./features/medications/MedicationForm";
import RemindersPage from "./features/reminders/RemindersPage";
import HistoryPage from "./features/adherence/HistoryPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import ScanPage from "./features/ocr/ScanPage";
import RefillsPage from "./features/refills/RefillsPage";
import AdherenceReportPage from "./features/adherence/AdherenceReportPage";
import CaregiverMedicationsPage from "./features/caregiver/CaregiverMedicationsPage";
import MyPatientsPage from "./features/caregiver/MyPatientsPage";
import CaregiverAdherencePage from "./features/caregiver/CaregiverAdherencePage";
import AdminUsersPage from "./features/admin/AdminUsersPage";
import AdminPatientsPage from "./features/admin/AdminPatientsPage";
import AdminCaregiversPage from "./features/admin/AdminCaregiversPage";
import AdminMedicationsPage from "./features/admin/AdminMedicationsPage";
import AdminOCRMonitoringPage from "./features/admin/AdminOCRMonitoringPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                <MedicationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications/:id/edit"
            element={
              <ProtectedRoute>
                <MedicationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <RemindersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/refills"
            element={
              <ProtectedRoute>
                <RefillsPage />
              </ProtectedRoute>
            }
          />
          <Route
    path="/adherence-report"
    element={
      <ProtectedRoute>
        <AdherenceReportPage />
      </ProtectedRoute>
    }
  />

          <Route
            path="/caregiver/medications"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CaregiverMedicationsPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/caregiver/patients"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <MyPatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver/adherence"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CaregiverAdherencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/caregivers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCaregiversPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medications"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMedicationsPage />
              </ProtectedRoute>
            }
          />          <Route
            path="/admin/ocr"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOCRMonitoringPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
