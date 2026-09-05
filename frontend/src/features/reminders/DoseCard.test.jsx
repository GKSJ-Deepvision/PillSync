import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticatedState, renderWithProviders } from '../../../tests/utils.jsx';
import DoseCard from './DoseCard.jsx';

vi.mock('../../api/reminders.js', () => {
  const remindersApi = {
    take: vi.fn(),
    miss: vi.fn(),
    skip: vi.fn(),
    snooze: vi.fn(),
  };
  return { default: remindersApi, remindersApi };
});

const { default: remindersApi } = await import('../../api/reminders.js');

const dose = (overrides = {}) => ({
  id: 'dose-1',
  medicine_name: 'Metformin',
  medicine_strength: '500 mg/1',
  instructions: 'After food',
  slot: 'MORNING',
  slot_display: 'Morning',
  status: 'PENDING',
  status_display: 'Due',
  quantity_expected: '2.00',
  scheduled_for: '2026-09-05T08:00:00Z',
  effective_time: '2026-09-05T08:00:00Z',
  is_overdue: false,
  can_snooze: true,
  snooze_count: 0,
  ...overrides,
});

describe('DoseCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows what to take and when', () => {
    renderWithProviders(<DoseCard dose={dose()} />, { preloadedState: authenticatedState() });

    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('500 mg/1')).toBeInTheDocument();
    expect(screen.getByText(/after food/i)).toBeInTheDocument();
  });

  it('offers the three actions the specification names, plus skip', () => {
    renderWithProviders(<DoseCard dose={dose()} />, { preloadedState: authenticatedState() });

    expect(screen.getByRole('button', { name: /taken/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snooze/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /missed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('records a dose as taken and tells the parent to refresh', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    remindersApi.take.mockResolvedValue({ ...dose(), status: 'TAKEN' });

    renderWithProviders(<DoseCard dose={dose()} onChanged={onChanged} />, {
      preloadedState: authenticatedState(),
    });
    await user.click(screen.getByRole('button', { name: /taken/i }));

    await waitFor(() => expect(remindersApi.take).toHaveBeenCalledWith('dose-1'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('surfaces the server message when an action is rejected', async () => {
    const user = userEvent.setup();
    remindersApi.take.mockRejectedValue({
      code: 'validation_error',
      message: 'This dose is already recorded as taken.',
      details: {},
      status: 400,
    });

    renderWithProviders(<DoseCard dose={dose()} />, { preloadedState: authenticatedState() });
    await user.click(screen.getByRole('button', { name: /taken/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('already recorded as taken');
  });

  it('disables snooze once the cap is reached', () => {
    renderWithProviders(<DoseCard dose={dose({ can_snooze: false, snooze_count: 3 })} />, {
      preloadedState: authenticatedState(),
    });

    expect(screen.getByRole('button', { name: /snooze/i })).toBeDisabled();
    expect(screen.getByText(/snoozed 3/i)).toBeInTheDocument();
  });

  it('hides the actions once the dose is resolved', () => {
    renderWithProviders(<DoseCard dose={dose({ status: 'TAKEN', status_display: 'Taken' })} />, {
      preloadedState: authenticatedState(),
    });

    expect(screen.queryByRole('button', { name: /taken/i })).not.toBeInTheDocument();
    expect(screen.getByText('Taken')).toBeInTheDocument();
  });

  it('marks an overdue dose so it stands out', () => {
    renderWithProviders(<DoseCard dose={dose({ is_overdue: true })} />, {
      preloadedState: authenticatedState(),
    });
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows no actions to a caregiver with read-only access', () => {
    renderWithProviders(<DoseCard dose={dose()} readOnly />, {
      preloadedState: authenticatedState({ role: 'CAREGIVER' }),
    });
    expect(screen.queryByRole('button', { name: /taken/i })).not.toBeInTheDocument();
  });
});
