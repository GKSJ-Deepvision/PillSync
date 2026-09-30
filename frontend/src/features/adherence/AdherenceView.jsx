import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import HBars from '../../components/charts/HBars.jsx';
import RingGauge from '../../components/charts/RingGauge.jsx';
import StackedBars from '../../components/charts/StackedBars.jsx';
import { titleCase } from '../../utils/format.js';

const TREND = {
  IMPROVING: { tone: 'success', label: 'Improving' },
  STABLE: { tone: 'neutral', label: 'Steady' },
  DECLINING: { tone: 'danger', label: 'Slipping' },
  UNKNOWN: { tone: 'neutral', label: 'Not enough data to show a trend' },
};

const SLOT_ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

function Stat({ label, value, hint }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function slotRows(bySlot = {}) {
  return SLOT_ORDER.filter((slot) => bySlot[slot]).map((slot) => ({
    label: titleCase(slot),
    value: bySlot[slot].missed_rate,
    detail: `${bySlot[slot].missed} of ${bySlot[slot].resolved}`,
  }));
}

export function weekdayRows(byWeekday = {}) {
  return Object.entries(byWeekday).map(([day, stats]) => ({
    label: day,
    value: stats.resolved ? stats.missed_rate : null,
    detail: stats.resolved ? `${stats.missed} of ${stats.resolved}` : undefined,
  }));
}

export function medicineRows(byMedicine = {}) {
  return Object.entries(byMedicine)
    .filter(([, stats]) => stats.missed > 0)
    .slice(0, 6)
    .map(([name, stats]) => ({
      label: name,
      value: stats.missed_rate,
      detail: `${stats.missed} of ${stats.resolved}`,
    }));
}

/** The headline numbers, the daily chart and where the misses cluster. */
export default function AdherenceView({ summary, days }) {
  const { missed_analysis: analysis, trend, streaks } = summary;
  const trendInfo = TREND[trend?.direction] ?? TREND.UNKNOWN;

  if (summary.resolved === 0) {
    return (
      <Alert tone="info" title="No history yet">
        Adherence appears once you have marked some doses as taken or missed.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card title={`Last ${days} days`}>
        <div className="flex flex-wrap items-center gap-8">
          <RingGauge
            value={summary.adherence_rate}
            label="Adherence"
            caption={`${summary.taken} of ${summary.resolved} doses taken`}
          />
          <RingGauge
            value={summary.on_time_rate}
            label="On time"
            caption="Within an hour of the time"
          />
          <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <Stat
              label="Current streak"
              value={`${streaks.current} day${streaks.current === 1 ? '' : 's'}`}
              hint={`Best: ${streaks.longest}`}
            />
            <Stat
              label="Perfect days"
              value={summary.consistency == null ? '—' : `${Math.round(summary.consistency)}%`}
              hint="No dose missed"
            />
            <Stat
              label="Missed"
              value={summary.missed}
              hint={`${summary.skipped} skipped on purpose`}
            />
          </dl>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          Trend: <Badge tone={trendInfo.tone}>{trendInfo.label}</Badge>
          {trend?.change != null && (
            <span className="text-slate-500">
              ({trend.change > 0 ? '+' : ''}
              {trend.change} points between the first and second half)
            </span>
          )}
        </p>
      </Card>

      <Card title="Day by day">
        <StackedBars data={summary.daily} />
      </Card>

      {analysis.insights.length > 0 && (
        <Alert tone="info" title="What the pattern says">
          <ul className="list-inside list-disc space-y-0.5">
            {analysis.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Missed doses by time of day" subtitle="Share of doses missed">
          <HBars rows={slotRows(analysis.by_slot)} tone="danger" />
        </Card>
        <Card title="Missed doses by day of week" subtitle="Share of doses missed">
          <HBars rows={weekdayRows(analysis.by_weekday)} tone="danger" />
        </Card>
      </div>

      {medicineRows(analysis.by_medicine).length > 0 && (
        <Card title="Most-missed medicines">
          <HBars rows={medicineRows(analysis.by_medicine)} tone="danger" />
        </Card>
      )}
    </div>
  );
}
