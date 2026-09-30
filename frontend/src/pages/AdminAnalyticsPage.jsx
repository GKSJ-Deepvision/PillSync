import { useCallback } from 'react';

import analyticsApi from '../api/analytics.js';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import AdminAnalytics, { PerformanceCard } from '../features/analytics/AdminAnalytics.jsx';
import { useApi } from '../hooks/useApi.js';

export default function AdminAnalyticsPage() {
  const fetchOverview = useCallback(() => analyticsApi.admin(), []);
  const fetchPerformance = useCallback(() => analyticsApi.performance(), []);
  const overview = useApi(fetchOverview);
  const performance = useApi(fetchPerformance);

  function refresh() {
    overview.reload();
    performance.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Platform analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Who uses PillSync, whether reminders arrive, and how well scanning and refill prediction
            are working.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {overview.error && <Alert tone="error">{overview.error.message}</Alert>}
      {overview.loading && !overview.data && <Spinner label="Loading analytics" />}
      {overview.data && <AdminAnalytics data={overview.data} />}
      {performance.data && <PerformanceCard data={performance.data} />}
    </div>
  );
}
