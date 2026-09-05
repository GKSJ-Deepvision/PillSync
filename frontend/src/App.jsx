import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setUnauthenticatedHandler } from './api/client.js';
import AppRoutes from './routes/AppRoutes.jsx';
import { restoreSession, sessionExpired } from './store/authSlice.js';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // When a refresh fails there is no way back to a valid session, so the API
    // layer tells the store to drop it and the router sends the user to /login.
    setUnauthenticatedHandler(() => dispatch(sessionExpired()));
    dispatch(restoreSession());
  }, [dispatch]);

  return <AppRoutes />;
}
