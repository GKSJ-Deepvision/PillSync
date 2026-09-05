import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { caregivingApi } from '../api/profiles.js';
import referenceApi from '../api/reference.js';
import Alert from '../components/common/Alert.jsx';
import Spinner from '../components/common/Spinner.jsx';
import CaregiverLinks from '../features/caregiver/CaregiverLinks.jsx';
import { useApi } from '../hooks/useApi.js';
import { selectUser } from '../store/authSlice.js';

export default function CaregiversPage() {
  const user = useSelector(selectUser);
  const fetchAssignments = useCallback(() => caregivingApi.listAssignments(), []);
  const fetchEnums = useCallback(() => referenceApi.enums(), []);
  const assignments = useApi(fetchAssignments);
  const enums = useApi(fetchEnums);

  if (assignments.loading || enums.loading) {
    return <Spinner label="Loading caregivers" className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Caregivers</h1>
        <p className="mt-1 text-sm text-slate-600">
          A caregiver sees nothing until you accept their link, and you can revoke it at any time.
        </p>
      </div>

      {assignments.error && <Alert tone="error">{assignments.error.message}</Alert>}

      <CaregiverLinks
        assignments={assignments.data?.results ?? []}
        enums={enums.data ?? {}}
        viewerId={user?.id}
        onChanged={assignments.reload}
      />
    </div>
  );
}
