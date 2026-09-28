import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock the AuthContext
const mockAuthValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUserProfile: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }) => <>{children}</>,
}));

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

describe('Authentication Pages', () => {
  it('renders Login page with email and password fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders Register page with role selection buttons', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByTestId('role-btn-patient')).toBeInTheDocument();
    expect(screen.getByTestId('role-btn-caregiver')).toBeInTheDocument();
    expect(screen.getByTestId('role-btn-admin')).toBeInTheDocument();
  });

  it('renders ForgotPassword page with email field', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it('renders Login page with Forgot Password link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('renders Login page with testing credentials panel', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText(/Testing Credentials/i)).toBeInTheDocument();
    expect(screen.getByText('patient@pillsync.com')).toBeInTheDocument();
    expect(screen.getByText('caregiver@pillsync.com')).toBeInTheDocument();
    expect(screen.getByText('admin@pillsync.com')).toBeInTheDocument();
  });
});
