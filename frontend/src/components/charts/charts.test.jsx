import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HBars from './HBars.jsx';
import LineChart from './LineChart.jsx';
import RingGauge, { toneFor } from './RingGauge.jsx';
import StackedBars from './StackedBars.jsx';

const days = [
  { date: '2026-03-01', taken: 3, missed: 1 },
  { date: '2026-03-02', taken: 4, missed: 0 },
  { date: '2026-03-03', taken: 2, missed: 2 },
];

describe('StackedBars', () => {
  it('describes the whole series for a screen reader', () => {
    render(<StackedBars data={days} />);
    expect(
      screen.getByRole('img', { name: /9 taken and 3 missed over 3 days/i })
    ).toBeInTheDocument();
  });

  it('draws two rects per day and gives each day exact figures on hover', () => {
    const { container } = render(<StackedBars data={days} />);
    expect(container.querySelectorAll('rect').length).toBe(6);
    expect(container.querySelectorAll('title').length).toBe(3);
    expect(container.textContent).toContain('3 taken, 1 missed');
  });

  it('says so instead of drawing an empty axis', () => {
    render(<StackedBars data={[{ date: '2026-03-01', taken: 0, missed: 0 }]} />);
    expect(screen.getByText(/no doses recorded/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('copes with no data at all', () => {
    render(<StackedBars data={[]} />);
    expect(screen.getByText(/no doses recorded/i)).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  const points = [
    { date: '2026-03-01', remaining: 10 },
    { date: '2026-03-02', remaining: 6 },
    { date: '2026-03-03', remaining: 2 },
    { date: '2026-03-04', remaining: 0 },
  ];

  it('announces when stock runs out', () => {
    render(<LineChart points={points} />);
    expect(screen.getByRole('img', { name: /10 now, running out on/i })).toBeInTheDocument();
  });

  it('draws the markers it is given, and skips ones outside the range', () => {
    render(
      <LineChart
        points={points}
        markers={[
          { date: '2026-03-04', label: 'Runs out', tone: 'danger' },
          { date: '2027-01-01', label: 'Off the chart', tone: 'brand' },
        ]}
      />
    );
    expect(screen.getByText('Runs out')).toBeInTheDocument();
    expect(screen.queryByText('Off the chart')).not.toBeInTheDocument();
  });

  it('refuses to draw from a single point', () => {
    render(<LineChart points={[points[0]]} />);
    expect(screen.getByText(/not enough information/i)).toBeInTheDocument();
  });
});

describe('RingGauge', () => {
  it('shows the value and labels it', () => {
    render(<RingGauge value={82.4} label="This week" />);
    expect(screen.getByRole('img', { name: 'This week: 82 percent' })).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('shows "no data" rather than 0% when there is nothing yet', () => {
    render(<RingGauge value={null} label="This week" />);
    expect(screen.getByRole('img', { name: 'This week: no data yet' })).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('clamps out-of-range values', () => {
    render(<RingGauge value={140} label="x" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('colours by band', () => {
    expect(toneFor(90)).toContain('emerald');
    expect(toneFor(75)).toContain('amber');
    expect(toneFor(40)).toContain('rose');
    expect(toneFor(null)).toContain('slate');
  });
});

describe('HBars', () => {
  it('renders a bar per row with its value', () => {
    render(
      <HBars
        rows={[
          { label: 'Morning', value: 12.5 },
          { label: 'Night', value: 40 },
        ]}
      />
    );
    expect(screen.getByRole('img', { name: 'Night: 40%' })).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('shows "no data" for a missing value instead of an empty bar', () => {
    render(<HBars rows={[{ label: 'Sunday', value: null }]} />);
    expect(screen.getAllByText(/no data/i).length).toBeGreaterThan(0);
  });

  it('handles an empty list', () => {
    render(<HBars rows={[]} />);
    expect(screen.getByText(/nothing to compare/i)).toBeInTheDocument();
  });
});
