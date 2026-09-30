import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AdminAnalytics, { PerformanceCard } from './AdminAnalytics.jsx';
import CaregiverMonitor, { rateClass } from './CaregiverMonitor.jsx';

const row = (overrides = {}) => ({
  patient: 'p1',
  name: 'Ravi Kumar',
  adherence_week: 62.4,
  streak: 0,
  trend: 'DECLINING',
  today: { total: 2, taken: 1, missed: 1, next: null },
  refills: [{ prediction: 'x', medicine: 'Glimepiride', status: 'CRITICAL' }],
  attention: { score: 6, reasons: ['Adherence is 62% this week', '1 dose missed today'] },
  ...overrides,
});

describe('CaregiverMonitor', () => {
  it('says why a patient needs attention, in words', () => {
    render(
      <CaregiverMonitor
        data={{ patients: [row()], totals: { patients: 1, needing_attention: 1 } }}
      />
    );
    expect(screen.getByText('Adherence is 62% this week')).toBeInTheDocument();
    expect(screen.getByText('1 dose missed today')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 need attention')).toBeInTheDocument();
    expect(screen.getByText(/glimepiride: almost out/i)).toBeInTheDocument();
  });

  it('is reassuring when nothing is wrong', () => {
    render(
      <CaregiverMonitor
        data={{
          patients: [
            row({
              name: 'Asha',
              adherence_week: 96,
              trend: 'STABLE',
              refills: [],
              attention: { score: 0, reasons: [] },
            }),
          ],
          totals: { patients: 1, needing_attention: 0 },
        }}
      />
    );
    expect(screen.getByText(/nothing needs attention/i)).toBeInTheDocument();
    expect(screen.getByText('All 1 are on track')).toBeInTheDocument();
  });

  it('shows a dash rather than 0% when there is no data', () => {
    render(
      <CaregiverMonitor
        data={{
          patients: [row({ adherence_week: null, attention: { score: 0, reasons: [] } })],
          totals: { patients: 1, needing_attention: 0 },
        }}
      />
    );
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('explains what to do when there are no patients', () => {
    render(
      <CaregiverMonitor data={{ patients: [], totals: { patients: 0, needing_attention: 0 } }} />
    );
    expect(screen.getByText(/no patients yet/i)).toBeInTheDocument();
  });

  it('colours adherence on the shared bands', () => {
    expect(rateClass(95)).toContain('emerald');
    expect(rateClass(50)).toContain('rose');
  });
});

const admin = () => ({
  users: { total: 12, patients: 8, caregivers: 3, admins: 1, new_last_30_days: 4 },
  engagement: { patient_profiles: 9, active_medicines: 30, patients_with_activity_7d: 6 },
  doses: { taken: 420, missed: 60, skipped: 5, adherence_rate: 87.5 },
  notifications: {
    delivery_rate: 96.2,
    by_status: {},
    by_channel: { PUSH: { sent: 90, failed: 2, delivery_rate: 97.8 } },
  },
  ocr: {
    total: 10,
    completed: 9,
    confirmed: 7,
    failed: 1,
    success_rate: 90,
    confirm_rate: 77.8,
    average_confidence: 0.812,
    average_ms: 2400,
  },
  refills: {
    counts: { OUT: 1, CRITICAL: 2, LOW: 3, OK: 20, COVERED: 0, UNKNOWN: 0 },
    needs_attention: 6,
  },
  refill_forecast_accuracy: {
    medicines_scored: 5,
    samples: 15,
    mean_absolute_percentage_error: 8.4,
    within_tolerance_percent: 86.7,
    tolerance_percent: 20,
    note: '',
  },
});

describe('AdminAnalytics', () => {
  it('shows the platform figures', () => {
    render(<AdminAnalytics data={admin()} />);
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('96.2%')).toBeInTheDocument();
    expect(screen.getByText('2.4 s')).toBeInTheDocument();
    expect(screen.getByText(/90 sent, 2 failed/)).toBeInTheDocument();
  });

  it('reports forecast accuracy with its sample size, not a bare number', () => {
    render(<AdminAnalytics data={admin()} />);
    expect(screen.getByText(/15 checks/)).toBeInTheDocument();
  });

  it('says accuracy is unavailable rather than inventing it', () => {
    const data = admin();
    data.refill_forecast_accuracy = {
      medicines_scored: 0,
      note: 'Needs 21+ days of dose history per medicine.',
    };
    render(<AdminAnalytics data={data} />);
    expect(screen.getByText(/needs 21\+ days/i)).toBeInTheDocument();
  });

  it('copes with a quiet platform', () => {
    const data = admin();
    data.ocr = {
      ...data.ocr,
      total: 0,
      success_rate: null,
      confirm_rate: null,
      average_confidence: null,
      average_ms: null,
    };
    data.notifications = { delivery_rate: null, by_status: {}, by_channel: {} };
    render(<AdminAnalytics data={data} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(2);
  });
});

describe('PerformanceCard', () => {
  it('lists percentiles and the slowest routes, and is honest about its limits', () => {
    render(
      <PerformanceCard
        data={{
          requests: 1200,
          p50_ms: 14.2,
          p95_ms: 61,
          p99_ms: 140.5,
          server_error_rate: 0,
          slowest_routes: [
            {
              route: 'GET api/v1/analytics/admin/',
              count: 3,
              p50_ms: 80,
              p95_ms: 120,
              max_ms: 130,
            },
          ],
        }}
      />
    );
    expect(screen.getByText('61 ms')).toBeInTheDocument();
    expect(screen.getByText('GET api/v1/analytics/admin/')).toBeInTheDocument();
    expect(screen.getByText(/per server process/i)).toBeInTheDocument();
  });
});
