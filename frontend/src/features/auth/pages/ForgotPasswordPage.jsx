import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Alert } from '../../../components/common';
import { Mail, Pill, ArrowRight, CheckCircle2 } from 'lucide-react';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const { forgotPassword, error, setError, isAuthenticating } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    if (!email) {
      setValidationError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Email is invalid');
      return;
    }

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password failed:', err);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-page-wrapper">
        <div className="forgot-card-container text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="forgot-title">Check your email</h2>
          <p className="forgot-subtitle">
            We've sent password reset instructions to <strong className="text-slate-900">{email}</strong>
          </p>

          <Link
            to="/login"
            className="forgot-submit-btn mt-6 inline-flex"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-page-wrapper">
      <div className="forgot-card-container">
        <div className="forgot-header">
          <div className="forgot-logo-box">
            <Pill className="h-6 w-6" />
          </div>
          <h1 className="forgot-title">Reset your password</h1>
          <p className="forgot-subtitle">
            Enter your verified clinical email address to receive password recovery instructions.
          </p>
        </div>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError(null)} className="mb-4" />
        )}

        <form onSubmit={handleSubmit} className="forgot-form">
          <div className="forgot-input-group">
            <label className="forgot-input-label">
              Email address <span>*</span>
            </label>
            <div className="forgot-input-box">
              <Mail className="forgot-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`forgot-input-field ${validationError ? 'forgot-input-error' : ''}`}
              />
            </div>
            {validationError && (
              <p className="forgot-input-error-msg">{validationError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="forgot-submit-btn"
          >
            {isAuthenticating ? (
              <span>Sending reset link...</span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="forgot-footer-box">
          <span>Remember your password? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
