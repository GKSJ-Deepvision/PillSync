import { useState } from 'react';
import { useDispatch } from 'react-redux';

import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { updateProfile } from '../../store/authSlice.js';

/**
 * Edit the signed-in user's own account details.
 *
 * State is seeded from the `user` prop and the caller mounts this with a `key`.
 * That is deliberate: copying fetched data into form state inside an effect
 * costs a second render pass and silently overwrites whatever the user has
 * typed if the source reloads mid-edit.
 */
export default function AccountForm({ user }) {
  const dispatch = useDispatch();
  const [values, setValues] = useState({
    full_name: user.full_name ?? '',
    phone_number: user.phone_number ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const result = await dispatch(updateProfile(values));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) setSaved(true);
    else setError(result.payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && <Alert tone="success">Your account details were saved.</Alert>}
      {error && <Alert tone="error">{error.message}</Alert>}

      <Input
        label="Full name"
        required
        value={values.full_name}
        onChange={(event) => setValues({ ...values, full_name: event.target.value })}
      />
      <Input
        label="Phone number"
        type="tel"
        value={values.phone_number}
        onChange={(event) => setValues({ ...values, phone_number: event.target.value })}
      />
      <Input
        label="Email address"
        value={user.email ?? ''}
        disabled
        readOnly
        hint="Your email is your sign-in name and cannot be changed here."
      />

      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}
