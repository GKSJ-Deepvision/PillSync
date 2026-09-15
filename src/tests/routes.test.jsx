import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../routes/ProtectedRoute';
import RoleRoute from '../routes/RoleRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Loading', () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

import { useAuth } from '../context/AuthContext';

const MockPage = ({ label }) => <div data-testid="mock-page">{label}</div>;

describe('Route Protection', () => {
  it('redirects unauthenticated user to /login from ProtectedRoute', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false, user: null });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MockPage label="Dashboard" />} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-page')).not.toBeInTheDocument();
  });

  it('renders protected page for authenticated user', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true, loading: false,
      user: { role: 'patient', name: 'John' },
    });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MockPage label="Dashboard" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-page')).toBeInTheDocument();
  });

  it('redirects patient role from admin-only route to /unauthorized', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true, loading: false,
      user: { role: 'patient', name: 'John' },
    });
    render(
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<MockPage label="User Management" />} />
          </Route>
          <Route path="/unauthorized" element={<div data-testid="unauth">Unauthorized</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('unauth')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-page')).not.toBeInTheDocument();
  });

  it('allows admin role on admin-only route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true, loading: false,
      user: { role: 'admin', name: 'Admin' },
    });
    render(
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<MockPage label="User Management" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-page')).toBeInTheDocument();
  });
});
