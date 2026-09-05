import { useCallback } from 'react';

import medicationsApi from '../api/medications.js';
import { profilesApi } from '../api/profiles.js';
import referenceApi from '../api/reference.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import AddMedicineForm from '../features/medications/AddMedicineForm.jsx';
import MedicineList from '../features/medications/MedicineList.jsx';
import { useApi } from '../hooks/useApi.js';

export default function MedicationsPage() {
  const fetchGroups = useCallback(() => medicationsApi.byCondition(), []);
  const fetchProfile = useCallback(() => profilesApi.getMyProfile(), []);
  const fetchEnums = useCallback(() => referenceApi.enums(), []);

  const groups = useApi(fetchGroups);
  const profile = useApi(fetchProfile);
  const enums = useApi(fetchEnums);

  if (groups.loading || profile.loading || enums.loading) {
    return <Spinner label="Loading medicines" className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Medicines</h1>
        <p className="mt-1 text-sm text-slate-600">
          Grouped by the condition they treat. Setting a dose time is what makes reminders appear on
          the Today page.
        </p>
      </div>

      {groups.error && <Alert tone="error">{groups.error.message}</Alert>}

      <MedicineList groups={groups.data} onChanged={groups.reload} />

      {profile.error ? (
        <Card title="Add a medicine">
          <Alert tone="info">
            {profile.error.status === 404
              ? 'This account has no patient profile, so medicines are managed from the patient’s own account.'
              : profile.error.message}
          </Alert>
        </Card>
      ) : (
        <Card title="Add a medicine" subtitle="Search the catalogue, or type the details yourself">
          <AddMedicineForm
            patientId={profile.data.id}
            categories={enums.data?.medicine_categories ?? []}
            onAdded={groups.reload}
          />
        </Card>
      )}
    </div>
  );
}
