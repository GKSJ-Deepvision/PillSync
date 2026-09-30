import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import analyticsApi from '../api/analytics.js';
import remindersApi from '../api/reminders.js';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import RingGauge from '../components/charts/RingGauge.jsx';
import StackedBars from '../components/charts/StackedBars.jsx';
import CaregiverMonitor from '../features/analytics/CaregiverMonitor.jsx';
import { statusInfo } from '../features/refills/status.js';
import Badge from '../components/common/Badge.jsx';
import DoseCard from '../features/reminders/DoseCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { selectRole, selectUser } from '../store/authSlice.js';
import { firstName } from '../utils/format.js';

function StatTile({ label, value, to, hint, tone = 'default' }) {
  const body = (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-colors ${
        tone === 'alert'
          ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
          : 'border-slate-200 bg-white hover:border-brand-300'
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** The next few doses still to take today, so the landing page is actionable. */
function NextUp({ today, onChanged, readOnly }) {
  const open = Object.values(today?.slots ?? {})
    .flat()
    .filter((dose) => dose.status === 'PENDING' || dose.status === 'SNOOZED')
    .sort((a, b) => new Date(a.effective_time) - new Date(b.effective_time))
    .slice(0, 3);

  if (!today || today.summary.total === 0) {
    return (
      <Card title="Today">
        <EmptyState
          title="Nothing scheduled today"
          description="Add a medicine and set the times you take it."
          action={
            <Link to="/medications">
              <Button size="sm">Add a medicine</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (open.length === 0) {
    return (
      <Card title="Today">
        <Alert tone="success">
          Every dose scheduled for today has been dealt with. {today.summary.taken} of{' '}
          {today.summary.total} taken.
        </Alert>
      </Card>
    );
  }

  return (
    <Card
      title="Still to take today"
      subtitle={`${today.summary.taken} of ${today.summary.total} done`}
      actions={
        <Link to="/today">
          <Button size="sm" variant="secondary">
            See the whole day
          </Button>
        </Link>
      }
    >
      <ul className="space-y-2">
        {open.map((dose) => (
          <DoseCard key={dose.id} dose={dose} onChanged={onChanged} readOnly={readOnly} />
        ))}
      </ul>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);

  const fetchToday = useCallback(() => remindersApi.today(), []);
  const fetchDashboard = useCallback(() => analyticsApi.dashboard(), []);
  const fetchMonitor = useCallback(
    () => (role === 'CAREGIVER' ? analyticsApi.caregiver() : Promise.resolve(null)),
    [role]
  );

  const today = useApi(fetchToday);
  const dashboard = useApi(fetchDashboard);
  const monitor = useApi(fetchMonitor);

  if (today.loading || dashboard.loading || monitor.loading) {
    return <Spinner label="Loading your dashboard" className="p-6" />;
  }

  const failure = today.error || dashboard.error || monitor.error;
  const data = dashboard.data;
  const summary = today.data?.summary ?? { total: 0, taken: 0, missed: 0, pending: 0 };
  const refills = data?.refills;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good to see you, {firstName(user?.full_name)}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Your day at a glance.</p>
      </div>

      {failure && <Alert tone="error">{failure.message}</Alert>}

      {monitor.data && <CaregiverMonitor data={monitor.data} />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Doses today"
            value={`${summary.taken}/${summary.total}`}
            to="/today"
            hint={summary.pending > 0 ? `${summary.pending} still due` : 'All dealt with'}
          />
          <StatTile
            label="Current streak"
            value={`${data.adherence.streaks.current} day${data.adherence.streaks.current === 1 ? '' : 's'}`}
            to="/adherence"
            hint={`Best: ${data.adherence.streaks.longest}`}
          />
          <StatTile
            label="Refills needing attention"
            value={refills.needs_attention}
            to="/refills"
            tone={refills.needs_attention > 0 ? 'alert' : 'default'}
            hint={refills.needs_attention > 0 ? 'Arrange a refill' : 'Stock is healthy'}
          />
          <StatTile label="Active medicines" value={data.active_medicines} to="/medications" />
        </div>
      )}

      {summary.missed > 0 && (
        <Alert tone="warning" title="Missed doses today">
          {summary.missed} dose{summary.missed === 1 ? '' : 's'} went unrecorded.{' '}
          <Link to="/today" className="font-medium underline">
            Review today
          </Link>
        </Alert>
      )}

      <NextUp today={today.data} onChanged={today.reload} readOnly={role === 'CAREGIVER'} />

      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="Adherence"
            className="lg:col-span-1"
            actions={
              <Link to="/adherence">
                <Button size="sm" variant="secondary">
                  Details
                </Button>
              </Link>
            }
          >
            <div className="flex flex-wrap justify-around gap-4">
              <RingGauge value={data.adherence.week} label="This week" />
              <RingGauge value={data.adherence.month} label="This month" />
            </div>
            {data.missed_insights.length > 0 && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {data.missed_insights[0]}
              </p>
            )}
          </Card>

          <Card title="Last 30 days" className="lg:col-span-2">
            <StackedBars data={data.daily} />
          </Card>
        </div>
      )}

      {refills?.urgent.length > 0 && (
        <Card
          title="Running low"
          subtitle="Arrange a refill before these run out"
          actions={
            <Link to="/refills">
              <Button size="sm" variant="secondary">
                Refill forecast
              </Button>
            </Link>
          }
        >
          <ul className="space-y-2">
            {refills.urgent.map((refill) => {
              const info = statusInfo(refill.status);
              return (
                <li
                  key={refill.prediction}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3"
                >
                  <span className="font-medium text-slate-800">{refill.medicine}</span>
                  <span className="flex items-center gap-3 text-sm text-amber-900">
                    {refill.days_remaining != null &&
                      `about ${Math.floor(refill.days_remaining)} days`}
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
