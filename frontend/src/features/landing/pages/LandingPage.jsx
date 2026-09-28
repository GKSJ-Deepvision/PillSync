import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Pill, Sparkles, ArrowRight, Clock, Users, HeartPulse } from 'lucide-react';
import './LandingPage.css';

const TYPING_PHRASES = [
  'Welcome to PillSync.',
  'Smart Medicine Reminders.',
  'Daily Adherence & Health Tracking.',
  'Caregiver & Patient Coordination.',
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPING_PHRASES[phraseIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(currentPhrase.substring(0, text.length + 1));
        if (text.length + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setText(currentPhrase.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, phraseIndex]);

  return (
    <div className="landing-root">
      {/* Glowing Ambient Background */}
      <div className="landing-glow-orb-1" />
      <div className="landing-glow-orb-2" />

      {/* Top Navbar */}
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <div className="landing-logo-icon">
            <Pill className="h-6 w-6" />
          </div>
          <span className="landing-brand-text">PillSync</span>
        </Link>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="landing-get-started-btn">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-signin-link">
                Sign In
              </Link>
              <Link to="/register" className="landing-get-started-btn">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-tag-pill">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Intelligent Healthcare SaaS Platform</span>
        </div>

        <div className="landing-title-container">
          <h1 className="landing-title">
            {text}
            <span className="landing-typing-cursor">|</span>
          </h1>
        </div>

        <p className="landing-description">
          Personalized dose reminders, verified clinical adherence tracking, biometric health vitals
          correlation, and direct caregiver coordination—engineered for modern healthcare.
        </p>

        <div className="landing-cta-group">
          <Link to="/login" className="landing-primary-cta">
            <span>Enter PillSync Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/register" className="landing-secondary-cta">
            <span>Create New Account</span>
          </Link>
        </div>

        {/* 3 Value Proposition Cards */}
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon-box purple">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="landing-feature-title">Smart Dose Reminders</h3>
            <p className="landing-feature-desc">
              Intelligent scheduling with 30-min snooze, missed alerts, and multi-channel
              notifications.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon-box emerald">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h3 className="landing-feature-title">Daily Health Tracking</h3>
            <p className="landing-feature-desc">
              Correlates daily adherence with blood pressure and glycemic stability in real-time.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon-box amber">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="landing-feature-title">Role-Based Coordination</h3>
            <p className="landing-feature-desc">
              Tailored experiences for Patients, Caregivers, and Clinical Administrators with
              HIPAA-grade JWT security.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          © 2026 PillSync. Intelligent Medication Tracking & Clinical Reminder System. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
