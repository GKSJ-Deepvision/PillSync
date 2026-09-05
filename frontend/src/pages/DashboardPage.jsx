import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { profilesApi, caregivingApi } from '../api/profiles.js';
import referenceApi from '../api/reference.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { useApi } from '../hooks/useApi.js';
import { selectUser } from '../store/authSlice.js';
import { firstName } from '../utils/format.js';

function StatTile({ label, value, to, hint }) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
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

export default function DashboardPage() {
  const user = useSelector(selectUser);

  const fetchProfiles = useCallback(() => profilesApi.listPatients(), []);
  const fetchAssignments = useCallback(() => caregivingApi.listAssignments(), []);
  const fetchCategories = useCallback(() => referenceApi.categories(), []);

  const profiles = useApi(fetchProfiles);
  const assignments = useApi(fetchAssignments);
  const categories = useApi(fetchCategories);

  const loading = profiles.loading || assignments.loading || categories.loading;
  const failure = profiles.error || assignments.error || categories.error;

  if (loading) return <Spinner label="Loading your dashboard" className="p-6" />;

  const profileCount = profiles.data?.count ?? 0;
  const assignmentRows = assignments.data?.results ?? [];
  const activeAssignments = assignmentRows.filter((row) => row.status === 'ACTIVE').length;
  const pendingAssignments = assignmentRows.filter((row) => row.status === 'PENDING').length;
  const catalogueSize = (categories.data ?? []).reduce(
    (total, row) => total + row.medicine_count,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good to see you, {firstName(user?.full_name)}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Milestone 1 covers your account, your profiles and the medicine catalogue. Scheduling and
          reminders arrive in Milestone 2.
        </p>
      </div>

      {failure && <Alert tone="error">{failure.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Patient profiles" value={profileCount} to="/family" />
        <StatTile
          label={user?.role === 'CAREGIVER' ? 'Patients I care for' : 'Active caregivers'}
          value={activeAssignments}
          to={user?.role === 'CAREGIVER' ? '/patients' : '/caregivers'}
        />
        <StatTile
          label="Pending requests"
          value={pendingAssignments}
          to="/caregivers"
          hint={pendingAssignments > 0 ? 'Waiting for a decision' : undefined}
        />
        <StatTile label="Medicines in catalogue" value={catalogueSize} to="/medicines" />
      </div>

      <Card
        title="Medicines by condition"
        subtitle="Seeded from the FDA National Drug Code Directory"
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(categories.data ?? [])
            .filter((row) => row.medicine_count > 0)
            .map((row) => (
              <li
                key={row.code}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">{row.label}</span>
                <span className="text-sm tabular-nums text-slate-500">{row.medicine_count}</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
