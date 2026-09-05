import { useCallback, useState } from 'react';

import { profilesApi } from '../../api/profiles.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { useMutation } from '../../hooks/useApi.js';

/** The clinical part of a patient profile. Mount with `key={profile.id}`. */
export default function MedicalDetailsForm({ profile, enums }) {
  const [values, setValues] = useState({
    date_of_birth: profile.date_of_birth ?? '',
    gender: profile.gender ?? 'UNDISCLOSED',
    blood_group: profile.blood_group ?? 'UNKNOWN',
    height_cm: profile.height_cm ?? '',
    weight_kg: profile.weight_kg ?? '',
    allergies: profile.allergies ?? '',
  });
  const [saved, setSaved] = useState(false);

  const update = useCallback(
    (payload) => profilesApi.updatePatient(profile.id, payload),
    [profile.id]
  );
  const { submit, submitting, error } = useMutation(update);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaved(false);

    const result = await submit({
      ...values,
      // Empty number and date inputs must reach the API as null, not "".
      height_cm: values.height_cm === '' ? null : Number(values.height_cm),
      weight_kg: values.weight_kg === '' ? null : values.weight_kg,
      date_of_birth: values.date_of_birth === '' ? null : values.date_of_birth,
    });
    if (result.ok) setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && <Alert tone="success">Your medical details were saved.</Alert>}
      {error && <Alert tone="error">{error.message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date of birth"
          type="date"
          value={values.date_of_birth}
          onChange={(event) => setValues({ ...values, date_of_birth: event.target.value })}
          error={error?.details?.date_of_birth?.[0]}
        />
        <Select
          label="Gender"
          options={enums.genders ?? []}
          value={values.gender}
          onChange={(event) => setValues({ ...values, gender: event.target.value })}
        />
        <Select
          label="Blood group"
          options={enums.blood_groups ?? []}
          value={values.blood_group}
          onChange={(event) => setValues({ ...values, blood_group: event.target.value })}
        />
        <Input
          label="Height (cm)"
          type="number"
          min="30"
          max="275"
          value={values.height_cm}
          onChange={(event) => setValues({ ...values, height_cm: event.target.value })}
          error={error?.details?.height_cm?.[0]}
        />
        <Input
          label="Weight (kg)"
          type="number"
          step="0.1"
          min="1"
          max="500"
          value={values.weight_kg}
          onChange={(event) => setValues({ ...values, weight_kg: event.target.value })}
          error={error?.details?.weight_kg?.[0]}
        />
      </div>

      <div>
        <label htmlFor="allergies" className="mb-1 block text-sm font-medium text-slate-700">
          Known allergies
        </label>
        <textarea
          id="allergies"
          rows={3}
          placeholder="One per line, for example: Penicillin"
          value={values.allergies}
          onChange={(event) => setValues({ ...values, allergies: event.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm
            focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <Button type="submit" loading={submitting}>
        Save medical details
      </Button>
    </form>
  );
}
