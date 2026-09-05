import { useCallback, useState } from 'react';

import remindersApi from '../../api/reminders.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { useMutation } from '../../hooks/useApi.js';

const STATUS_TONES = {
  PENDING: 'neutral',
  SNOOZED: 'warning',
  TAKEN: 'success',
  MISSED: 'danger',
  SKIPPED: 'neutral',
};

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * One scheduled dose, with the three actions the specification names.
 *
 * The actions are deliberately large and few. A patient reaching for their
 * phone with a tablet already in hand should not have to read a toolbar.
 */
export default function DoseCard({ dose, onChanged, readOnly = false }) {
  const [error, setError] = useState(null);

  const take = useMutation(useCallback((id) => remindersApi.take(id), []));
  const miss = useMutation(useCallback((id) => remindersApi.miss(id), []));
  const skip = useMutation(useCallback((id) => remindersApi.skip(id), []));
  const snooze = useMutation(useCallback((id) => remindersApi.snooze(id), []));

  const busy = take.submitting || miss.submitting || skip.submitting || snooze.submitting;

  async function run(mutation) {
    setError(null);
    const result = await mutation.submit(dose.id);
    if (result.ok) onChanged?.();
    else setError(result.error);
  }

  const open = dose.status === 'PENDING' || dose.status === 'SNOOZED';

  return (
    <li
      className={`rounded-lg border px-4 py-3 ${
        dose.is_overdue && open ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            <span className="mr-2 tabular-nums text-slate-500">
              {formatTime(dose.effective_time)}
            </span>
            {dose.medicine_name}
            {dose.medicine_strength && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {dose.medicine_strength}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {dose.quantity_expected} × {dose.slot_display.toLowerCase()}
            {dose.instructions && ` · ${dose.instructions}`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[dose.status]}>{dose.status_display}</Badge>
            {dose.is_overdue && open && <Badge tone="danger">Overdue</Badge>}
            {dose.snooze_count > 0 && (
              <span className="text-xs text-slate-500">snoozed {dose.snooze_count}×</span>
            )}
          </div>
        </div>

        {open && !readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={take.submitting} disabled={busy} onClick={() => run(take)}>
              Taken
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={snooze.submitting}
              disabled={busy || !dose.can_snooze}
              onClick={() => run(snooze)}
              title={dose.can_snooze ? 'Remind me in 15 minutes' : 'Snoozed too many times'}
            >
              Snooze
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={miss.submitting}
              disabled={busy}
              onClick={() => run(miss)}
            >
              Missed
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={skip.submitting}
              disabled={busy}
              onClick={() => run(skip)}
              title="Not an adherence failure — for a dose you were told to stop"
            >
              Skip
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
