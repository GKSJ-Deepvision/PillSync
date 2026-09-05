import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { anonymousState, authenticatedState, renderWithProviders } from '../../tests/utils.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function Secret() {
  return <p>Medication schedule</p>;
}

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<p>Sign in page</p>} />
      <Route path="/forbidden" element={<p>Not allowed</p>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Secret />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <p>Admin console</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to the login page', () => {
    renderWithProviders(routes(), { preloadedState: anonymousState(), route: '/' });
    expect(screen.getByText('Sign in page')).toBeInTheDocument();
    expect(screen.queryByText('Medication schedule')).not.toBeInTheDocument();
  });

  it('renders the page for a signed-in user', () => {
    renderWithProviders(routes(), { preloadedState: authenticatedState(), route: '/' });
    expect(screen.getByText('Medication schedule')).toBeInTheDocument();
  });

  it('waits instead of redirecting while the session is being restored', () => {
    renderWithProviders(routes(), {
      preloadedState: { auth: { status: 'restoring', user: null, error: null } },
      route: '/',
    });

    // Redirecting here would sign a returning user out on every page reload.
    expect(screen.getByRole('status')).toHaveTextContent(/restoring your session/i);
    expect(screen.queryByText('Sign in page')).not.toBeInTheDocument();
  });

  it('blocks a patient from an admin-only route', () => {
    renderWithProviders(routes(), {
      preloadedState: authenticatedState({ role: 'PATIENT' }),
      route: '/admin',
    });
    expect(screen.getByText('Not allowed')).toBeInTheDocument();
  });

  it('lets an admin through the admin-only route', () => {
    renderWithProviders(routes(), {
      preloadedState: authenticatedState({ role: 'ADMIN' }),
      route: '/admin',
    });
    expect(screen.getByText('Admin console')).toBeInTheDocument();
  });
});
