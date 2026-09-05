import { useCallback } from 'react';

import { caregivingApi, profilesApi } from '../api/profiles.js';
import Alert from '../components/common/Alert.jsx';
import Spinner from '../components/common/Spinner.jsx';
import AssignedPatients from '../features/caregiver/AssignedPatients.jsx';
import { useApi } from '../hooks/useApi.js';

export default function MyPatientsPage() {
  const fetchAssignments = useCallback(() => caregivingApi.listAssignments(), []);
  const fetchProfiles = useCallback(() => profilesApi.listPatients(), []);
  const assignments = useApi(fetchAssignments);
  const profiles = useApi(fetchProfiles);

  if (assignments.loading || profiles.loading) {
    return <Spinner label="Loading your patients" className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My patients</h1>
        <p className="mt-1 text-sm text-slate-600">
          You see a patient only while they have an active link to you. They can revoke it at any
          time.
        </p>
      </div>

      {assignments.error && <Alert tone="error">{assignments.error.message}</Alert>}

      <AssignedPatients
        assignments={assignments.data?.results ?? []}
        profiles={profiles.data?.results ?? []}
      />
    </div>
  );
}
