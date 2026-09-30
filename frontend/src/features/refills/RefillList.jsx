import { useCallback, useState } from 'react';

import medicationsApi from '../../api/medications.js';
import refillsApi from '../../api/refills.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Input from '../../components/common/Input.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import LineChart from '../../components/charts/LineChart.jsx';
import { useApi, useMutation } from '../../hooks/useApi.js';
import { formatDate } from '../../utils/format.js';
import { confidenceLabel, daysLabel, statusInfo } from './status.js';

function Projection({ prediction }) {
  const fetchProjection = useCallback(() => refillsApi.projection(prediction.id), [prediction.id]);
  const projection = useApi(fetchProjection);

  if (projection.loading) return <Spinner label="Drawing the projection" className="py-6" />;
  if (projection.error) return <Alert tone="error">{projection.error.message}</Alert>;

  const { points, depletion_date: depletion, recommended_refill_date: refillOn } = projection.data;
  const markers = [];
  if (refillOn) markers.push({ date: refillOn, label: 'Refill by', tone: 'brand' });
  if (depletion) markers.push({ date: depletion, label: 'Runs out', tone: 'danger' });

  return (
    <LineChart points={points} markers={markers} label={`${prediction.medicine_name} stock`} />
  );
}

function Actions({ prediction, onChanged }) {
  const [count, setCount] = useState('');
  const refill = useMutation(useCallback((id) => medicationsApi.refill(id), []));
  const adjust = useMutation(
    useCallback(
      (id, quantity) => refillsApi.adjustStock(id, quantity, 'Counted by the patient'),
      []
    )
  );

  async function collected() {
    const result = await refill.submit(prediction.medicine);
    if (result.ok) onChanged?.();
  }

  async function saveCount(event) {
    event.preventDefault();
    const result = await adjust.submit(prediction.medicine, count);
    if (result.ok) {
      setCount('');
      onChanged?.();
    }
  }

  const error = refill.error || adjust.error;
  const packSize = prediction.quantity_per_refill;

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error.message}</Alert>}
      <div className="flex flex-wrap items-end gap-4">
        <Button onClick={collected} loading={refill.submitting} variant="primary" size="sm">
          {packSize ? `I collected a refill (+${Number(packSize)})` : 'I collected a refill'}
        </Button>

        <form onSubmit={saveCount} className="flex items-end gap-2">
          <Input
            label="Or set the count"
            type="number"
            min="0"
            step="any"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            hint="Counted the box? Enter what is left."
            className="w-40"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={adjust.submitting}
            disabled={count === ''}
          >
            Update
          </Button>
        </form>
      </div>
    </div>
  );
}

function Row({ prediction, showPatient, onChanged }) {
  const [open, setOpen] = useState(false);
  const info = statusInfo(prediction.status);
  const left = daysLabel(prediction.days_remaining);

  return (
    <li className="rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {prediction.medicine_name}
            {showPatient && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {prediction.patient_name}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">{prediction.message}</p>
        </div>
        <div className="flex items-center gap-3">
          {left && prediction.status !== 'COVERED' && (
            <span className="text-sm tabular-nums text-slate-500">{left} left</span>
          )}
          <Badge tone={info.tone}>{info.label}</Badge>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">In stock</dt>
              <dd className="font-medium tabular-nums">{Number(prediction.remaining_stock)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Uses per day</dt>
              <dd className="font-medium tabular-nums">
                {Number(Number(prediction.average_daily).toFixed(2))}
                {prediction.observed_weight > 0 && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (scheduled {Number(Number(prediction.scheduled_daily).toFixed(2))})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Runs out</dt>
              <dd className="font-medium">{formatDate(prediction.depletion_date)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Refill by</dt>
              <dd className="font-medium">{formatDate(prediction.recommended_refill_date)}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500">
            {confidenceLabel(prediction.confidence)}
            {prediction.resolved_doses > 0 &&
              ` · learned from ${prediction.resolved_doses} recorded doses`}
          </p>

          {prediction.status !== 'UNKNOWN' && <Projection prediction={prediction} />}
          <Actions prediction={prediction} onChanged={onChanged} />
        </div>
      )}
    </li>
  );
}

/** Forecasts, worst first (the API sorts them), each expandable to a projection. */
export default function RefillList({ predictions = [], onChanged }) {
  if (predictions.length === 0) {
    return (
      <EmptyState
        title="No refill forecasts yet"
        description="Add a medicine with its dose times and PillSync will work out when it runs out."
      />
    );
  }

  const patients = new Set(predictions.map((p) => p.patient));
  return (
    <ul className="space-y-2">
      {predictions.map((prediction) => (
        <Row
          key={prediction.id}
          prediction={prediction}
          showPatient={patients.size > 1}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}
