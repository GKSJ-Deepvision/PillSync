import { useCallback } from 'react';

import notificationsApi from '../api/notifications.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import NotificationSettings from '../features/notifications/NotificationSettings.jsx';
import { useApi } from '../hooks/useApi.js';

export default function NotificationsPage() {
  const fetchPreferences = useCallback(() => notificationsApi.getPreferences(), []);
  const fetchStats = useCallback(() => notificationsApi.deliveryStats(), []);

  const preferences = useApi(fetchPreferences);
  const stats = useApi(fetchStats);

  if (preferences.loading) return <Spinner label="Loading settings" className="p-6" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose how PillSync reaches you, and what it is allowed to interrupt you for.
        </p>
      </div>

      {preferences.error && <Alert tone="error">{preferences.error.message}</Alert>}

      {!stats.loading && stats.data?.total > 0 && (
        <Card title="Delivery" subtitle="Whether what we sent actually arrived">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ['Attempted', stats.data.total],
              ['Delivered', stats.data.sent],
              ['Failed', stats.data.failed],
              ['Success rate', `${stats.data.success_rate_percent}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {preferences.data && (
        <NotificationSettings key={preferences.data.id} preferences={preferences.data} />
      )}
    </div>
  );
}
