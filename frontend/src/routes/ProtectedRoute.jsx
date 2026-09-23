import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

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

  return <AppLayout>{children}</AppLayout>;
}