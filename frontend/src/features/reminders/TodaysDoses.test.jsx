import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { authenticatedState, renderWithProviders } from '../../../tests/utils.jsx';
import TodaysDoses from './TodaysDoses.jsx';

vi.mock('../../api/reminders.js', () => ({
  default: { take: vi.fn(), miss: vi.fn(), skip: vi.fn(), snooze: vi.fn() },
}));

const dose = (id, slot, overrides = {}) => ({
  id,
  medicine_name: `Medicine ${id}`,
  medicine_strength: '',
  instructions: '',
  slot,
  slot_display: slot[0] + slot.slice(1).toLowerCase(),
  status: 'PENDING',
  status_display: 'Due',
  quantity_expected: '1.00',
  scheduled_for: '2026-09-05T08:00:00Z',
  effective_time: '2026-09-05T08:00:00Z',
  is_overdue: false,
  can_snooze: true,
  snooze_count: 0,
  ...overrides,
});

const payload = (slots, summary = {}) => ({
  date: '2026-09-05',
  slots: { MORNING: [], AFTERNOON: [], EVENING: [], NIGHT: [], ...slots },
  summary: {
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0,
    pending: 0,
    adherence_percent: 0,
    ...summary,
  },
});

describe('TodaysDoses', () => {
  it('invites the patient to add a medicine when nothing is scheduled', () => {
    renderWithProviders(<TodaysDoses data={payload({})} />, {
      preloadedState: authenticatedState(),
    });
    expect(screen.getByText(/nothing scheduled today/i)).toBeInTheDocument();
  });

  it('renders only the parts of the day that have doses', () => {
    renderWithProviders(
      <TodaysDoses data={payload({ MORNING: [dose('a', 'MORNING')] }, { total: 1, pending: 1 })} />,
      { preloadedState: authenticatedState() }
    );

    expect(screen.getByRole('heading', { name: 'Morning' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Afternoon' })).not.toBeInTheDocument();
  });

  it('groups doses into their slots', () => {
    renderWithProviders(
      <TodaysDoses
        data={payload(
          { MORNING: [dose('a', 'MORNING')], NIGHT: [dose('b', 'NIGHT')] },
          { total: 2, pending: 2 }
        )}
      />,
      { preloadedState: authenticatedState() }
    );

    expect(screen.getByRole('heading', { name: 'Morning' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Night' })).toBeInTheDocument();
  });

  it('summarises how the day is going', () => {
    renderWithProviders(
      <TodaysDoses
        data={payload({ MORNING: [dose('a', 'MORNING')] }, { total: 4, taken: 3, pending: 1 })}
      />,
      { preloadedState: authenticatedState() }
    );
    expect(screen.getByText(/of 4 taken/i)).toBeInTheDocument();
    expect(screen.getByText(/1 still due/i)).toBeInTheDocument();
  });

  it('warns when doses were missed', () => {
    renderWithProviders(
      <TodaysDoses
        data={payload(
          { MORNING: [dose('a', 'MORNING', { status: 'MISSED', status_display: 'Missed' })] },
          { total: 2, taken: 1, missed: 1 }
        )}
      />,
      { preloadedState: authenticatedState() }
    );
    expect(screen.getByText(/missed doses today/i)).toBeInTheDocument();
  });
});
