import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CaregiverDashboard from '../pages/caregiver/CaregiverDashboard';
import MyPatients from '../pages/caregiver/MyPatients';
import PatientDetails from '../pages/caregiver/PatientDetails';
import { caregiverService } from '../services/caregiverService';

vi.mock('../services/caregiverService', () => ({
  caregiverService: {
    listPatients: vi.fn(),
    getPatientDashboard: vi.fn(),
  },
}));

const patient = {
  id: 7,
  patient_id: 42,
  patient_username: 'assigned-patient',
  caregiver_id: 5,
  caregiver_username: 'caregiver',
};

const dashboard = {
  summary: {
    adherence_percentage: 80,
    active_medicines: 1,
    low_stock_medicines: 1,
  },
  active_medicines: [{
    id: 9,
    name: 'Vitamin D',
    dosage: '1 tablet',
    quantity: 2,
    is_low_stock: true,
    refill_prediction: { days_remaining: 2 },
  }],
};

describe('Caregiver patient monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    caregiverService.listPatients.mockResolvedValue([patient]);
    caregiverService.getPatientDashboard.mockResolvedValue(dashboard);
  });

  it('renders assigned patients from the relationship endpoint', async () => {
    render(<MemoryRouter><MyPatients /></MemoryRouter>);

    expect(await screen.findByText('assigned-patient')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View details/i })).toHaveAttribute('href', '/patients/42');
    expect(caregiverService.listPatients).toHaveBeenCalledOnce();
  });

  it('shows an empty state when no assignments exist', async () => {
    caregiverService.listPatients.mockResolvedValue([]);
    render(<MemoryRouter><MyPatients /></MemoryRouter>);

    expect(await screen.findByText('No patients assigned')).toBeInTheDocument();
  });

  it('shows a retryable error when the patient list cannot be loaded', async () => {
    caregiverService.listPatients.mockRejectedValue(new Error('Network Error'));
    render(<MemoryRouter><MyPatients /></MemoryRouter>);

    expect(await screen.findByText(/Unable to connect to PillSync/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('renders authorized patient adherence, medication, and refill data', async () => {
    render(
      <MemoryRouter initialEntries={['/patients/42']}>
        <Routes>
          <Route path="/patients/:id" element={<PatientDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Patient monitoring')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    expect(screen.getByText('2 days remaining')).toBeInTheDocument();
    expect(caregiverService.getPatientDashboard).toHaveBeenCalledWith('42');
  });

  it('does not display data after an assignment is revoked', async () => {
    caregiverService.getPatientDashboard.mockRejectedValue({
      response: { status: 404, data: { detail: 'Patient dashboard not found.' } },
    });
    render(
      <MemoryRouter initialEntries={['/patients/42']}>
        <Routes>
          <Route path="/patients/:id" element={<PatientDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Patient dashboard not found.')).toBeInTheDocument());
    expect(screen.queryByText('Vitamin D')).not.toBeInTheDocument();
  });

  it('renders the caregiver dashboard with assignment navigation', async () => {
    render(<MemoryRouter><CaregiverDashboard /></MemoryRouter>);

    expect(await screen.findByTestId('caregiver-dashboard-page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View all patients/i })).toHaveAttribute('href', '/patients');
  });
});
