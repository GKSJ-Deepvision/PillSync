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
} from 'lucide-react';
import './LoginPage.css';

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
    { role: 'Patient', email: 'patient@example.com', password: 'password', name: 'Ibrahim' },
    { role: 'Caregiver', email: 'caregiver@example.com', password: 'password', name: 'Dr. Oliver' },
    { role: 'Admin', email: 'admin@example.com', password: 'password', name: 'Sarah' },
  ];

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
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
              Trusted by Care Teams
            </div>
            <h2 className="login-hero-headline">
              Medication care that feels easy and reliable.
            </h2>
            <p className="login-hero-description">
              Keep every prescription, reminder, and patient adherence routine strictly on track with a calmer daily care plan.
            </p>
          </div>

          <div className="login-hero-features">
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">Real-time daily dose verification & reminders</span>
            </div>
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <Activity className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">Caregiver patient cohort oversight & nudges</span>
            </div>
            <div className="login-hero-feature-item">
              <div className="login-hero-feature-icon">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="login-hero-feature-text">Longitudinal adherence trend reports</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in to your account</h2>
            <p className="login-form-subtitle">
              Enter your clinical credentials to access your portal
            </p>
          </div>

          {error && (
            <Alert
              type="danger"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            {/* Email Field */}
            <div className="login-input-group">
              <label className="login-input-label">Email address *</label>
              <div className="login-input-box">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
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
              <label className="login-input-label">Password *</label>
              <div className="login-input-box">
                <Lock className="login-input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
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
              <label className="login-remember-me">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="login-submit-btn"
            >
              {isAuthenticating ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
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

          {/* Quick 1-Click Demo Logins */}
          <div className="login-demo-box">
            <div className="login-demo-header">
              <span className="login-demo-title">1-Click Demo Login</span>
              <span className="login-demo-badge">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            </div>

            <div className="login-demo-grid">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                  className="login-demo-card"
                  title={`Fill ${cred.role} credentials`}
                >
                  <span className="login-demo-role">{cred.role}</span>
                  <span className="login-demo-email">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
