import { useCallback } from 'react';

import { profilesApi } from '../api/profiles.js';
import referenceApi from '../api/reference.js';
import Alert from '../components/common/Alert.jsx';
import Spinner from '../components/common/Spinner.jsx';
import FamilyProfiles from '../features/profile/FamilyProfiles.jsx';
import { useApi } from '../hooks/useApi.js';

export default function FamilyPage() {
  const fetchProfiles = useCallback(() => profilesApi.listPatients(), []);
  const fetchEnums = useCallback(() => referenceApi.enums(), []);
  const profiles = useApi(fetchProfiles);
  const enums = useApi(fetchEnums);

  if (profiles.loading || enums.loading) {
    return <Spinner label="Loading profiles" className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Family profiles</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a profile for anyone whose medicines you manage. A dependent profile has no login of
          its own - you manage it from your account.
        </p>
      </div>

      {profiles.error && <Alert tone="error">{profiles.error.message}</Alert>}

      <FamilyProfiles
        profiles={profiles.data?.results ?? []}
        enums={enums.data ?? {}}
        onChanged={profiles.reload}
      />
    </div>
  );
}
