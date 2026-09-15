import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock user data for each role
const patientUser = {
  id: 'usr_1', name: 'John Doe', email: 'patient@pillsync.com',
  phone: '+1 (555) 123-4567', role: 'patient', dob: '1985-06-15',
  address: '123 Health Ave', status: 'Active',
  avatar: 'https://example.com/avatar.jpg',
};
const caregiverUser = {
  id: 'usr_2', name: 'Sarah Smith', email: 'caregiver@pillsync.com',
  phone: '+1 (555) 987-6543', role: 'caregiver', status: 'Active',
  avatar: 'https://example.com/avatar2.jpg',
};
const adminUser = {
  id: 'usr_3', name: 'Admin User', email: 'admin@pillsync.com',
  phone: '+1 (555) 555-5555', role: 'admin', status: 'Active',
  avatar: 'https://example.com/avatar3.jpg',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => <>{children}</>,
}));

import { useAuth } from '../context/AuthContext';
import PatientDashboard from '../pages/patient/PatientDashboard';
import CaregiverDashboard from '../pages/caregiver/CaregiverDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Unauthorized from '../pages/auth/Unauthorized';

describe('Dashboard Pages', () => {
  it('renders PatientDashboard with correct welcome message', () => {
    useAuth.mockReturnValue({
      user: patientUser, isAuthenticated: true, loading: false,
      logout: vi.fn(), updateUserProfile: vi.fn(),
    });
    render(<MemoryRouter><PatientDashboard /></MemoryRouter>);
    expect(screen.getByText(/Welcome, John Doe/i)).toBeInTheDocument();
    expect(screen.getByTestId).toBeDefined();
  });

  it('renders CaregiverDashboard with correct role context', () => {
    useAuth.mockReturnValue({
      user: caregiverUser, isAuthenticated: true, loading: false,
      logout: vi.fn(),
    });
    render(<MemoryRouter><CaregiverDashboard /></MemoryRouter>);
    expect(screen.getByTestId('caregiver-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Sarah Smith/i)).toBeInTheDocument();
  });

  it('renders AdminDashboard with correct role context', () => {
    useAuth.mockReturnValue({
      user: adminUser, isAuthenticated: true, loading: false,
      logout: vi.fn(),
    });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Admin Console/i)).toBeInTheDocument();
  });

  it('renders Unauthorized page with redirect button', () => {
    render(<MemoryRouter><Unauthorized /></MemoryRouter>);
    expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Dashboard/i })).toBeInTheDocument();
  });
});
