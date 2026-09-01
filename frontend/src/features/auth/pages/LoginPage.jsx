import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Alert } from '../../../components/common';
import {
  Mail,
  Lock,
  ShieldCheck,
  Pill,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Activity,
  HeartPulse,
  User,
  Stethoscope,
  Shield,
} from 'lucide-react';
import { isValidEmail } from '../../../utils/validation';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error, setError, isAuthenticating } = useAuth();

  // Clean empty inputs by default (no hardcoded prefill)
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('patient');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
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
      await login(formData.email, formData.password, selectedRole);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const demoAccounts = [
    { role: 'patient', label: 'Patient', email: 'patient@example.com', password: 'password' },
    { role: 'caregiver', label: 'Caregiver', email: 'caregiver@example.com', password: 'password' },
    { role: 'admin', label: 'Admin', email: 'admin@example.com', password: 'password' },
  ];

  const handleSelectDemo = (account) => {
    setSelectedRole(account.role);
    setFormData({ email: account.email, password: account.password });
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Left Hero Panel */}
        <div className="login-hero-panel">
          <div className="login-hero-brand">
            <div className="login-hero-logo-box">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h1 className="login-hero-brand-title">PillSync</h1>
              <p className="login-hero-brand-tagline">Clinical Care Platform</p>
            </div>
          </div>

          <div className="login-hero-content">
            <div className="login-hero-badge">
              <Sparkles className="h-3.5 w-3.5" />
              Role-Based HIPAA Platform
            </div>
            <h2 className="login-hero-headline">Medication care that feels easy and reliable.</h2>
            <p className="login-hero-description">
              Comprehensive role-based access for Patients, Caregivers, and Clinical Administrators.
            </p>
          </div>

          <div className="login-hero-features">
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">
                Patient medication schedule & dose verification
              </span>
            </div>
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <Activity className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">
                Caregiver cohort adherence monitoring & nudges
              </span>
            </div>
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">
                Admin platform metrics & compliance audit logs
              </span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">
              Select your role and enter your clinical credentials to access your portal
            </p>
          </div>

          {/* 3-Role Persona Selector Tabs */}
          <div className="login-role-selector-container">
            <span className="login-role-selector-label">Select Portal Role</span>
            <div className="login-role-tabs">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`login-role-tab ${selectedRole === 'patient' ? 'active' : ''}`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('caregiver')}
                className={`login-role-tab ${selectedRole === 'caregiver' ? 'active' : ''}`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Caregiver</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`login-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {error && (
            <Alert type="danger" message={error} onClose={() => setError(null)} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            {/* Email Field */}
            <div className="login-input-group">
              <label className="login-input-label" htmlFor="login-email">
                Email address <span>*</span>
              </label>
              <div className="login-input-box">
                <Mail className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`login-input-field ${validationErrors.email ? 'login-input-error' : ''}`}
                />
              </div>
              {validationErrors.email && (
                <p className="login-input-error-msg">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <label className="login-input-label" htmlFor="login-password">
                Password <span>*</span>
              </label>
              <div className="login-input-box">
                <Lock className="login-input-icon" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`login-input-field ${validationErrors.password ? 'login-input-error' : ''}`}
                />
              </div>
              {validationErrors.password && (
                <p className="login-input-error-msg">{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-form-options">
              <label className="login-remember-me" htmlFor="login-remember">
                <input id="login-remember" type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isAuthenticating} className="login-submit-btn">
              {isAuthenticating ? (
                <span>Authenticating with JWT...</span>
              ) : (
                <>
                  <span>
                    Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="login-register-link-box">
            <span>New to PillSync? </span>
            <Link to="/register">Create an account</Link>
          </div>

          {/* Quick Demo Credentials Preset Grid */}
          <div className="login-demo-box">
            <div className="login-demo-header">
              <span className="login-demo-title">Quick Demo Accounts</span>
              <span className="login-demo-badge">
                <ShieldCheck className="h-3 w-3" />
                JWT Auth
              </span>
            </div>

            <div className="login-demo-grid">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleSelectDemo(account)}
                  className="login-demo-card"
                  title={`Quick-fill ${account.label}`}
                >
                  <span className="login-demo-role">{account.label}</span>
                  <span className="login-demo-email">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
