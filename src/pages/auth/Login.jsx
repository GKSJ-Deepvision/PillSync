import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const validateForm = () => {
    if (!email) {
      setError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-400 mt-1.5">Sign in to sync your medication and schedule</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="yourname@pillsync.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <div className="flex items-center justify-between text-xs mt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-500 font-semibold select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            Remember Me
          </label>
          <Link
            to="/forgot-password"
            className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-500">
        New to PillSync?{' '}
        <Link
          to="/register"
          className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
        >
          Create account
        </Link>
      </div>
      
      {/* Testing helper utility widget */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-450 leading-relaxed">
        <span className="font-bold text-slate-700">Testing Credentials (Password: password123):</span>
        <ul className="list-disc pl-4 mt-1.5 space-y-1">
          <li>Patient: <code className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">patient@pillsync.com</code></li>
          <li>Caregiver: <code className="font-bold text-violet-600 bg-violet-50 px-1 rounded">caregiver@pillsync.com</code></li>
          <li>Admin: <code className="font-bold text-rose-600 bg-rose-50 px-1 rounded">admin@pillsync.com</code></li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
