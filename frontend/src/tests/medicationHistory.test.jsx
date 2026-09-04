import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MedicationHistory from '../pages/patient/MedicationHistory';
import RoleRoute from '../routes/RoleRoute';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/patientService', () => ({
  patientService: {
    fetchMedicationHistory: vi.fn(),
  },
}));

const patientUser = {
  email: 'patient@pillsync.com',
  role: 'patient',
};

const historyRecords = [
  {
    id: 'hist_1',
    patientId: 'pat_1',
    medicationName: 'Metformin',
    dosage: '500mg',
    date: '2026-08-31',
    time: '08:00 AM',
    status: 'Taken',
    notes: 'Taken with breakfast.',
  },
  {
    id: 'hist_2',
    patientId: 'pat_1',
    medicationName: 'Metformin',
    dosage: '500mg',
    date: '2026-08-30',
    time: '08:00 PM',
    status: 'Missed',
    notes: 'Evening dose was not recorded.',
  },
  {
    id: 'hist_3',
    patientId: 'pat_1',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    date: '2026-08-31',
    time: '08:00 AM',
    status: 'Skipped',
    notes: 'Skipped due to a late dinner.',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: patientUser });
  patientService.fetchMedicationHistory.mockResolvedValue(historyRecords);
});

describe('MedicationHistory', () => {
  it('renders the medication history page and records', async () => {
    render(<MemoryRouter><MedicationHistory /></MemoryRouter>);

    expect(screen.getByTestId('medication-history-page')).toBeInTheDocument();
    expect(screen.getByText('Medication History')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('medication-history-record')).toHaveLength(3));
    expect(screen.getAllByText('Metformin')).toHaveLength(2);
    const records = screen.getAllByTestId('medication-history-record');
    expect(within(records[0]).getByText('Taken')).toBeInTheDocument();
    expect(within(records[1]).getByText('Missed')).toBeInTheDocument();
    expect(within(records[2]).getByText('Skipped')).toBeInTheDocument();
  });

  it('filters records by medication name', async () => {
    render(<MemoryRouter><MedicationHistory /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByTestId('medication-history-record')).toHaveLength(3));

    fireEvent.change(screen.getByLabelText('Search medication'), { target: { value: 'Lisinopril' } });

    expect(screen.getAllByTestId('medication-history-record')).toHaveLength(1);
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
  });

  it('combines medication search and status filtering', async () => {
    render(<MemoryRouter><MedicationHistory /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByTestId('medication-history-record')).toHaveLength(3));

    fireEvent.change(screen.getByLabelText('Search medication'), { target: { value: 'Metformin' } });
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'Missed' } });

    expect(screen.getAllByTestId('medication-history-record')).toHaveLength(1);
    expect(within(screen.getByTestId('medication-history-record')).getByText('Missed')).toBeInTheDocument();
  });

  it('shows a message when filters have no matching records', async () => {
    render(<MemoryRouter><MedicationHistory /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByTestId('medication-history-record')).toHaveLength(3));

    fireEvent.change(screen.getByLabelText('Search medication'), { target: { value: 'Aspirin' } });

    expect(screen.getByText('No matching medication records found.')).toBeInTheDocument();
  });

  it('shows the empty history state when the patient has no records', async () => {
    patientService.fetchMedicationHistory.mockResolvedValueOnce([]);
    render(<MemoryRouter><MedicationHistory /></MemoryRouter>);

    expect(await screen.findByText('No medication history found.')).toBeInTheDocument();
  });

  it('keeps the medication history route patient-only', async () => {
    useAuth.mockReturnValue({ user: { email: 'caregiver@pillsync.com', role: 'caregiver' }, isAuthenticated: true, loading: false });
    render(
      <MemoryRouter initialEntries={['/medication-history']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['patient']} />}>
            <Route path="/medication-history" element={<MedicationHistory />} />
          </Route>
          <Route path="/unauthorized" element={<div>Access denied</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByTestId('medication-history-page')).not.toBeInTheDocument();
  });
});
