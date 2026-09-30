import { useCallback } from 'react';

import refillsApi from '../api/refills.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import RefillList from '../features/refills/RefillList.jsx';
import { needsAttention } from '../features/refills/status.js';
import { useApi } from '../hooks/useApi.js';

function Accuracy({ accuracy }) {
  if (!accuracy) return null;
  if (accuracy.medicines_scored === 0) {
    return (
      <p className="text-sm text-slate-500">
        {accuracy.note || 'Forecast accuracy appears once there is enough dose history.'}
      </p>
    );
  }
  return (
    <p className="text-sm text-slate-600">
      Over the last few weeks, the forecast of how much you would use in a week was within{' '}
      {accuracy.tolerance_percent}% of what you actually used{' '}
      <strong>{accuracy.within_tolerance_percent}%</strong> of the time (average error{' '}
      {accuracy.mean_absolute_percentage_error}%, {accuracy.samples} checks across{' '}
      {accuracy.medicines_scored} medicine{accuracy.medicines_scored === 1 ? '' : 's'}).
    </p>
  );
}

export default function RefillsPage() {
  const fetchList = useCallback(() => refillsApi.list(), []);
  const fetchAccuracy = useCallback(() => refillsApi.accuracy(), []);
  const list = useApi(fetchList);
  const accuracy = useApi(fetchAccuracy);

  if (list.loading) return <Spinner label="Working out your refills" className="p-6" />;

  const predictions = list.data ?? [];
  const attention = predictions.filter((p) => needsAttention(p.status)).length;

  function changed() {
    list.reload();
    accuracy.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Refills</h1>
        <p className="mt-1 text-sm text-slate-600">
          PillSync works out when each medicine will run out from what you actually take, and tells
          you a few days ahead. Open one to see the projection.
        </p>
      </div>

      {list.error && <Alert tone="error">{list.error.message}</Alert>}

      {attention > 0 && (
        <Alert tone="warning" title="Needs attention">
          {attention} medicine{attention === 1 ? ' needs' : 's need'} a refill soon.
        </Alert>
      )}

      <RefillList predictions={predictions} onChanged={changed} />

      <Card title="How reliable is this?">
        <Accuracy accuracy={accuracy.data} />
        <p className="mt-2 text-xs text-slate-500">
          Dates are estimates. They assume you keep taking your medicine at the pace of the last two
          weeks, and they cannot know about tablets you have lost or been given.
        </p>
      </Card>
    </div>
  );
}
