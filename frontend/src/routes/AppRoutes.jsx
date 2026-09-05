import { Route, Routes } from 'react-router-dom';

import AppShell from '../components/layout/AppShell.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import CaregiversPage from '../pages/CaregiversPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import FamilyPage from '../pages/FamilyPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import ForbiddenPage from '../pages/ForbiddenPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MedicationsPage from '../pages/MedicationsPage.jsx';
import MedicinesPage from '../pages/MedicinesPage.jsx';
import MyPatientsPage from '../pages/MyPatientsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import TodayPage from '../pages/TodayPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route
          path="family"
          element={
            <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
              <FamilyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="caregivers"
          element={
            <ProtectedRoute roles={['PATIENT']}>
              <CaregiversPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients"
          element={
            <ProtectedRoute roles={['CAREGIVER']}>
              <MyPatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
