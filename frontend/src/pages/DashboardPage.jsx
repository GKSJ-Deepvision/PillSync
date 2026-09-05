import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import medicationsApi from '../api/medications.js';
import { caregivingApi, profilesApi } from '../api/profiles.js';
import remindersApi from '../api/reminders.js';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Spinner from '../components/common/Spinner.jsx';
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
  const fetchHistory = useCallback(() => remindersApi.history({ days: 7 }), []);
  const fetchLowStock = useCallback(() => medicationsApi.lowStock(), []);
  const fetchProfiles = useCallback(() => profilesApi.listPatients(), []);
  const fetchAssignments = useCallback(() => caregivingApi.listAssignments(), []);

  const today = useApi(fetchToday);
  const history = useApi(fetchHistory);
  const lowStock = useApi(fetchLowStock);
  const profiles = useApi(fetchProfiles);
  const assignments = useApi(fetchAssignments);

  const loading =
    today.loading || history.loading || lowStock.loading || profiles.loading || assignments.loading;
  const failure = today.error || history.error || profiles.error || assignments.error;

  if (loading) return <Spinner label="Loading your dashboard" className="p-6" />;

  const summary = today.data?.summary ?? { total: 0, taken: 0, missed: 0, pending: 0 };
  const weekly = history.data?.summary?.adherence_percent ?? 0;
  const runningLow = lowStock.data?.length ?? 0;
  const activeAssignments = (assignments.data?.results ?? []).filter(
    (row) => row.status === 'ACTIVE'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good to see you, {firstName(user?.full_name)}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Your day at a glance. OCR prescription scanning and refill prediction arrive in Milestone
          3.
        </p>
      </div>

      {failure && <Alert tone="error">{failure.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Doses today"
          value={`${summary.taken}/${summary.total}`}
          to="/today"
          hint={summary.pending > 0 ? `${summary.pending} still due` : 'All dealt with'}
        />
        <StatTile
          label="Adherence this week"
          value={`${weekly}%`}
          to="/history"
          hint="Taken as a share of doses that were due"
        />
        <StatTile
          label="Running low"
          value={runningLow}
          to="/medications"
          tone={runningLow > 0 ? 'alert' : 'default'}
          hint={runningLow > 0 ? 'Arrange a refill' : 'Stock is healthy'}
        />
        <StatTile
          label={role === 'CAREGIVER' ? 'Patients I care for' : 'Patient profiles'}
          value={role === 'CAREGIVER' ? activeAssignments : (profiles.data?.count ?? 0)}
          to={role === 'CAREGIVER' ? '/patients' : '/family'}
        />
      </div>

      {summary.missed > 0 && (
        <Alert tone="warning" title="Missed doses today">
          {summary.missed} dose{summary.missed === 1 ? '' : 's'} went unrecorded.{' '}
          <Link to="/today" className="font-medium underline">
            Review today
          </Link>
        </Alert>
      )}

      <NextUp today={today.data} onChanged={today.reload} readOnly={role === 'CAREGIVER'} />

      {runningLow > 0 && (
        <Card title="Running low" subtitle="Arrange a refill before these run out">
          <ul className="space-y-2">
            {(lowStock.data ?? []).map((medicine) => (
              <li
                key={medicine.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3"
              >
                <span className="font-medium text-slate-800">{medicine.display_name}</span>
                <span className="text-sm text-amber-900">
                  {medicine.quantity_remaining} left
                  {medicine.days_of_stock_left != null &&
                    ` · about ${medicine.days_of_stock_left} days`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
