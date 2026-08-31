import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Input, Button, Alert } from '../../../components/common';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, error, setError, isAuthenticating } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm password';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#f0f9ff_0%,#eef6ff_45%,#edf9f5_100%)] px-4 py-12">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_35px_90px_rgba(14,116,144,0.14)] backdrop-blur-xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-primary-600 via-sky-600 to-cyan-500 p-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <span className="text-xl font-black">P</span>
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">PillSync</p>
              <p className="text-xs text-sky-100">Join the care plan</p>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure account setup
          </div>
        </div>

        <div className="p-7 sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">
              Create account
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Get started</h2>
          </div>

          {error && (
            <Alert type="danger" message={error} onClose={() => setError(null)} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={validationErrors.name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={validationErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={validationErrors.password}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={validationErrors.confirmPassword}
              required
            />

            <div className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                I agree to the{' '}
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-700">
                  Terms of Service
                </a>
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isAuthenticating}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
