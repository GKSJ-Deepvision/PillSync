import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import './ProtectedRoute.css';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-slate-600 text-xs font-semibold mt-4">
            Validating clinical credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function RoleBasedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-slate-600 text-xs font-semibold mt-4">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = (user?.role || '').toLowerCase();
  const currentEmail = (user?.email || '').trim().toLowerCase();

  let isAllowed =
    allowedRoles.length === 0 || allowedRoles.some((r) => r.toLowerCase() === currentRole);

  // Strict Admin Isolation: Only designated admin email can access admin-only routes
  const isOnlyAdminAllowed =
    allowedRoles.length > 0 && allowedRoles.every((r) => r.toLowerCase() === 'admin');

  if (isOnlyAdminAllowed && currentEmail !== 'syedmuhammedsr@gmail.com') {
    isAllowed = false;
  }

  // Also prevent any non-admin email from masquerading as admin
  if (currentRole === 'admin' && currentEmail !== 'syedmuhammedsr@gmail.com') {
    isAllowed = false;
  }

  if (!isAllowed) {
    return (
      <div className="access-denied-wrapper">
        <div className="access-denied-card">
          <div className="access-denied-icon-box">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
          </div>

          <span className="access-denied-code">Error 403 · Access Restricted</span>
          <h2 className="access-denied-title">Clinical Role Authorization Required</h2>
          <p className="access-denied-message">
            This portal view is strictly restricted to designated administrative personnel.
          </p>

          <div className="access-denied-roles-box">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-semibold">Your Current Role:</span>
              <span className="font-bold text-rose-600 uppercase tracking-wider">
                {user?.role || 'Guest'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Allowed Role(s):</span>
              <span className="font-bold text-indigo-700 capitalize">
                {allowedRoles.join(' / ')}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export function PublicRoute({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-slate-600 text-xs font-semibold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
