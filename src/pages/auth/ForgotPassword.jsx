import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { MailCheck } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccess(res.message || 'We sent you an email with password recovery details.');
    } catch (err) {
      setError(err.message || 'No account registered with this email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-400 mt-1.5">Enter your email and we will send a recovery link</p>
      </div>

      {success ? (
        <div className="text-center space-y-4 py-4 animate-fade-in" data-testid="success-state">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-emerald-100">
            <MailCheck className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Check Your Inbox</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {success}
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
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

          <ErrorMessage message={error} onDismiss={() => setError('')} />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            loading={loading}
          >
            Send Recovery Link
          </Button>

          <div className="text-center text-xs mt-4">
            <Link
              to="/login"
              className="text-slate-400 hover:text-slate-600 font-semibold transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
