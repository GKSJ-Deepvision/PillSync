import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import MedicationsPage from '../pages/MedicationsPage';
import OcrUploadPage from '../pages/OcrUploadPage';
import RemindersPage from '../pages/RemindersPage';
import RefillsPage from '../pages/RefillsPage';
import CaregiverPage from '../pages/CaregiverPage';
import AnalyticsPage from '../pages/AnalyticsPage';

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
        <Sidebar mobileOpen={mobileOpen} closeMobileSidebar={() => setMobileOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/ocr-upload" element={<OcrUploadPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/refills" element={<RefillsPage />} />
            <Route path="/caregiver" element={<CaregiverPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
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
