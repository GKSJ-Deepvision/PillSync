import { useCallback, useState } from 'react';

import remindersApi from '../api/reminders.js';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import MedicationHistory from '../features/reminders/MedicationHistory.jsx';
import { useApi } from '../hooks/useApi.js';

const RANGES = [
  [7, 'Last 7 days'],
  [14, 'Last 14 days'],
  [30, 'Last 30 days'],
  [90, 'Last 90 days'],
];

export default function HistoryPage() {
  const [days, setDays] = useState(14);
  const fetchHistory = useCallback(() => remindersApi.history({ days }), [days]);
  const history = useApi(fetchHistory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Medication history</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every scheduled dose and what happened to it. Deliberately skipped doses are left out of
          the adherence figure.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={days === value ? 'primary' : 'secondary'}
            onClick={() => setDays(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {history.error && <Alert tone="error">{history.error.message}</Alert>}

      {history.loading ? (
        <Spinner label="Loading history" className="p-6" />
      ) : (
        <MedicationHistory data={history.data} />
      )}
    </div>
  );
}
