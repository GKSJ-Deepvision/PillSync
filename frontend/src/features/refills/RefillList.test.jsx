import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticatedState, renderWithProviders } from '../../../tests/utils.jsx';
import medicationsApi from '../../api/medications.js';
import refillsApi from '../../api/refills.js';
import RefillList from './RefillList.jsx';

vi.mock('../../api/medications.js', () => ({ default: { refill: vi.fn() } }));
vi.mock('../../api/refills.js', () => ({
  default: { projection: vi.fn(), adjustStock: vi.fn() },
}));

const prediction = (overrides = {}) => ({
  id: 'p1',
  medicine: 'm1',
  medicine_name: 'Metformin',
  patient: 'pt1',
  patient_name: 'Asha',
  status: 'LOW',
  message: 'Your Metformin is expected to finish in 4 days. Please arrange a refill.',
  remaining_stock: '8.00',
  scheduled_daily: '2.0000',
  average_daily: '2.0000',
  observed_weight: 0,
  resolved_doses: 0,
  days_remaining: '4.00',
  depletion_date: '2026-03-10',
  recommended_refill_date: '2026-03-05',
  quantity_per_refill: '60.00',
  confidence: 0.5,
  ...overrides,
});

const render = (ui) => renderWithProviders(ui, { preloadedState: authenticatedState() });

beforeEach(() => {
  vi.clearAllMocks();
  refillsApi.projection.mockResolvedValue({
    status: 'LOW',
    depletion_date: '2026-03-10',
    recommended_refill_date: '2026-03-05',
    points: [
      { date: '2026-03-06', remaining: 8 },
      { date: '2026-03-07', remaining: 6 },
      { date: '2026-03-08', remaining: 4 },
    ],
  });
});

describe('RefillList', () => {
  it('shows the forecast message and status', () => {
    render(<RefillList predictions={[prediction()]} />);
    expect(screen.getByText(/expected to finish in 4 days/i)).toBeInTheDocument();
    expect(screen.getByText('Running low')).toBeInTheDocument();
    expect(screen.getByText('4 days left')).toBeInTheDocument();
  });

  it('invites the patient to add a medicine when there is nothing to forecast', () => {
    render(<RefillList predictions={[]} />);
    expect(screen.getByText(/no refill forecasts yet/i)).toBeInTheDocument();
  });

  it('only names the patient when there is more than one', () => {
    const { rerender } = render(<RefillList predictions={[prediction()]} />);
    expect(screen.queryByText('Asha')).not.toBeInTheDocument();

    rerender(
      <RefillList
        predictions={[prediction(), prediction({ id: 'p2', patient: 'pt2', patient_name: 'Ravi' })]}
      />
    );
    expect(screen.getByText('Ravi')).toBeInTheDocument();
  });

  it('loads the projection only when a row is opened', async () => {
    render(<RefillList predictions={[prediction()]} />);
    expect(refillsApi.projection).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /metformin/i }));

    await waitFor(() => expect(refillsApi.projection).toHaveBeenCalledWith('p1'));
    expect(await screen.findByRole('img', { name: /metformin stock/i })).toBeInTheDocument();
    expect(screen.getByText(/based on the schedule only/i)).toBeInTheDocument();
  });

  it('records a collected refill and tells the page to reload', async () => {
    medicationsApi.refill.mockResolvedValue({});
    const onChanged = vi.fn();
    render(<RefillList predictions={[prediction()]} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: /metformin/i }));
    await userEvent.click(
      await screen.findByRole('button', { name: /collected a refill \(\+60\)/i })
    );

    await waitFor(() => expect(medicationsApi.refill).toHaveBeenCalledWith('m1'));
    expect(onChanged).toHaveBeenCalled();
  });

  it('sets a counted quantity', async () => {
    refillsApi.adjustStock.mockResolvedValue({});
    const onChanged = vi.fn();
    render(<RefillList predictions={[prediction()]} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: /metformin/i }));
    await userEvent.type(await screen.findByLabelText(/set the count/i), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() =>
      expect(refillsApi.adjustStock).toHaveBeenCalledWith('m1', '12', 'Counted by the patient')
    );
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows a failed refill instead of swallowing it', async () => {
    medicationsApi.refill.mockRejectedValue({ message: 'Enter a quantity, or set a pack size.' });
    render(<RefillList predictions={[prediction({ quantity_per_refill: null })]} />);

    await userEvent.click(screen.getByRole('button', { name: /metformin/i }));
    await userEvent.click(await screen.findByRole('button', { name: /collected a refill/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/pack size/i);
  });
});
