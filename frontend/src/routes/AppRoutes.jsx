import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import MedicationsPage from "../pages/MedicationsPage";
import OcrUploadPage from "../pages/OcrUploadPage";
import RemindersPage from "../pages/RemindersPage";
import RefillsPage from "../pages/RefillsPage";
import CaregiverPage from "../pages/CaregiverPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import ProfilePage from "../pages/ProfilePage";

import ProtectedRoleRoute from "../components/common/ProtectedRoleRoute";

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar
          mobileOpen={mobileOpen}
          closeMobileSidebar={() => setMobileOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/medications"
              element={
                <ProtectedRoleRoute allowedRoles={["patient", "caregiver", "admin"]}>
                  <MedicationsPage />
                </ProtectedRoleRoute>
              }
            />
            <Route
              path="/ocr-upload"
              element={
                <ProtectedRoleRoute allowedRoles={["caregiver", "admin"]}>
                  <OcrUploadPage />
                </ProtectedRoleRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoleRoute allowedRoles={["patient", "caregiver"]}>
                  <RemindersPage />
                </ProtectedRoleRoute>
              }
            />
            <Route
              path="/refills"
              element={
                <ProtectedRoleRoute allowedRoles={["caregiver", "admin"]}>
                  <RefillsPage />
                </ProtectedRoleRoute>
              }
            />
            <Route
              path="/caregiver"
              element={
                <ProtectedRoleRoute allowedRoles={["caregiver", "admin"]}>
                  <CaregiverPage />
                </ProtectedRoleRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoleRoute allowedRoles={["caregiver", "admin"]}>
                  <AnalyticsPage />
                </ProtectedRoleRoute>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
