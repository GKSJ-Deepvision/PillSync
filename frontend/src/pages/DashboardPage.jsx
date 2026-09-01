//import React, { useState } from 'react';
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
//import { useNavigate, Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Badge } from '../components/common/Badge';
//import { Button } from '../components/common/Button';
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
  // const navigate = useNavigate();
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [doses, setDoses] = useState(INITIAL_DOSES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'doctor',
      text: 'Good morning Ibrahim! Your adherence is at 94% this week. Keep up the morning routine!',
    },
    {
      id: 2,
      sender: 'patient',
      text: 'Thank you Dr. Oliver. Just took my Metformin and Lisinopril on time.',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const currentPatient = PATIENTS[selectedPatientIndex];
  const isCaregiverOrAdmin = user?.role === 'caregiver' || user?.role === 'admin';

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
    const newMsg = {
      id: Date.now(),
      sender: user?.role === 'caregiver' || user?.role === 'admin' ? 'doctor' : 'patient',
      text: inputMsg,
    };
    setChatMessages([...chatMessages, newMsg]);
    setInputMsg('');
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
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Care Plan Active
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="dashboard-greeting-title">
              Welcome back, {isCaregiverOrAdmin ? user?.name || 'Oliver' : currentPatient.name}
            </h1>
            <p className="dashboard-greeting-subtitle">
              Here is your daily medication schedule, clinical adherence progress, and health tasks.
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
                  <div key={task.id} onClick={() => toggleTask(task.id)} className="task-check-row">
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
                  </div>
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
