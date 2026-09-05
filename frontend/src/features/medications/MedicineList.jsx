import { useCallback, useState } from 'react';

import medicationsApi from '../../api/medications.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useMutation } from '../../hooks/useApi.js';

function ScheduleSummary({ schedules }) {
  const active = schedules.filter((s) => s.is_active);
  if (active.length === 0) {
    return <span className="text-amber-700">No dose times set — no reminders will be sent</span>;
  }
  return active
    .map((s) => `${s.quantity_per_dose} at ${s.time_of_day.slice(0, 5)} (${s.frequency_display})`)
    .join(' · ');
}

function StockLine({ medicine }) {
  const { quantity_remaining: remaining, days_of_stock_left: days } = medicine;

  if (medicine.is_out_of_stock) {
    return <Badge tone="danger">Out of stock</Badge>;
  }
  if (medicine.is_low_stock) {
    return (
      <Badge tone="warning">
        {remaining} left{days != null && ` · about ${days} days`}
      </Badge>
    );
  }
  return (
    <span className="text-sm text-slate-500">
      {remaining} left{days != null && ` · about ${days} days`}
    </span>
  );
}

function MedicineRow({ medicine, onChanged }) {
  const [error, setError] = useState(null);
  const refill = useMutation(useCallback((id) => medicationsApi.refill(id), []));
  const stop = useMutation(useCallback((id) => medicationsApi.stopMedicine(id), []));

  async function run(mutation) {
    setError(null);
    const result = await mutation.submit(medicine.id);
    if (result.ok) onChanged?.();
    else setError(result.error);
  }

  return (
    <li className="rounded-lg border border-slate-200 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {medicine.display_name}
            {medicine.strength && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {medicine.strength} {medicine.strength_unit}
              </span>
            )}
            {!medicine.is_active && (
              <Badge tone="neutral" className="ml-2">
                Stopped
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            <ScheduleSummary schedules={medicine.schedules} />
          </p>
          {medicine.instructions && (
            <p className="mt-0.5 text-sm text-slate-500">{medicine.instructions}</p>
          )}
          <div className="mt-1.5">
            <StockLine medicine={medicine} />
          </div>
        </div>

        {medicine.is_active && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={refill.submitting}
              onClick={() => run(refill)}
              title="Record that you collected a new pack"
            >
              Refill
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={stop.submitting}
              onClick={() => run(stop)}
              title="Stops future reminders; the history is kept"
            >
              Stop
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert tone="error" className="mt-3">
          {error.message}
        </Alert>
      )}
    </li>
  );
}

/**
 * Medicines grouped by condition — the specification's disease-based
 * organisation. A patient on four conditions wants their diabetes medicines
 * together, not one undifferentiated list of fourteen boxes.
 */
export default function MedicineList({ groups, onChanged }) {
  if (!groups || groups.length === 0) {
    return (
      <Card title="Medicines">
        <EmptyState
          title="No medicines yet"
          description="Add one below and set the times you take it."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card
          key={group.code}
          title={group.label}
          subtitle={`${group.count} medicine${group.count === 1 ? '' : 's'}`}
        >
          <ul className="space-y-2">
            {group.medicines.map((medicine) => (
              <MedicineRow key={medicine.id} medicine={medicine} onChanged={onChanged} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
