import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Badge } from '../components/common/Badge';
import {
  Pill,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Send,
  Sparkles,
  Users,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getChatbotResponse } from '../utils/chatbotEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './DashboardPage.css';

const PATIENTS = [
  {
    id: 'p1',
    name: 'Ibrahim Kadri',
    age: 54,
    condition: 'Type 2 Diabetes & Hypertension',
    adherence: 94,
    totalMeds: 4,
    todayDoses: 6,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'p2',
    name: 'Sarah Connor',
    age: 48,
    condition: 'Cardiac Arrhythmia & High Cholesterol',
    adherence: 64,
    totalMeds: 5,
    todayDoses: 8,
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'p3',
    name: 'Michael Chang',
    age: 62,
    condition: 'Hypothyroidism',
    adherence: 82,
    totalMeds: 3,
    todayDoses: 4,
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

const WEEKLY_ADHERENCE = [
  { day: 'Mon', score: 90, target: 80 },
  { day: 'Tue', score: 100, target: 80 },
  { day: 'Wed', score: 85, target: 80 },
  { day: 'Thu', score: 95, target: 80 },
  { day: 'Fri', score: 75, target: 80 },
  { day: 'Sat', score: 100, target: 80 },
  { day: 'Sun', score: 92, target: 80 },
];

const INITIAL_DOSES = [
  {
    id: 1,
    time: '08:00 AM',
    window: 'Morning',
    med: 'Metformin 500mg',
    instruction: '1 tablet after breakfast',
    status: 'taken',
  },
  {
    id: 2,
    time: '08:00 AM',
    window: 'Morning',
    med: 'Lisinopril 10mg',
    instruction: '1 tablet with full glass of water',
    status: 'taken',
  },
  {
    id: 3,
    time: '01:00 PM',
    window: 'Afternoon',
    med: 'Vitamin D3 2000 IU',
    instruction: '1 softgel with lunch',
    status: 'upcoming',
  },
  {
    id: 4,
    time: '08:30 PM',
    window: 'Evening',
    med: 'Atorvastatin 20mg',
    instruction: '1 tablet before bed',
    status: 'upcoming',
  },
  {
    id: 5,
    time: '10:00 PM',
    window: 'Night',
    med: 'Melatonin 3mg',
    instruction: '30 mins before sleep',
    status: 'upcoming',
  },
];

const INITIAL_TASKS = [
  { id: 1, text: 'Log Blood Pressure Reading (Morning)', done: true },
  { id: 2, text: 'Post-Lunch 20-min Light Walk', done: true },
  { id: 3, text: 'Hydration Check: 2.5L Water Target', done: false },
  { id: 4, text: 'Log Evening Glucose Level', done: false },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [doses, setDoses] = useState(INITIAL_DOSES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'doctor',
      text: 'Good morning! Your adherence is at 94% this week. Keep up the consistent morning routine!',
    },
    {
      id: 2,
      sender: 'patient',
      text: 'Thank you Dr. Oliver. Just took my Metformin and Lisinopril on schedule.',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPatient = PATIENTS[selectedPatientIndex];
  const userRole = user?.role || 'patient';
  const isCaregiverOrAdmin = userRole === 'caregiver' || userRole === 'admin';

  const getDefaultName = () => {
    if (userRole === 'caregiver') return 'Dr. Oliver Mitchell';
    if (userRole === 'admin') return 'Sarah Jenkins';
    return 'Ibrahim Kadri';
  };

  const loggedInName = user?.name || getDefaultName();

  const assignedCaregiver = 'Dr. Oliver Mitchell';
  const assignedAdmin = 'Sarah Jenkins';

  const getGreetingWord = () => {
    const hr = currentDateTime.getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTakeDose = (id) => {
    setDoses(doses.map((d) => (d.id === id ? { ...d, status: 'taken' } : d)));
  };

  const handleSnoozeDose = (id) => {
    setDoses(doses.map((d) => (d.id === id ? { ...d, status: 'snoozed' } : d)));
    alert('Dose snoozed for 30 minutes. A push reminder will sound.');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const userText = inputMsg.trim();
    const isCaregiverSender = userRole === 'caregiver' || userRole === 'admin';
    const newMsg = {
      id: Date.now(),
      sender: isCaregiverSender ? 'doctor' : 'patient',
      text: userText,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // If patient asked a question, trigger intelligent care bot reply from knowledge base
    if (!isCaregiverSender) {
      setTimeout(() => {
        const reply = getChatbotResponse(userText);
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'doctor',
            text: reply,
          },
        ]);
      }, 500);
    }
  };

  const takenCount = doses.filter((d) => d.status === 'taken').length;

  return (
    <Layout>
      <div className="dashboard-root">
        {/* Caregiver & Admin Patient Selector Bar */}
        {isCaregiverOrAdmin && (
          <div className="dashboard-patient-selector-bar">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950">Caregiver Oversight: </span>
                <span className="text-xs font-medium text-slate-600">
                  Monitoring cohort patient:
                </span>
              </div>
              <select
                value={selectedPatientIndex}
                onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
                className="rounded-xl border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {PATIENTS.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name} · {p.condition} (Adherence: {p.adherence}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="primary" size="xs">
                Live Patient Feed
              </Badge>
            </div>
          </div>
        )}

        {/* 1. Header Banner */}
        <div className="dashboard-header-banner">
          <div>
            <div className="dashboard-badge-container">
              <span className="dashboard-care-plan-badge">
                <Sparkles className="dashboard-badge-icon" />
                <span>Care Plan Active</span>
              </span>
              <span className="dashboard-date-text">
                {currentDateTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="dashboard-live-clock-badge">
                <span className="dashboard-live-dot" />
                <span>
                  {currentDateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </span>
            </div>
            <h1 className="dashboard-greeting-title">
              {getGreetingWord()}, {loggedInName}
            </h1>
            <p className="dashboard-greeting-subtitle">
              {userRole === 'patient' &&
                `Your Care Plan is managed by ${assignedCaregiver} · Platform Administrator: ${assignedAdmin}`}
              {userRole === 'caregiver' &&
                `Caregiver & Lead Clinician · Managing Cohort of 3 Patients · Supervised by ${assignedAdmin}`}
              {userRole === 'admin' &&
                `Platform Administrator & HIPAA Compliance Officer · Lead Caregiver: ${assignedCaregiver}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/medications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Link>
          </div>
        </div>

        {/* Clinical Care Team & Identity Directory Strip */}
        <div className="dashboard-care-team-strip">
          <div className="dashboard-team-card">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
              }
              alt={loggedInName}
              className="dashboard-team-avatar"
            />
            <div>
              <p className="dashboard-team-role-label text-indigo-600">Active User ({userRole})</p>
              <p className="dashboard-team-name">{loggedInName}</p>
              <p className="dashboard-team-meta">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <div className="dashboard-team-card">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Caregiver"
              className="dashboard-team-avatar"
            />
            <div>
              <p className="dashboard-team-role-label text-emerald-600">Assigned Caregiver</p>
              <p className="dashboard-team-name">{assignedCaregiver}</p>
              <p className="dashboard-team-meta">caregiver@example.com · Lead Physician</p>
            </div>
          </div>

          <div className="dashboard-team-card">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
              alt="Administrator"
              className="dashboard-team-avatar"
            />
            <div>
              <p className="dashboard-team-role-label text-violet-600">Platform Administrator</p>
              <p className="dashboard-team-name">{assignedAdmin}</p>
              <p className="dashboard-team-meta">admin@example.com · Compliance Officer</p>
            </div>
          </div>
        </div>

        {/* 2. Four Key Stat KPI Cards */}
        <div className="dashboard-kpi-grid">
          <div className="dashboard-kpi-card">
            <div>
              <p className="dashboard-kpi-label">Total Prescriptions</p>
              <p className="dashboard-kpi-value">{currentPatient.totalMeds}</p>
              <p className="dashboard-kpi-meta text-indigo-600 font-semibold">4 active regimens</p>
            </div>
            <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
              <Pill className="h-6 w-6" />
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div>
              <p className="dashboard-kpi-label">Today's Doses</p>
              <p className="dashboard-kpi-value">
                {takenCount} / {doses.length}
              </p>
              <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                {doses.length - takenCount} remaining today
              </p>
            </div>
            <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div>
              <p className="dashboard-kpi-label">7-Day Adherence</p>
              <p className="dashboard-kpi-value">{currentPatient.adherence}%</p>
              <p className="dashboard-kpi-meta text-emerald-600 font-semibold">+4.2% vs target</p>
            </div>
            <div className="dashboard-kpi-icon bg-violet-50 text-violet-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="dashboard-kpi-card">
            <div>
              <p className="dashboard-kpi-label">Refill Status</p>
              <p className="dashboard-kpi-value text-amber-600">1 Low</p>
              <p className="dashboard-kpi-meta text-amber-600 font-semibold">
                Metformin (4 days left)
              </p>
            </div>
            <div className="dashboard-kpi-icon bg-amber-50 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* 3. Main Dashboard 2-Column Grid */}
        <div className="dashboard-main-grid">
          {/* Left Column: Dose Schedule & Weekly Chart */}
          <div className="dashboard-card-section">
            {/* Today's Medication & Dose Schedule Timeline */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2 className="dashboard-panel-title">Today's Medication Timeline</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Log scheduled doses to maintain your verified clinical streak
                  </p>
                </div>
                <Badge variant="primary" size="xs">
                  {takenCount} of {doses.length} Completed
                </Badge>
              </div>

              <div className="dose-timeline-list">
                {doses.map((dose) => (
                  <div key={dose.id} className="dose-timeline-item">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="dose-timing-badge">
                            <Clock className="h-3 w-3" />
                            {dose.time} · {dose.window}
                          </span>
                          {dose.status === 'taken' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Taken
                            </span>
                          )}
                          {dose.status === 'snoozed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                              <Clock className="h-3.5 w-3.5" /> Snoozed (+30m)
                            </span>
                          )}
                        </div>
                        <h3 className="dose-med-title">{dose.med}</h3>
                        <p className="dose-med-instruction">{dose.instruction}</p>
                      </div>
                    </div>

                    <div className="dose-action-buttons">
                      {dose.status === 'taken' ? (
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          Completed ✓
                        </span>
                      ) : (
                        <>
                          <button onClick={() => handleTakeDose(dose.id)} className="dose-btn-take">
                            <CheckCircle2 className="h-4 w-4" />
                            Take Dose
                          </button>
                          <button
                            onClick={() => handleSnoozeDose(dose.id)}
                            className="dose-btn-snooze"
                          >
                            Snooze
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Adherence & Compliance Chart */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2 className="dashboard-panel-title">Weekly Adherence Trend</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily adherence performance vs 80% clinical baseline
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" /> Adherence %
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-300" /> Baseline
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={WEEKLY_ADHERENCE}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Adherence']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Tasks, Refill Alert & Care Team Messenger */}
          <div className="dashboard-card-section">
            {/* Daily Tasks Checklist */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">Daily Health Tasks</h2>
                <span className="text-xs font-bold text-indigo-600">
                  {tasks.filter((t) => t.done).length}/{tasks.length} Done
                </span>
              </div>

              <div className="task-checklist">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="task-check-row"
                  >
                    <span
                      className={`task-check-text ${
                        task.done ? 'task-check-text-done' : 'task-check-text-pending'
                      }`}
                    >
                      {task.text}
                    </span>

                    {task.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Low Stock / Refill Alert Banner */}
            <div className="dashboard-alert-banner">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-rose-900">Prescription Refill Warning</h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  <strong>Metformin 500mg</strong> has only 4 tablets remaining in your current
                  supply.
                </p>
                <button
                  onClick={() => alert('Refill request dispatched to City Health Pharmacy!')}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                >
                  Request 30-Day Refill Now
                </button>
              </div>
            </div>

            {/* Care Team Consultation Chat Widget */}
            <div className="care-chat-box">
              <div className="care-chat-header">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Dr. Oliver Mitchell"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Dr. Oliver Mitchell</h3>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      Lead Caregiver · Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => alert('Calling Dr. Oliver Mitchell at +1 (555) 019-2834...')}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
                    title="Call Doctor"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="care-chat-stream">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.sender === 'patient' ? 'care-bubble-patient' : 'care-bubble-doctor'
                    }
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="care-chat-input-row">
                <input
                  type="text"
                  placeholder="Message care team..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="care-chat-input"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
