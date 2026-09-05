import { useCallback, useState } from 'react';

import authApi from '../../api/auth.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useMutation } from '../../hooks/useApi.js';
import {
  collectErrors,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from '../../utils/validation.js';

export default function PasswordForm() {
  const [values, setValues] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const changePassword = useCallback((payload) => authApi.changePassword(payload), []);
  const { submit, submitting, error } = useMutation(changePassword);

  async function handleSubmit(event) {
    event.preventDefault();
    setDone(false);

    const found = collectErrors({
      current_password: validateRequired(values.current_password, 'Current password'),
      new_password: validatePassword(values.new_password),
      new_password_confirm: validatePasswordConfirmation(
        values.new_password,
        values.new_password_confirm
      ),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await submit(values);
    if (result.ok) {
      setDone(true);
      setValues({ current_password: '', new_password: '', new_password_confirm: '' });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {done && <Alert tone="success">Your password has been changed.</Alert>}
      {error && <Alert tone="error">{error.message}</Alert>}

      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={values.current_password}
        onChange={(event) => setValues({ ...values, current_password: event.target.value })}
        error={errors.current_password}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={values.new_password}
        onChange={(event) => setValues({ ...values, new_password: event.target.value })}
        error={errors.new_password}
      />
      <Input
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        value={values.new_password_confirm}
        onChange={(event) => setValues({ ...values, new_password_confirm: event.target.value })}
        error={errors.new_password_confirm}
      />

      <Button type="submit" loading={submitting}>
        Change password
      </Button>
    </form>
  );
}
