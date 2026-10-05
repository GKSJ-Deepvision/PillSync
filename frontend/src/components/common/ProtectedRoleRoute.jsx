import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ProtectedRoleRoute
 * Wraps routes and checks if the logged-in user's role is permitted.
 * If unauthorized, safely redirects the user to their role's default landing page.
 */
export default function ProtectedRoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, viewMode } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed =
    user?.role === "admin" ||
    (allowedRoles && allowedRoles.includes(user?.role)) ||
    (viewMode && allowedRoles && allowedRoles.includes(viewMode));

  if (!isAllowed) {
    // Redirect unauthorized access to default landing page per role
    const defaultPath =
      user?.role === "caregiver"
        ? "/caregiver"
        : user?.role === "admin"
          ? "/analytics"
          : "/";
    return <Navigate to={defaultPath} replace />;
  }

  return children;
}
