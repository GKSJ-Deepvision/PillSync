import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Alert, PillSyncIcon } from '../../../components/common';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Stethoscope, Shield } from 'lucide-react';
import { isValidEmail } from '../../../utils/validation';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [error, setError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const initialPortal = searchParams.get('portal');
  const wasAdminAttempted = initialPortal === 'admin';
  const [selectedRole, setSelectedRole] = useState(
    initialPortal === 'caregiver' ? 'caregiver' : 'patient'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Full name is required';
    if (!formData.email) errors.email = 'Email address is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirmation password is required';
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
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

    setIsAuthenticating(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      });
      if (selectedRole === 'caregiver') {
        navigate('/caregiver/portal');
      } else if (selectedRole === 'admin') {
        navigate('/admin/portal');
      } else {
        navigate('/patient/portal');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card-container">
        <div className="register-header">
          <div className="register-logo-box">
            <PillSyncIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="register-title">Create your account</h1>
          <p className="register-subtitle">
            Join PillSync with role-based clinical privileges and smart medication workflows.
          </p>
          <div className="register-security-badge">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure HIPAA-Ready Sign-up</span>
          </div>
        </div>

        {wasAdminAttempted && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Admin Portal has <strong>Sign In only</strong>. Self-registration is restricted.
              </span>
            </div>
            <Link
              to="/login?portal=admin"
              className="font-bold underline text-amber-800 hover:text-amber-950"
            >
              Sign In as Admin
            </Link>
          </div>
        )}

        {error && (
          <Alert type="danger" message={error} onClose={() => setError(null)} className="mb-4" />
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Role Selection */}
          <div className="register-role-section">
            <span className="register-role-label">Choose Account Type</span>
            <div
              className="register-role-grid"
              style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`register-role-card ${selectedRole === 'patient' ? 'active' : ''}`}
              >
                <User className="h-5 w-5 text-indigo-600" />
                <span className="register-role-card-title">Patient</span>
                <span className="register-role-card-desc">Personal Doses &amp; Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('caregiver')}
                className={`register-role-card ${selectedRole === 'caregiver' ? 'active' : ''}`}
              >
                <Stethoscope className="h-5 w-5 text-indigo-600" />
                <span className="register-role-card-title">Caregiver</span>
                <span className="register-role-card-desc">Manage Patient Cohorts</span>
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Admin portal is restricted to Sign In only.</span>
              </div>
              <Link
                to="/login?portal=admin"
                className="font-semibold text-teal-700 underline hover:text-teal-900"
              >
                Admin Sign In &rarr;
              </Link>
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-input-label" htmlFor="register-name">
              Full Name <span>*</span>
            </label>
            <div className="register-input-box">
              <User className="register-input-icon" />
              <input
                id="register-name"
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={`register-input-field ${validationErrors.name ? 'register-input-error' : ''}`}
              />
            </div>
            {validationErrors.name && (
              <p className="register-input-error-msg">{validationErrors.name}</p>
            )}
          </div>

          <div className="register-input-group">
            <label className="register-input-label" htmlFor="register-email">
              Email Address <span>*</span>
            </label>
            <div className="register-input-box">
              <Mail className="register-input-icon" />
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`register-input-field ${validationErrors.email ? 'register-input-error' : ''}`}
              />
            </div>
            {validationErrors.email && (
              <p className="register-input-error-msg">{validationErrors.email}</p>
            )}
          </div>

          <div className="register-input-group">
            <label className="register-input-label" htmlFor="register-password">
              Password <span>*</span>
            </label>
            <div className="register-input-box">
              <Lock className="register-input-icon" />
              <input
                id="register-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={`register-input-field ${validationErrors.password ? 'register-input-error' : ''}`}
              />
            </div>
            {validationErrors.password && (
              <p className="register-input-error-msg">{validationErrors.password}</p>
            )}
          </div>

          <div className="register-input-group">
            <label className="register-input-label" htmlFor="register-confirm-password">
              Confirm Password <span>*</span>
            </label>
            <div className="register-input-box">
              <Lock className="register-input-icon" />
              <input
                id="register-confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className={`register-input-field ${validationErrors.confirmPassword ? 'register-input-error' : ''}`}
              />
            </div>
            {validationErrors.confirmPassword && (
              <p className="register-input-error-msg">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <label className="register-terms-box" htmlFor="register-terms">
            <input id="register-terms" type="checkbox" defaultChecked required />
            <span>
              I agree to the{' '}
              <a href="#terms" className="register-terms-link">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="register-terms-link">
                Privacy Policy
              </a>
            </span>
          </label>

          <button type="submit" disabled={isAuthenticating} className="register-submit-btn">
            {isAuthenticating ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>
                  Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="register-footer-box">
          <span>Already have an account? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
