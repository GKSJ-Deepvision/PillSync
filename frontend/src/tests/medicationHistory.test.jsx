import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MedicationHistory from '../pages/patient/MedicationHistory';
import { medicationService } from '../services/medicationService';

vi.mock('../services/medicationService', () => ({ medicationService: { listMedicines: vi.fn(), listHistory: vi.fn() } }));

describe('MedicationHistory', () => {
  beforeEach(() => { vi.clearAllMocks(); medicationService.listMedicines.mockResolvedValue([{ id: 1, name: 'Metformin' }]); medicationService.listHistory.mockResolvedValue([{ id: 2, medicine: 'Metformin', dose: '500mg', scheduled_at: '2026-08-31T08:00:00Z', status: 'taken', taken_at: '2026-08-31T08:01:00Z' }]); });
  it('renders records from the real medication service', async () => { render(<MemoryRouter><MedicationHistory /></MemoryRouter>); await waitFor(() => expect(screen.getByText('Metformin')).toBeInTheDocument()); expect(screen.getAllByText('Taken').length).toBeGreaterThan(1); });
  it('shows an empty state when the API returns no records', async () => { medicationService.listHistory.mockResolvedValue([]); render(<MemoryRouter><MedicationHistory /></MemoryRouter>); expect(await screen.findByText('No medication history found')).toBeInTheDocument(); });
});
