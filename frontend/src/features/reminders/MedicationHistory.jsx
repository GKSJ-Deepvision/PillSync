import { useState } from 'react';

import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

const STATUS_TONES = {
  TAKEN: 'success',
  MISSED: 'danger',
  SKIPPED: 'neutral',
  PENDING: 'neutral',
  SNOOZED: 'warning',
};

function DayBar({ day }) {
  if (!day.total) {
    return <div className="h-2 rounded-full bg-slate-100" title="Nothing scheduled" />;
  }
  const width = (count) => `${(count / day.total) * 100}%`;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-slate-200">
      <div className="bg-emerald-500" style={{ width: width(day.taken) }} />
      <div className="bg-rose-500" style={{ width: width(day.missed) }} />
      <div className="bg-slate-300" style={{ width: width(day.skipped + day.pending) }} />
    </div>
  );
}

/**
 * Day-by-day medication history.
 *
 * Collapsed by default: the useful glance is "which days went wrong", and the
 * dose detail only matters once you have picked a day.
 */
export default function MedicationHistory({ data }) {
  const [openDay, setOpenDay] = useState(null);
  const days = data?.days ?? [];
  const summary = data?.summary;

  if (days.length === 0) {
    return <EmptyState title="No history yet" description="Doses appear here once scheduled." />;
  }

  return (
    <div className="space-y-6">
      {summary && (
        <Card
          title="Over this period"
          subtitle={`${formatDate(data.start_date)} to ${formatDate(data.end_date)}`}
        >
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ['Doses due', summary.total],
              ['Taken', summary.taken],
              ['Missed', summary.missed],
              ['Adherence', `${summary.adherence_percent}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="By day">
        <ul className="space-y-2">
          {days.map((day) => {
            const expanded = openDay === day.date;
            return (
              <li key={day.date} className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenDay(expanded ? null : day.date)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{formatDate(day.date)}</span>
                    <span className="text-sm tabular-nums text-slate-600">
                      {day.total === 0
                        ? 'nothing scheduled'
                        : `${day.taken}/${day.total} taken · ${day.adherence_percent}%`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <DayBar day={day} />
                  </div>
                </button>

                {expanded && day.doses.length > 0 && (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100">
                    {day.doses.map((dose) => (
                      <li
                        key={dose.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                      >
                        <span className="text-slate-700">
                          <span className="mr-2 tabular-nums text-slate-500">
                            {new Date(dose.scheduled_for).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {dose.medicine_name}
                        </span>
                        <Badge tone={STATUS_TONES[dose.status]}>{dose.status_display}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
