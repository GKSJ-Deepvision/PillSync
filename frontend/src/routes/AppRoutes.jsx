import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import PatientLoginPage from '../pages/public/PatientLoginPage';
import CaregiverLoginPage from '../pages/public/CaregiverLoginPage';
import AdminLoginPage from '../pages/public/AdminLoginPage';
import PatientRegisterPage from '../pages/public/PatientRegisterPage';
import CaregiverRegisterPage from '../pages/public/CaregiverRegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';

// Patient Portal Pages
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientProfile from '../pages/patient/PatientProfile';
import MyMedicinesPage from '../pages/patient/MyMedicinesPage';
import AddMedicinePage from '../pages/patient/AddMedicinePage';
import MedicineSchedulePage from '../pages/patient/MedicineSchedulePage';
import AdherencePage from '../pages/patient/AdherencePage';
import RefillPredictionPage from '../pages/patient/RefillPredictionPage';
import DiseaseCategoriesPage from '../pages/patient/DiseaseCategoriesPage';
import NotificationsPage from '../pages/patient/NotificationsPage';
import MedicationHistoryPage from '../pages/patient/MedicationHistoryPage';
import PrescriptionsPage from '../pages/patient/PrescriptionsPage';

// Caregiver Portal Pages
import CaregiverDashboard from '../pages/caregiver/CaregiverDashboard';
import CaregiverPatientDetail from '../pages/caregiver/CaregiverPatientDetail';

// Admin Portal Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagementPage from '../pages/admin/UserManagementPage';
import NotificationSettingsPage from '../pages/admin/NotificationSettingsPage';

export default function AppRoutes({ currentUser, setCurrentUser, setCurrentRole }) {
  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    setCurrentRole(userObj.role);
  };

  return (
    <Routes>
      {/* 1. Public & Role Selection Landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PatientLoginPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/login/patient" element={<PatientLoginPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/login/caregiver" element={<CaregiverLoginPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/login/admin" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />

      <Route path="/register" element={<PatientRegisterPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register/patient" element={<PatientRegisterPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register/caregiver" element={<CaregiverRegisterPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 2. Patient Portal Routes (Direct URL Access) */}
      <Route path="/patient" element={<PatientDashboard currentUser={currentUser} />} />
      <Route path="/patient/dashboard" element={<PatientDashboard currentUser={currentUser} />} />
      <Route path="/profile" element={<PatientProfile currentUser={currentUser} />} />
      <Route path="/patient/profile" element={<PatientProfile currentUser={currentUser} />} />
      <Route path="/medicines" element={<MyMedicinesPage />} />
      <Route path="/patient/medicines" element={<MyMedicinesPage />} />
      <Route path="/add-medicine" element={<AddMedicinePage />} />
      <Route path="/patient/add-medicine" element={<AddMedicinePage />} />
      <Route path="/schedule" element={<MedicineSchedulePage />} />
      <Route path="/patient/schedule" element={<MedicineSchedulePage />} />
      <Route path="/prescriptions" element={<PrescriptionsPage />} />
      <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
      <Route path="/adherence" element={<AdherencePage />} />
      <Route path="/patient/adherence" element={<AdherencePage />} />
      <Route path="/refills" element={<RefillPredictionPage />} />
      <Route path="/patient/refills" element={<RefillPredictionPage />} />
      <Route path="/categories" element={<DiseaseCategoriesPage />} />
      <Route path="/patient/categories" element={<DiseaseCategoriesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/history" element={<MedicationHistoryPage />} />

      {/* 3. Caregiver Portal Routes (Direct URL Access) */}
      <Route path="/caregiver" element={<CaregiverDashboard />} />
      <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
      <Route path="/caregiver/patients" element={<CaregiverPatientDetail />} />
      <Route path="/caregiver/patient/:id" element={<CaregiverPatientDetail />} />

      {/* 4. Admin Portal Routes (Direct URL Access) */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/settings" element={<NotificationSettingsPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
