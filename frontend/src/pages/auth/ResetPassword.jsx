import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!password) {
      setError('New Password is required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setError(token
      ? 'Password reset is not available in the current Django API. Please contact an administrator.'
      : 'No password reset token was provided.');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400 mt-1.5">Enter a strong, secure new password</p>
      </div>

      {success ? (
        <div className="text-center space-y-4 py-4 animate-fade-in" data-testid="success-state">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-emerald-100">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Password Updated</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {success}
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            id="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled
          />

          <Input
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled
          />

          <ErrorMessage message={error} onDismiss={() => setError('')} />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled
          >
            Reset Password Unavailable
          </Button>

          <div className="text-center text-xs mt-4">
            <Link
              to="/login"
              className="text-slate-400 hover:text-slate-655 font-semibold transition-colors"
            >
              Cancel and Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
