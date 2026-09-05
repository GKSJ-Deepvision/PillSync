import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { profilesApi } from '../api/profiles.js';
import referenceApi from '../api/reference.js';
import Alert from '../components/common/Alert.jsx';
import Card from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import AccountForm from '../features/profile/AccountForm.jsx';
import MedicalDetailsForm from '../features/profile/MedicalDetailsForm.jsx';
import PasswordForm from '../features/profile/PasswordForm.jsx';
import { useApi } from '../hooks/useApi.js';
import { selectUser } from '../store/authSlice.js';
import { formatDate } from '../utils/format.js';

function MedicalSection() {
  const fetchProfile = useCallback(() => profilesApi.getMyProfile(), []);
  const fetchEnums = useCallback(() => referenceApi.enums(), []);
  const profile = useApi(fetchProfile);
  const enums = useApi(fetchEnums);

  if (profile.loading || enums.loading) {
    return (
      <Card title="Medical details">
        <Spinner label="Loading your profile" />
      </Card>
    );
  }

  if (profile.error) {
    // A caregiver account has no patient profile of its own; that is not a fault.
    return (
      <Card title="Medical details">
        <Alert tone="info">
          {profile.error.status === 404
            ? 'This account does not have a patient profile. Caregivers manage their patients from the Patients page.'
            : profile.error.message}
        </Alert>
      </Card>
    );
  }

  return (
    <Card
      title="Medical details"
      subtitle={`Profile created ${formatDate(profile.data.created_at)}`}
    >
      <MedicalDetailsForm key={profile.data.id} profile={profile.data} enums={enums.data ?? {}} />
    </Card>
  );
}

export default function ProfilePage() {
  const user = useSelector(selectUser);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>

      <Card title="Account" subtitle="How PillSync addresses you and reaches you">
        {user ? (
          <AccountForm key={user.id} user={user} />
        ) : (
          <Spinner label="Loading your account" />
        )}
      </Card>

      <MedicalSection />

      <Card title="Password" subtitle="Change the password you sign in with">
        <PasswordForm />
      </Card>
    </div>
  );
}
