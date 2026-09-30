import Card from '../../components/common/Card.jsx';
import HBars from '../../components/charts/HBars.jsx';

const pct = (value) => (value == null ? '—' : `${Math.round(value * 10) / 10}%`);
const num = (value) => (value == null ? '—' : Number(value).toLocaleString());

function Metric({ label, value, hint }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</dd>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const Grid = ({ children }) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">{children}</dl>
);

/** Platform health from the administrator's side. */
export default function AdminAnalytics({ data }) {
  const {
    users,
    engagement,
    doses,
    notifications,
    ocr,
    refills,
    refill_forecast_accuracy: acc,
  } = data;

  const channels = Object.entries(notifications.by_channel).map(([channel, stats]) => ({
    label: channel.charAt(0) + channel.slice(1).toLowerCase(),
    value: stats.delivery_rate,
    detail: `${stats.sent} sent, ${stats.failed} failed`,
  }));

  return (
    <div className="space-y-6">
      <Card title="Users">
        <Grid>
          <Metric
            label="Total"
            value={num(users.total)}
            hint={`${users.new_last_30_days} new in 30 days`}
          />
          <Metric label="Patients" value={num(users.patients)} />
          <Metric label="Caregivers" value={num(users.caregivers)} />
          <Metric label="Administrators" value={num(users.admins)} />
        </Grid>
      </Card>

      <Card title="Usage" subtitle="Last 30 days">
        <Grid>
          <Metric label="Patient profiles" value={num(engagement.patient_profiles)} />
          <Metric label="Active medicines" value={num(engagement.active_medicines)} />
          <Metric
            label="Active this week"
            value={num(engagement.patients_with_activity_7d)}
            hint="Patients who recorded a dose"
          />
          <Metric
            label="Adherence"
            value={pct(doses.adherence_rate)}
            hint={`${num(doses.taken)} taken · ${num(doses.missed)} missed`}
          />
        </Grid>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Reminder delivery"
          subtitle="Sent as a share of attempts; skipped ones excluded"
        >
          <p className="mb-4 text-3xl font-semibold tabular-nums text-slate-900">
            {pct(notifications.delivery_rate)}
          </p>
          <HBars rows={channels} tone="success" />
        </Card>

        <Card title="Prescription scanning" subtitle="Last 30 days">
          <Grid>
            <Metric label="Scans" value={num(ocr.total)} />
            <Metric label="Read successfully" value={pct(ocr.success_rate)} />
            <Metric label="Added to a list" value={pct(ocr.confirm_rate)} hint="Of scans read" />
            <Metric
              label="Avg. confidence"
              value={ocr.average_confidence == null ? '—' : ocr.average_confidence.toFixed(2)}
            />
            <Metric
              label="Avg. time"
              value={ocr.average_ms == null ? '—' : `${(ocr.average_ms / 1000).toFixed(1)} s`}
            />
            <Metric label="Failed" value={num(ocr.failed)} />
          </Grid>
        </Card>
      </div>

      <Card title="Refills">
        <Grid>
          <Metric label="Need attention" value={num(refills.needs_attention)} />
          <Metric label="Out of stock" value={num(refills.counts.OUT)} />
          <Metric label="Almost out" value={num(refills.counts.CRITICAL)} />
          <Metric label="Running low" value={num(refills.counts.LOW)} />
        </Grid>
        <p className="mt-4 text-sm text-slate-600">
          {acc.medicines_scored > 0 ? (
            <>
              Weekly consumption forecasts were within {acc.tolerance_percent}% of actual{' '}
              <strong>{pct(acc.within_tolerance_percent)}</strong> of the time (mean error{' '}
              {pct(acc.mean_absolute_percentage_error)}, {acc.samples} checks).
            </>
          ) : (
            <>Forecast accuracy: {acc.note || 'not enough history yet.'}</>
          )}
        </p>
      </Card>
    </div>
  );
}

/** Latency percentiles and the slowest routes. */
export function PerformanceCard({ data }) {
  return (
    <Card
      title="API performance"
      subtitle={`Last ${num(data.requests)} requests on this server process`}
    >
      <Grid>
        <Metric label="Median" value={data.p50_ms == null ? '—' : `${data.p50_ms} ms`} />
        <Metric label="95th percentile" value={data.p95_ms == null ? '—' : `${data.p95_ms} ms`} />
        <Metric label="99th percentile" value={data.p99_ms == null ? '—' : `${data.p99_ms} ms`} />
        <Metric
          label="Server errors"
          value={data.server_error_rate == null ? '—' : `${data.server_error_rate}%`}
        />
      </Grid>

      {data.slowest_routes.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Slowest routes by 95th percentile</caption>
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Route</th>
                <th className="py-2 pr-4 text-right font-medium">Calls</th>
                <th className="py-2 pr-4 text-right font-medium">p50</th>
                <th className="py-2 pr-4 text-right font-medium">p95</th>
                <th className="py-2 text-right font-medium">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slowest_routes.map((route) => (
                <tr key={route.route}>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-700">{route.route}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{route.count}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{route.p50_ms}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{route.p95_ms}</td>
                  <td className="py-2 text-right tabular-nums">{route.max_ms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Measured in memory per server process, so behind several workers this is a sample of
        traffic, not a total.
      </p>
    </Card>
  );
}
