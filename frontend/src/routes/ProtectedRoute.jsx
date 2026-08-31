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
          <p className="text-slate-600 text-xs font-semibold mt-4">Validating clinical credentials...</p>
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
  const { user, loading, isAuthenticated, switchRole } = useAuth();

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

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="access-denied-wrapper">
        <div className="access-denied-card">
          <div className="access-denied-icon-box">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
          </div>

          <span className="access-denied-code">Error 403 · Access Restricted</span>
          <h2 className="access-denied-title">Clinical Role Authorization Required</h2>
          <p className="access-denied-message">
            This portal view is strictly restricted to clinical roles with designated HIPAA privileges.
          </p>

          <div className="access-denied-roles-box">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-semibold">Your Current Role:</span>
              <span className="font-bold text-rose-600 uppercase tracking-wider">{user?.role || 'Guest'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Allowed Role(s):</span>
              <span className="font-bold text-indigo-700 capitalize">{allowedRoles.join(' / ')}</span>
            </div>
          </div>

          {/* Quick Demo Switcher if user wants to test allowed role */}
          {allowedRoles.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] text-slate-400 mb-2">Want to test as an authorized persona?</p>
              <div className="flex justify-center gap-2">
                {allowedRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => switchRole?.(role)}
                    className="rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-bold capitalize transition cursor-pointer border border-indigo-200"
                  >
                    Switch to {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
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
  const { isAuthenticated, loading } = useAuth();

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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
