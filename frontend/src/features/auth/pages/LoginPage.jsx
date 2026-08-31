import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Input, Button, Alert } from '../../../components/common';
import {
  Mail,
  Lock,
  ShieldCheck,
  Pill,
  HeartPulse,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error, setError, isAuthenticating } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
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
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const demoCredentials = [
    { role: 'Patient', email: 'patient@example.com', password: 'password' },
    { role: 'Caregiver', email: 'caregiver@example.com', password: 'password' },
    { role: 'Admin', email: 'admin@example.com', password: 'password' },
  ];

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),transparent_24%),linear-gradient(135deg,#f1fbff_0%,#f8fbff_48%,#eefaf6_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/70 shadow-[0_30px_80px_rgba(12,69,94,0.14)] ring-1 ring-slate-200/60 backdrop-blur-lg lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#061d38] via-[#0d3b66] to-[#11a7b8] p-8 text-white sm:p-10 lg:p-12">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_30px_rgba(4,14,30,0.18)] backdrop-blur-sm">
                  <Pill className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">PillSync</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/90">
                    Care intelligence
                  </p>
                </div>
              </div>

              <div className="space-y-6 py-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trusted by care teams
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                    Medication care that feels easy.
                  </h1>
                  <p className="max-w-lg text-base text-sky-50/90">
                    Keep every prescription, reminder, and health routine on track with a calmer,
                    smarter daily care plan.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {['Daily dose tracking', 'Caregiver visibility', 'Adherence insights'].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-3 py-2.5 backdrop-blur-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                      </div>
                      <span className="text-sm font-medium text-sky-50">{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <HeartPulse className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Sign in</h2>
            </div>

            {error && (
              <Alert
                type="danger"
                message={error}
                onClose={() => setError(null)}
                className="mb-6"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isAuthenticating}
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="mb-4 text-center text-sm text-slate-600">New to PillSync?</p>
              <Link
                to="/register"
                className="block text-center text-base font-semibold text-sky-700 transition hover:text-sky-800"
              >
                Create your account
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Demo access</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Secure
                </span>
              </div>

              <div className="space-y-2.5">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => handleDemoLogin(cred.email, cred.password)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cred.role}</p>
                      <p className="text-xs text-slate-500">{cred.email}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Use
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
