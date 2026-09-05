import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { clearError, login, selectAuthError, selectAuthStatus } from '../../store/authSlice.js';
import { collectErrors, validateEmail, validateRequired } from '../../utils/validation.js';

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const serverError = useSelector(selectAuthError);

  const [values, setValues] = useState({ email: '', password: '' });
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
      email: validateEmail(values.email),
      password: validateRequired(values.password, 'Password'),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      // Send them where they were headed before the login redirect.
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError.message}</Alert>}

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />

      <Button type="submit" size="lg" className="w-full" loading={status === 'loading'}>
        Sign in
      </Button>

      <p className="text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
