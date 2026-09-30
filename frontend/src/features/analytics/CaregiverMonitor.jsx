import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { toneFor } from '../../components/charts/RingGauge.jsx';
import { statusInfo } from '../refills/status.js';

const TREND_TEXT = {
  IMPROVING: { text: 'Improving', tone: 'success' },
  DECLINING: { text: 'Slipping', tone: 'danger' },
  STABLE: { text: 'Steady', tone: 'neutral' },
};

/** The colour of the adherence figure, on the same bands as the gauge. */
export const rateClass = (rate) =>
  toneFor(rate).replace('stroke-', 'text-').replace('-500', '-600');

function PatientRow({ row }) {
  const trend = TREND_TEXT[row.trend];
  const needs = row.attention.score > 0;

  return (
    <li
      className={`rounded-lg border p-4 ${
        needs ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900">{row.name}</h3>
          {needs ? (
            <ul className="mt-1 list-inside list-disc text-sm text-amber-900">
              {row.attention.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-emerald-700">Doing well — nothing needs attention.</p>
          )}
        </div>

        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-xs text-slate-500">This week</dt>
            <dd className={`text-2xl font-semibold tabular-nums ${rateClass(row.adherence_week)}`}>
              {row.adherence_week == null ? '—' : `${Math.round(row.adherence_week)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Today</dt>
            <dd className="text-2xl font-semibold tabular-nums text-slate-900">
              {row.today.taken}/{row.today.total}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Streak</dt>
            <dd className="text-2xl font-semibold tabular-nums text-slate-900">{row.streak}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {trend && <Badge tone={trend.tone}>{trend.text}</Badge>}
        {row.today.next && (
          <span className="text-slate-500">
            Next: {row.today.next.medicine} at{' '}
            {new Date(row.today.next.at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {row.refills.map((refill) => {
          const info = statusInfo(refill.status);
          return (
            <Badge key={refill.prediction} tone={info.tone}>
              {refill.medicine}: {info.label.toLowerCase()}
            </Badge>
          );
        })}
      </div>
    </li>
  );
}

/** Everyone the caregiver looks after, the one who most needs a call first. */
export default function CaregiverMonitor({ data }) {
  const { patients, totals } = data;

  return (
    <Card
      title="People I look after"
      subtitle={
        totals.patients === 0
          ? undefined
          : totals.needing_attention > 0
            ? `${totals.needing_attention} of ${totals.patients} need attention`
            : `All ${totals.patients} are on track`
      }
    >
      {patients.length === 0 ? (
        <EmptyState
          title="No patients yet"
          description="A patient invites you from their account, and you see them once they accept."
        />
      ) : (
        <ul className="space-y-3">
          {patients.map((row) => (
            <PatientRow key={row.patient} row={row} />
          ))}
        </ul>
      )}
    </Card>
  );
}
