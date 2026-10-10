import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout structures
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guard components
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import BackendUnavailable from '../components/BackendUnavailable';

// Authentication Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Unauthorized from '../pages/auth/Unauthorized';

// Patient Pages
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientProfile from '../pages/patient/PatientProfile';
import EditProfile from '../pages/patient/EditProfile';
import Settings from '../pages/patient/Settings';
import Medicines from '../pages/patient/Medicines';
import Schedule from '../pages/patient/Schedule';
import Adherence from '../pages/patient/Adherence';
import Notifications from '../pages/patient/Notifications';
import MedicationHistory from '../pages/patient/MedicationHistory';
import ClinicalTools from '../pages/patient/ClinicalTools';

// Caregiver Pages
import CaregiverProfile from '../pages/caregiver/CaregiverProfile';
import CaregiverDashboard from '../pages/caregiver/CaregiverDashboard';
import MyPatients from '../pages/caregiver/MyPatients';
import PatientDetails from '../pages/caregiver/PatientDetails';

// Admin Pages

// Helper component to resolve index route based on authenticated role
const DashboardRedirect = () => {
  const { user } = useAuth();
  const role = user?.role ? user.role.toLowerCase() : '';
  
  if (role === 'patient') return <PatientDashboard />;
  if (role === 'caregiver') return <CaregiverDashboard />;
  if (role === 'admin') return <BackendUnavailable title="Admin dashboard unavailable" description="The current Django API does not expose administrative user management, activity logs, or platform analytics." />;
  return <Navigate to="/login" replace />;
};

// Helper component to resolve profile views based on active role
const ProfileRedirect = () => {
  const { user } = useAuth();
  const role = user?.role ? user.role.toLowerCase() : '';
  
  if (role === 'caregiver') return <CaregiverProfile />;
  return <PatientProfile />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Forms Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Authenticated Dashboard Core */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/profile" element={<ProfileRedirect />} />
          <Route path="/settings" element={<Settings />} />

          {/* Patient Role-Protected Operations */}
          <Route element={<RoleRoute allowedRoles={['patient']} />}>
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/adherence" element={<Adherence />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/medication-history" element={<MedicationHistory />} />
            <Route path="/clinical-tools" element={<ClinicalTools />} />
            <Route path="/profile/edit" element={<EditProfile />} />
          </Route>

          {/* Caregiver Role-Protected Operations */}
          <Route element={<RoleRoute allowedRoles={['caregiver']} />}>
            <Route path="/patients" element={<MyPatients />} />
            <Route path="/patients/:id" element={<PatientDetails />} />
            <Route path="/alerts" element={<BackendUnavailable title="Caregiver alerts unavailable" description="No caregiver alert endpoint is registered in the current Django API." />} />
          </Route>

          {/* Admin Role-Protected Operations */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<BackendUnavailable title="User management unavailable" description="No administrative user-management endpoint is registered in the current Django API." />} />
            <Route path="/activity-log" element={<BackendUnavailable title="Activity log unavailable" description="No administrative activity-log endpoint is registered in the current Django API." />} />
          </Route>
        </Route>
      </Route>

      {/* Wildcard and Base URL Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
