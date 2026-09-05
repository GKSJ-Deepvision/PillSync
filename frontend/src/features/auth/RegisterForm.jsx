import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { fieldError } from '../../api/client.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { clearError, register, selectAuthError, selectAuthStatus } from '../../store/authSlice.js';
import {
  MIN_PASSWORD_LENGTH,
  collectErrors,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from '../../utils/validation.js';

// Administrators are created by an administrator, so the role choice here is
// only ever between the two self-service roles.
const ROLE_OPTIONS = [
  { value: 'PATIENT', label: 'Patient - I manage my own medicines' },
  { value: 'CAREGIVER', label: 'Caregiver - I look after someone else' },
];

const EMPTY = {
  full_name: '',
  email: '',
  phone_number: '',
  role: 'PATIENT',
  password: '',
  password_confirm: '',
};

export default function RegisterForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const serverError = useSelector(selectAuthError);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: null }));
    if (serverError) dispatch(clearError());
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const found = collectErrors({
      full_name: validateRequired(values.full_name, 'Full name'),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      password_confirm: validatePasswordConfirmation(values.password, values.password_confirm),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await dispatch(register(values));
    if (register.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  }

  // Field-level messages from the server win over the local guesses.
  const errorFor = (field) => errors[field] || fieldError(serverError, field);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError.message}</Alert>}

      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        required
        value={values.full_name}
        onChange={handleChange}
        error={errorFor('full_name')}
      />

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={handleChange}
        error={errorFor('email')}
      />

      <Input
        label="Phone number"
        name="phone_number"
        type="tel"
        autoComplete="tel"
        hint="Optional. Used for SMS reminders from Milestone 2."
        value={values.phone_number}
        onChange={handleChange}
        error={errorFor('phone_number')}
      />

      <Select
        label="I am signing up as"
        name="role"
        options={ROLE_OPTIONS}
        value={values.role}
        onChange={handleChange}
        error={errorFor('role')}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint={`At least ${MIN_PASSWORD_LENGTH} characters. A short phrase works well.`}
        value={values.password}
        onChange={handleChange}
        error={errorFor('password')}
      />

      <Input
        label="Repeat password"
        name="password_confirm"
        type="password"
        autoComplete="new-password"
        required
        value={values.password_confirm}
        onChange={handleChange}
        error={errorFor('password_confirm')}
      />

      <Button type="submit" size="lg" className="w-full" loading={status === 'loading'}>
        Create account
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
