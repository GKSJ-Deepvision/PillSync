import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AdherenceView, { medicineRows, slotRows, weekdayRows } from './AdherenceView.jsx';

const summary = (overrides = {}) => ({
  resolved: 20,
  taken: 16,
  missed: 4,
  skipped: 1,
  adherence_rate: 80,
  on_time_rate: 90,
  consistency: 70,
  streaks: { current: 3, longest: 9 },
  trend: { direction: 'IMPROVING', change: 12.5 },
  daily: [
    { date: '2026-03-01', taken: 3, missed: 1 },
    { date: '2026-03-02', taken: 4, missed: 0 },
  ],
  missed_analysis: {
    insights: ['Most misses happen at night: 4 of 9 doses (44%) were missed.'],
    by_slot: {
      MORNING: { taken: 9, missed: 0, resolved: 9, missed_rate: 0 },
      NIGHT: { taken: 5, missed: 4, resolved: 9, missed_rate: 44.4 },
    },
    by_weekday: {
      Monday: { taken: 2, missed: 1, resolved: 3, missed_rate: 33.3 },
      Tuesday: { taken: 0, missed: 0, resolved: 0, missed_rate: null },
    },
    by_medicine: {
      Statin: { taken: 5, missed: 4, resolved: 9, missed_rate: 44.4 },
      Metformin: { taken: 11, missed: 0, resolved: 11, missed_rate: 0 },
    },
  },
  ...overrides,
});

describe('AdherenceView', () => {
  it('shows the headline numbers', () => {
    render(<AdherenceView summary={summary()} days={30} />);
    expect(screen.getByRole('img', { name: 'Adherence: 80 percent' })).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('Best: 9')).toBeInTheDocument();
    expect(screen.getByText('Improving')).toBeInTheDocument();
    expect(screen.getByText(/\+12.5 points/)).toBeInTheDocument();
  });

  it('surfaces the pattern in words, not just bars', () => {
    render(<AdherenceView summary={summary()} days={30} />);
    expect(screen.getByText(/most misses happen at night/i)).toBeInTheDocument();
  });

  it('asks for history rather than showing 0% when there is none', () => {
    render(<AdherenceView summary={summary({ resolved: 0 })} days={30} />);
    expect(screen.getByText(/no history yet/i)).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('does not invent a trend', () => {
    render(
      <AdherenceView
        summary={summary({ trend: { direction: 'UNKNOWN', change: null } })}
        days={7}
      />
    );
    expect(screen.getByText(/not enough data to show a trend/i)).toBeInTheDocument();
  });
});

describe('breakdown rows', () => {
  it('orders times of day naturally, not alphabetically', () => {
    const rows = slotRows({
      NIGHT: { missed: 1, resolved: 2, missed_rate: 50 },
      MORNING: { missed: 0, resolved: 2, missed_rate: 0 },
    });
    expect(rows.map((r) => r.label)).toEqual(['Morning', 'Night']);
  });

  it('marks a day with no doses as no data rather than 0%', () => {
    const rows = weekdayRows({ Tuesday: { missed: 0, resolved: 0, missed_rate: null } });
    expect(rows[0].value).toBeNull();
  });

  it('lists only medicines that were actually missed', () => {
    const rows = medicineRows({
      Statin: { missed: 4, resolved: 9, missed_rate: 44.4 },
      Metformin: { missed: 0, resolved: 11, missed_rate: 0 },
    });
    expect(rows.map((r) => r.label)).toEqual(['Statin']);
  });
});
