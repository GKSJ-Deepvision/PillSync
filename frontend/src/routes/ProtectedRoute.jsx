import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DoseRing from "../components/common/DoseRing";

/**
 * Gates a route on an authenticated session and, optionally, an allowed
 * role list. The real enforcement for data access lives in Postgres RLS
 * (see docs/database/schema.sql) — this only controls what the UI shows,
 * so a curious user can't reach a screen that doesn't match their role.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-porcelain">
        <DoseRing size={72} ambient />
        <p className="font-mono text-xs uppercase tracking-wider text-ink-fog">Loading PillSync…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
