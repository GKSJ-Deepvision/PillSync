import { useCallback, useState } from 'react';

import adherenceApi from '../api/adherence.js';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import AdherenceView from '../features/adherence/AdherenceView.jsx';
import ReportCard from '../features/adherence/ReportCard.jsx';
import { useApi } from '../hooks/useApi.js';

const RANGES = [7, 30, 90];

export default function AdherencePage() {
  const [days, setDays] = useState(30);
  const fetchSummary = useCallback(() => adherenceApi.summary({ days }), [days]);
  const summary = useApi(fetchSummary);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Adherence</h1>
          <p className="mt-1 text-sm text-slate-600">
            How consistently doses are being taken. Doses you skipped on purpose are not counted
            against you.
          </p>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-1">
          {RANGES.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={days === range ? 'primary' : 'secondary'}
              aria-pressed={days === range}
              onClick={() => setDays(range)}
            >
              {range} days
            </Button>
          ))}
        </div>
      </div>

      {summary.error && <Alert tone="error">{summary.error.message}</Alert>}
      {summary.loading && !summary.data && <Spinner label="Working out your adherence" />}
      {summary.data && <AdherenceView summary={summary.data} days={days} />}

      <ReportCard />
    </div>
  );
}
