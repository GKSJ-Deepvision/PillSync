import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import Spinner from '../components/common/Spinner.jsx';
import { selectAuthStatus, selectRole } from '../store/authSlice.js';

/**
 * Gate a route on being signed in, and optionally on role.
 *
 * `restoring` gets its own branch: during a page reload we do not yet know
 * whether there is a session, and redirecting to /login in that moment would
 * bounce a signed-in user out of the app.
 *
 * This is a usability guard, not a security boundary - the API enforces the
 * same rules server-side, because anything in the browser can be bypassed.
 */
export default function ProtectedRoute({ roles, children }) {
  const status = useSelector(selectAuthStatus);
  const role = useSelector(selectRole);
  const location = useLocation();

  if (status === 'restoring' || status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Restoring your session" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
