import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboard from '../pages/patient/PatientDashboard';
import BackendUnavailable from '../components/BackendUnavailable';
import Unauthorized from '../pages/auth/Unauthorized';
import { medicationService } from '../services/medicationService';

vi.mock('../services/medicationService', () => ({
  medicationService: {
    listMedicines: vi.fn(),
    listReminders: vi.fn(),
    getAdherence: vi.fn(),
  },
}));

describe('Dashboard Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    medicationService.listMedicines.mockResolvedValue([]);
    medicationService.listReminders.mockResolvedValue([]);
    medicationService.getAdherence.mockResolvedValue({
      adherence_percentage: 0,
      taken: 0,
      total_scheduled: 0,
    });
  });

  it('renders PatientDashboard with a real-data welcome state', async () => {
    render(<MemoryRouter><PatientDashboard /></MemoryRouter>);
    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.queryByTestId('medicines-page')).not.toBeInTheDocument();
  });

  it('renders a truthful caregiver limitation state', () => {
    render(<MemoryRouter><BackendUnavailable title="Caregiver dashboard unavailable" description="The current Django API does not expose caregiver assignments." /></MemoryRouter>);
    expect(screen.getByText(/Caregiver dashboard unavailable/i)).toBeInTheDocument();
  });

  it('renders a truthful admin limitation state', () => {
    render(<MemoryRouter><BackendUnavailable title="Admin dashboard unavailable" description="The current Django API does not expose administrative resources." /></MemoryRouter>);
    expect(screen.getByText(/Admin dashboard unavailable/i)).toBeInTheDocument();
  });

  it('renders Unauthorized page with redirect button', () => {
    render(<MemoryRouter><Unauthorized /></MemoryRouter>);
    expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Dashboard/i })).toBeInTheDocument();
  });
});
