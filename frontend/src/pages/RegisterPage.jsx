import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import RegisterForm from '../features/auth/RegisterForm.jsx';
import { selectIsAuthenticated } from '../store/authSlice.js';
import AuthLayout from './AuthLayout.jsx';

export default function RegisterPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Create your PillSync account"
      subtitle="Track medicines, never miss a dose, and know when to refill."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
