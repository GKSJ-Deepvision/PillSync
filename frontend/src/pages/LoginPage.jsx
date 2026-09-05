import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import LoginForm from '../features/auth/LoginForm.jsx';
import { selectIsAuthenticated } from '../store/authSlice.js';
import AuthLayout from './AuthLayout.jsx';

export default function LoginPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your medication schedule.">
      <LoginForm />
    </AuthLayout>
  );
}
