import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
import ProfilePage from "../features/profile/ProfilePage";
import MedicationsPage from "../features/medications/MedicationsPage";
import HistoryPage from "../features/reminders/HistoryPage";
import RefillsPage from "../features/refills/RefillsPage";
import AdherenceDashboard from "../features/adherence/AdherenceDashboard";
import DietPlannerPage from "../features/fitness/pages/DietPlannerPage";
import ProgressStreakPage from "../features/fitness/pages/ProgressStreakPage";
import PrescriptionUploadPage from "../features/prescriptions/PrescriptionUploadPage";
import OCRPage from "../features/ocr/OCRPage";

import PatientDashboard from "../pages/PatientDashboard";
import CaregiverDashboard from "../pages/CaregiverDashboard";
import AdminDashboard from "../pages/AdminDashboard";

function RoleDashboard() {
  const { role } = useAuth();
  if (role === "caregiver") return <CaregiverDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <PatientDashboard />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
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
          <ProtectedRoute allowedRoles={["patient"]}>
            <MedicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PrescriptionUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ocr"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <OCRPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/refills"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <RefillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/adherence"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <AdherenceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diet-planner"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DietPlannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={<Navigate to="/diet-planner" replace />}
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <ProgressStreakPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
