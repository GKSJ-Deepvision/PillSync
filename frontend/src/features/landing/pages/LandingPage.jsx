import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  Plus,
  Bell,
  Check,
  CheckCircle2,
  Fingerprint,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { PillSyncIcon } from '../../../components/common';
import './LandingPage.css';

export function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('medications');
  const [gaugeValue, setGaugeValue] = useState(94);
  const [dosesChecked, setDosesChecked] = useState({ 1: true, 2: false });
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const toggleDose = (id) => {
    setDosesChecked((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      const allDone = updated[1] && updated[2];
      setGaugeValue(allDone ? 100 : 94);
      return updated;
    });
  };

  const handleCheckin = () => {
    setIsCheckedIn((prev) => {
      const next = !prev;
      if (next) {
        setGaugeValue(100);
        setDosesChecked({ 1: true, 2: true });
      } else {
        setGaugeValue(94);
        setDosesChecked({ 1: true, 2: false });
      }
      return next;
    });
  };

  return (
    <div className="koru-landing-root">
      {/* ── Top Navigation Bar ── */}
      <header className="koru-nav-container">
        <nav className="koru-nav-bar">
          <Link to="/" className="koru-brand">
            <div className="koru-brand-icon">
              <PillSyncIcon className="h-5 w-5 text-white" />
            </div>
            <div className="koru-brand-text">
              <span className="koru-brand-name">PillSync</span>
            </div>
          </Link>

          <div className="koru-nav-links">
            <a href="#features" className="koru-nav-link">
              Features
            </a>
            <a href="#showcase" className="koru-nav-link">
              Experience
            </a>
            <a href="#adherence" className="koru-nav-link">
              Adherence AI
            </a>
            <a href="#caregivers" className="koru-nav-link">
              Care Team
            </a>
          </div>

          <div className="koru-nav-actions">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="koru-profile-pill group flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-teal-200/90 hover:border-teal-400 hover:bg-teal-50/70 transition-all shadow-2xs cursor-pointer"
                  title="View Profile & Settings"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition-colors">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
                      Profile
                    </span>
                  </div>
                </Link>

                <Link
                  to={
                    user.role === 'caregiver'
                      ? '/caregiver/portal'
                      : user.role === 'admin'
                        ? '/admin/portal'
                        : '/patient/portal'
                  }
                  className="koru-btn-dark"
                >
                  <span>Go to Portal</span>
                  <div className="koru-btn-circle-arrow">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="koru-btn-ghost-nav">
                  Login
                </Link>
                <Link to="/register" className="koru-btn-dark">
                  <span>Sign Up</span>
                  <div className="koru-btn-circle-arrow">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero Section (2-Column Showcase) ── */}
      <section className="koru-hero-section">
        <div className="koru-hero-grid">
          {/* Left Column: Typography & CTAs */}
          <div className="koru-hero-content">
            <div className="koru-eyebrow-pill">
              <Sparkles className="h-3.5 w-3.5 text-[#3a9e90]" />
              <span>Intelligent Healthcare Platform</span>
            </div>

            <h1 className="koru-hero-title">
              Your Wellness
              <br />
              <span className="koru-title-accent">Companion</span>
            </h1>

            <div className="koru-tagline-strip">
              <span>Track</span>
              <span className="koru-dot">•</span>
              <span>Progress</span>
              <span className="koru-dot">•</span>
              <span>Communicate</span>
            </div>

            <p className="koru-hero-desc">
              Empowering your wellness journey: easily track medications, monitor adherence with
              clinical accuracy, and provide real-time feedback to your healthcare providers.
            </p>

            <div className="koru-hero-cta-row">
              <Link to="/register" className="koru-hero-primary-btn">
                <span>Sign Up</span>
                <div className="koru-btn-circle-arrow">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <Link to="/login" className="koru-hero-secondary-btn">
                <span>Login</span>
              </Link>
            </div>

            {/* Dedicated 3-Portal Entrances */}
            <div className="mt-6 pt-5 border-t border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Choose Sign In Portal
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/login?portal=patient"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold hover:bg-teal-100 transition shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-teal-600" />
                  Patient Portal
                </Link>
                <Link
                  to="/login?portal=caregiver"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold hover:bg-teal-100 transition shadow-xs"
                >
                  <Users className="h-3.5 w-3.5 text-teal-600" />
                  Caregiver Portal
                </Link>
                <Link
                  to="/login?portal=admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-200 transition shadow-xs"
                >
                  <Fingerprint className="h-3.5 w-3.5 text-slate-600" />
                  Admin Portal
                </Link>
              </div>
            </div>

            {/* Quick Stats / Trust Signals */}
            <div className="koru-trust-bar">
              <div className="koru-trust-item">
                <span className="koru-trust-number">98.4%</span>
                <span className="koru-trust-label">On-Time Doses</span>
              </div>
              <div className="koru-trust-divider" />
              <div className="koru-trust-item">
                <span className="koru-trust-number">40K+</span>
                <span className="koru-trust-label">Daily Patients</span>
              </div>
              <div className="koru-trust-divider" />
              <div className="koru-trust-item">
                <span className="koru-trust-number">HIPAA</span>
                <span className="koru-trust-label">Verified Security</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive KORU App Showcase */}
          <div className="koru-showcase-column" id="showcase">
            <div className="koru-phone-frame">
              {/* Phone Header */}
              <div className="koru-app-header">
                <div>
                  <h3 className="koru-welcome-heading">
                    {user?.name ? `Welcome ${user.name}.` : 'Welcome to PillSync.'}
                  </h3>
                  <p className="koru-welcome-sub">
                    {user
                      ? 'Your daily adherence streak is active! Keep it up!'
                      : 'Smart scheduled reminders & on-time intake.'}
                  </p>
                </div>
                <div className="koru-app-header-icons">
                  <Link to="/notifications" className="koru-icon-btn" aria-label="Notifications">
                    <Bell className="h-4 w-4 text-[#2d4b43]" />
                  </Link>
                </div>
              </div>

              {/* 7-Day Habit Circle Strip */}
              <div className="koru-week-strip">
                {[
                  { day: 14, done: true, today: false },
                  { day: 15, done: true, today: false },
                  { day: 16, done: true, today: false },
                  {
                    day: 17,
                    done: isCheckedIn || (dosesChecked[1] && dosesChecked[2]),
                    today: true,
                  },
                  { day: 18, done: false, today: false },
                  { day: 19, done: false, today: false },
                  { day: 20, done: false, today: false },
                ].map((d) => (
                  <div key={d.day} className={`koru-day-col ${d.today ? 'active-today' : ''}`}>
                    <div className={`koru-check-slot ${d.done ? 'checked' : ''}`}>
                      {d.done ? <Check className="h-2.5 w-2.5 text-white" /> : null}
                    </div>
                    <div
                      className={`koru-day-circle ${d.today ? 'is-today' : ''} ${!d.done && !d.today ? 'is-future' : ''}`}
                    >
                      {d.day}
                    </div>
                  </div>
                ))}
              </div>

              {/* Never Miss Reminder Card */}
              <div className="koru-reminder-banner">
                <div className="koru-reminder-text">
                  <h4>Never miss your medications.</h4>
                  <p>
                    {isCheckedIn
                      ? 'Daily check-in recorded! Streak active.'
                      : 'Smart scheduled reminders'}
                  </p>
                </div>
                <button
                  type="button"
                  className={`koru-checkin-btn transition-all duration-200 cursor-pointer ${
                    isCheckedIn ? 'bg-[#215a51] text-white' : ''
                  }`}
                  onClick={handleCheckin}
                  title="Click to check-in"
                >
                  {isCheckedIn ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span className="font-bold text-white">Checked In</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 text-[#3a9e90]" />
                      <span>Check-in</span>
                    </>
                  )}
                </button>
              </div>

              {/* Today's To Do Section */}
              <div className="koru-todo-section">
                <div className="koru-todo-header">
                  <h4 className="koru-todo-title">Today's To Do</h4>
                  <Link to="/register" className="koru-todo-add-btn">
                    <Plus className="h-3 w-3" />
                    <span>Log Activity</span>
                  </Link>
                </div>

                {/* Filter Tabs */}
                <div className="koru-tabs-row">
                  <button
                    className={`koru-tab ${activeTab === 'medications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medications')}
                  >
                    Medications <span className="koru-tab-count">4</span>
                  </button>
                  <button
                    className={`koru-tab ${activeTab === 'education' ? 'active' : ''}`}
                    onClick={() => setActiveTab('education')}
                  >
                    Education <span className="koru-tab-count">2</span>
                  </button>
                  <button
                    className={`koru-tab ${activeTab === 'checkin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('checkin')}
                  >
                    Check-in{' '}
                    <span
                      className={`koru-tab-count ${isCheckedIn ? 'bg-emerald-600 text-white' : 'red'}`}
                    >
                      {isCheckedIn ? '0' : '1'}
                    </span>
                  </button>
                </div>

                {/* Active Tab Content */}
                {activeTab === 'education' ? (
                  <div className="koru-cards-stack space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-teal-100 text-xs">
                      <div className="flex items-center gap-2 font-bold text-teal-800 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                        Blood Sugar Optimization
                      </div>
                      <p className="text-slate-600 m-0">
                        Always take Metformin with meals to maintain consistent glucose regulation
                        and avoid stomach discomfort.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-teal-100 text-xs">
                      <div className="flex items-center gap-2 font-bold text-teal-800 mb-1">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        Blood Pressure Timing
                      </div>
                      <p className="text-slate-600 m-0">
                        Take Lisinopril consistently at 8:00 AM each morning for optimal 24-hour
                        cardiovascular protection.
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'checkin' ? (
                  <div className="koru-cards-stack">
                    <div className="p-3.5 bg-white rounded-xl border border-teal-200 text-xs text-center space-y-2.5">
                      <div className="flex justify-center">
                        <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                          {isCheckedIn ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          ) : (
                            <Fingerprint className="h-6 w-6 text-teal-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 m-0 text-sm">
                          {isCheckedIn ? 'Check-in Completed!' : 'Daily Wellness Check-in'}
                        </h5>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                          {isCheckedIn
                            ? 'Your adherence streak is 14 days and doses are up to date.'
                            : 'Confirm you have taken today’s scheduled doses to keep your streak.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckin}
                        className={`w-full py-2 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs ${
                          isCheckedIn
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-teal-700 text-white hover:bg-teal-800'
                        }`}
                      >
                        {isCheckedIn ? 'Reset Check-in' : 'Confirm Check-in Now'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Medication Cards */
                  <div className="koru-cards-stack">
                    <div className={`koru-med-item ${dosesChecked[1] ? 'taken' : ''}`}>
                      <div className="koru-med-info">
                        <h5 className="koru-med-name">Metformin 500mg</h5>
                        <p className="koru-med-sub">Daily • 2 doses • Morning &amp; Night</p>
                        <div className="koru-med-tags">
                          <span className="koru-med-tag">Blood Sugar</span>
                          <span className="koru-med-tag">With Food</span>
                        </div>
                      </div>
                      <button
                        className={`koru-med-check ${dosesChecked[1] ? 'done' : ''}`}
                        onClick={() => toggleDose(1)}
                        aria-label="Check Metformin"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>

                    <div className={`koru-med-item ${dosesChecked[2] ? 'taken' : ''}`}>
                      <div className="koru-med-info">
                        <h5 className="koru-med-name">Lisinopril 10mg</h5>
                        <p className="koru-med-sub">Daily • 1 dose • Morning</p>
                        <div className="koru-med-tags">
                          <span className="koru-med-tag">Hypertension</span>
                          <span className="koru-med-tag">8:00 AM</span>
                        </div>
                      </div>
                      <button
                        className={`koru-med-check ${dosesChecked[2] ? 'done' : ''}`}
                        onClick={() => toggleDose(2)}
                        aria-label="Check Lisinopril"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Arched Adherence Gauge Widget (from Screen 4) */}
                <div className="koru-gauge-card">
                  <div className="koru-gauge-header">
                    <span>Clinical Adherence Score</span>
                    <span className="koru-gauge-percent">{gaugeValue}%</span>
                  </div>
                  <div className="koru-gauge-bar">
                    <div className="koru-gauge-fill" style={{ width: `${gaugeValue}%` }} />
                  </div>
                  <div className="koru-gauge-footer">
                    <span>🟢 High Consistency</span>
                    <span>14-day streak 🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights (Clean Pastel Cards) ── */}
      <section className="koru-features-section" id="features">
        <div className="koru-section-head">
          <span className="koru-section-pill">Clinical Capabilities</span>
          <h2 className="koru-section-title">Designed for Everyday Adherence</h2>
          <p className="koru-section-sub">
            Built from clinical research to eliminate missed doses, predict refills, and keep family
            caregivers informed.
          </p>
        </div>

        <div className="koru-features-grid">
          <div className="koru-feature-card">
            <div className="koru-feature-icon-box teal">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="koru-feature-card-title">Smart Dose Windows</h3>
            <p className="koru-feature-card-desc">
              Organized into Morning, Afternoon, and Night windows with gentle snooze cycles and
              caregiver alerts on missed doses.
            </p>
          </div>

          <div className="koru-feature-card">
            <div className="koru-feature-icon-box mint">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="koru-feature-card-title">AI Prescription OCR</h3>
            <p className="koru-feature-card-desc">
              Snap a picture of your prescription label or paper script. Optical character
              recognition automatically extracts medicine names and dosages.
            </p>
          </div>

          <div className="koru-feature-card">
            <div className="koru-feature-icon-box sage">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="koru-feature-card-title">AI Refill Predictor</h3>
            <p className="koru-feature-card-desc">
              Computes daily consumption and predicts exact runout dates, alerting pharmacies and
              family 5 days before stock runs dry.
            </p>
          </div>

          <div className="koru-feature-card">
            <div className="koru-feature-icon-box dark">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="koru-feature-card-title">Caregiver Coordination</h3>
            <p className="koru-feature-card-desc">
              Dedicated views for family members and healthcare workers with live adherence status,
              message chat, and vital tracking.
            </p>
          </div>
        </div>
      </section>

      {/* ── Adherence AI Section ── */}
      <section className="koru-features-section" id="adherence">
        <div className="koru-section-head">
          <span className="koru-section-pill">Adherence Intelligence</span>
          <h2 className="koru-section-title">AI-Powered Adherence Analytics</h2>
          <p className="koru-section-sub">
            Continuous compliance tracking, vital indicators, and streak reinforcement powered by
            clinical protocol modeling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-8">
          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Adherence Scoring</h3>
            <p className="text-sm text-slate-600">
              Continuously measures doses taken on schedule versus delayed or missed doses,
              calculating your true clinical consistency percentage.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Habit Streak Reinforcement</h3>
            <p className="text-sm text-slate-600">
              Visual daily habit circles and check-in milestones proven to improve long-term chronic
              treatment compliance by over 40%.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">One-Click Clinical Reports</h3>
            <p className="text-sm text-slate-600">
              Export downloadable, HIPAA-compliant CSV reports detailing your 30-day compliance
              logs, ready to share with your physician.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to={user ? '/adherence' : '/login'}
            className="koru-btn-dark inline-flex items-center gap-2"
          >
            <span>{user ? 'Open Adherence Analytics' : 'Sign In to View Adherence'}</span>
            <div className="koru-btn-circle-arrow">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── Care Team Coordination Section ── */}
      <section className="koru-features-section" id="caregivers">
        <div className="koru-section-head">
          <span className="koru-section-pill">Caregiver &amp; Clinical Portal</span>
          <h2 className="koru-section-title">Care Team Coordination</h2>
          <p className="koru-section-sub">
            Keep family members, nurses, and clinicians connected with live dose updates, emergency
            missed-dose alerts, and triage queues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-8">
          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Monitored Cohort Roster</h3>
            <p className="text-sm text-slate-600">
              Caregivers can monitor multiple family members or patients at once with live daily
              dose timelines and risk flags.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Dose Nudges</h3>
            <p className="text-sm text-slate-600">
              If an intake window passes without confirmation, caregivers can dispatch gentle
              one-click SMS and in-app reminder nudges.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#d6ede7] shadow-xs hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Two-Way Messaging</h3>
            <p className="text-sm text-slate-600">
              Threaded clinical inquiries and symptom notes directly between patient and care
              provider, keeping everyone synchronized.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to={
              user?.role === 'caregiver'
                ? '/caregiver/portal'
                : user?.role === 'admin'
                  ? '/admin/portal'
                  : '/login?portal=caregiver'
            }
            className="koru-btn-dark inline-flex items-center gap-2"
          >
            <span>
              {user?.role === 'caregiver' ? 'Open Caregiver Portal' : 'Access Care Team Portal'}
            </span>
            <div className="koru-btn-circle-arrow">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── Call To Action Banner ── */}
      <section className="koru-cta-section">
        <div className="koru-cta-card">
          <div className="koru-cta-content">
            <h2 className="koru-cta-heading">Ready to transform your wellness routine?</h2>
            <p className="koru-cta-sub">
              Join thousands of patients and caregivers who never miss a life-critical dose.
            </p>
            <div className="koru-cta-actions">
              <Link to="/register" className="koru-btn-dark large">
                <span>Start Free Account</span>
                <div className="koru-btn-circle-arrow">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
              <Link to="/login" className="koru-btn-ghost-dark">
                <span>Sign In to Existing Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="koru-footer">
        <div className="koru-footer-inner">
          <div className="koru-footer-brand">
            <div className="koru-brand-icon small">
              <PillSyncIcon className="h-4 w-4 text-white" />
            </div>
            <span className="koru-footer-title">PillSync</span>
            <span className="koru-footer-copy">
              · Intelligent Medicine Reminder &amp; Medication Tracking Platform
            </span>
          </div>
          <div className="koru-footer-note">
            <span>Intelligent Clinical Health Platform · HIPAA &amp; GDPR Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
