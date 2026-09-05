import { useCallback, useState } from 'react';

import { profilesApi } from '../../api/profiles.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { useMutation } from '../../hooks/useApi.js';
import { formatDate, titleCase } from '../../utils/format.js';

const EMPTY = {
  full_name: '',
  relationship_to_manager: 'PARENT',
  date_of_birth: '',
  gender: 'UNDISCLOSED',
};

function AddProfileForm({ relationships, genders, onAdded }) {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const create = useCallback((payload) => profilesApi.createPatient(payload), []);
  const { submit, submitting, error } = useMutation(create);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!values.full_name.trim()) {
      setFieldErrors({ full_name: 'Enter a name for this profile.' });
      return;
    }
    setFieldErrors({});

    const result = await submit({ ...values, date_of_birth: values.date_of_birth || null });
    if (result.ok) {
      setValues(EMPTY);
      onAdded();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <Alert tone="error">{error.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          required
          value={values.full_name}
          onChange={(event) => setValues({ ...values, full_name: event.target.value })}
          error={fieldErrors.full_name || error?.details?.full_name?.[0]}
          hint="A name you will recognise, for example 'Asha (mother)'."
        />
        <Select
          label="Relationship to you"
          options={relationships}
          value={values.relationship_to_manager}
          onChange={(event) =>
            setValues({ ...values, relationship_to_manager: event.target.value })
          }
        />
        <Input
          label="Date of birth"
          type="date"
          value={values.date_of_birth}
          onChange={(event) => setValues({ ...values, date_of_birth: event.target.value })}
        />
        <Select
          label="Gender"
          options={genders}
          value={values.gender}
          onChange={(event) => setValues({ ...values, gender: event.target.value })}
        />
      </div>

      <Button type="submit" loading={submitting}>
        Add profile
      </Button>
    </form>
  );
}

function ProfileRow({ profile, onChanged }) {
  const deactivate = useCallback((id) => profilesApi.deactivatePatient(id), []);
  const { submit, submitting } = useMutation(deactivate);

  async function handleRemove() {
    const result = await submit(profile.id);
    if (result.ok) onChanged();
  }

  const details =
    [
      profile.relationship_to_manager ? titleCase(profile.relationship_to_manager) : null,
      profile.age != null ? `${profile.age} years` : null,
      profile.date_of_birth ? formatDate(profile.date_of_birth) : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'No details recorded yet';

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
      <div>
        <p className="font-medium text-slate-900">
          {profile.full_name} {profile.is_self && <Badge tone="brand">You</Badge>}
          {!profile.is_active && <Badge tone="neutral">Inactive</Badge>}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{details}</p>
      </div>

      {/* Retire, not delete: medication history hangs off this profile from M2. */}
      {!profile.is_self && profile.is_active && (
        <Button variant="secondary" size="sm" loading={submitting} onClick={handleRemove}>
          Retire profile
        </Button>
      )}
    </li>
  );
}

export default function FamilyProfiles({ profiles, enums, onChanged }) {
  return (
    <>
      <Card title={`Profiles (${profiles.length})`}>
        {profiles.length === 0 ? (
          <EmptyState
            title="No profiles yet"
            description="Your own profile is created when you register."
          />
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <ProfileRow key={profile.id} profile={profile} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Add a family member" subtitle="For someone who does not sign in themselves">
        <AddProfileForm
          relationships={enums.caregiver_relationships ?? []}
          genders={enums.genders ?? []}
          onAdded={onChanged}
        />
      </Card>
    </>
  );
}
