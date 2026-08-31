import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Gates which dashboard body renders per role. This is a UI convenience
 * only — the enforcement that actually matters happens server-side via
 * Postgres Row Level Security policies on profiles / caregiver_links.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
