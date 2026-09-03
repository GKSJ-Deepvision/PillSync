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
  AlertCircle,
  Plus,
  Users,
  Shield,
  Activity,
  Server,
  Database,
  Eye,
  Bell,
  ArrowRight,
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
    lastMessage: 'Good morning Dr. Oliver! Glucose is 114 mg/dL today.',
    lastTime: '10m ago',
    status: 'Stable',
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
    lastMessage: 'Experienced slight dizziness after the morning Lisinopril dose.',
    lastTime: '1h ago',
    status: 'Needs Attention',
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
    lastMessage: 'Levothyroxine supply down to 4 tablets. Requesting refill.',
    lastTime: '3h ago',
    status: 'Refill Due',
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

const CAREGIVER_COHORT_TREND = [
  { day: 'Mon', adherence: 92, onTime: 18, missed: 1 },
  { day: 'Tue', adherence: 88, onTime: 17, missed: 2 },
  { day: 'Wed', adherence: 95, onTime: 19, missed: 0 },
  { day: 'Thu', adherence: 85, onTime: 16, missed: 3 },
  { day: 'Fri', adherence: 78, onTime: 15, missed: 4 },
  { day: 'Sat', adherence: 94, onTime: 18, missed: 1 },
  { day: 'Sun', adherence: 80, onTime: 16, missed: 2 },
];

const ADMIN_PLATFORM_DATA = [
  { day: 'Mon', activeUsers: 1320, ocrScans: 280, reminders: 3420 },
  { day: 'Tue', activeUsers: 1380, ocrScans: 310, reminders: 3580 },
  { day: 'Wed', activeUsers: 1410, ocrScans: 295, reminders: 3640 },
  { day: 'Thu', activeUsers: 1440, ocrScans: 340, reminders: 3790 },
  { day: 'Fri', activeUsers: 1465, ocrScans: 390, reminders: 3820 },
  { day: 'Sat', activeUsers: 1420, ocrScans: 210, reminders: 3500 },
  { day: 'Sun', activeUsers: 1480, ocrScans: 245, reminders: 3610 },
];

const INITIAL_DOSES = [
  {
    id: 1,
    time: '08:00 AM',
    window: 'Morning',
    med: 'Metformin 500mg',
    instruction: '1 tablet after breakfast',
    status: 'taken',
    patient: 'Ibrahim Kadri',
  },
  {
    id: 2,
    time: '08:00 AM',
    window: 'Morning',
    med: 'Lisinopril 10mg',
    instruction: '1 tablet with full glass of water',
    status: 'taken',
    patient: 'Ibrahim Kadri',
  },
  {
    id: 3,
    time: '08:00 AM',
    window: 'Morning',
    med: 'Lisinopril 20mg',
    instruction: '1 tablet after breakfast',
    status: 'missed',
    patient: 'Sarah Connor',
  },
  {
    id: 4,
    time: '01:00 PM',
    window: 'Afternoon',
    med: 'Vitamin D3 2000 IU',
    instruction: '1 softgel with lunch',
    status: 'upcoming',
    patient: 'Ibrahim Kadri',
  },
  {
    id: 5,
    time: '08:30 PM',
    window: 'Evening',
    med: 'Atorvastatin 20mg',
    instruction: '1 tablet before bed',
    status: 'upcoming',
    patient: 'Sarah Connor',
  },
  {
    id: 6,
    time: '09:00 PM',
    window: 'Night',
    med: 'Levothyroxine 50mcg',
    instruction: 'Before sleep on empty stomach',
    status: 'upcoming',
    patient: 'Michael Chang',
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

  const currentPatient = PATIENTS[0];
  const userRole = user?.role || 'patient';

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
    setDoses((prev) => prev.map((dose) => (dose.id === id ? { ...dose, status: 'taken' } : dose)));
  };

  const handleSnoozeDose = (id) => {
    setDoses((prev) =>
      prev.map((dose) => (dose.id === id ? { ...dose, status: 'snoozed' } : dose))
    );
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    const newMsg = {
      id: Date.now(),
      sender: 'patient',
      text: userText,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    setTimeout(() => {
      const botReplyText = getChatbotResponse(userText);
      const reply = {
        id: Date.now() + 1,
        sender: 'doctor',
        text: botReplyText,
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 600);
  };

  const patientDoses = doses.filter((d) => d.patient === 'Ibrahim Kadri');
  const takenCount = patientDoses.filter((d) => d.status === 'taken').length;

  return (
    <Layout>
      <div className="dashboard-root">
        {/* 1. Header & Greeting Banner */}
        <div className="dashboard-header-banner">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="dashboard-live-clock-badge">
                <span className="dashboard-live-dot" />
                {currentDateTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <Badge variant={userRole === 'admin' ? 'primary' : 'success'} size="sm">
                {userRole === 'admin'
                  ? 'Platform Administrator'
                  : userRole === 'caregiver'
                    ? 'Lead Caregiver & Clinician'
                    : 'Verified Patient Protocol'}
              </Badge>
            </div>
            <h1 className="dashboard-greeting-title">
              {getGreetingWord()}, {loggedInName}
            </h1>
            <p className="dashboard-greeting-subtitle">
              {userRole === 'patient' &&
                `Your Care Plan is supervised by ${assignedCaregiver} · Platform Administrator: ${assignedAdmin}`}
              {userRole === 'caregiver' &&
                `Active Clinical Oversight · 3 Monitored Patients in Cohort · System Admin: ${assignedAdmin}`}
              {userRole === 'admin' &&
                `Platform Overview & HIPAA Compliance Operations · Supervised by Lead Clinician ${assignedCaregiver}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'caregiver' ? (
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Users className="h-4 w-4" />
                View Assigned Patients
              </Link>
            ) : userRole === 'admin' ? (
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Users className="h-4 w-4" />
                Manage User Directory
              </Link>
            ) : (
              <Link
                to="/medications/new"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Link>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* A. CAREGIVER DASHBOARD VIEW                                               */}
        {/* ========================================================================= */}
        {userRole === 'caregiver' && (
          <>
            {/* 4 KPI Cards for Caregiver */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Assigned Cohort</p>
                  <p className="dashboard-kpi-value text-indigo-600">3 Patients</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    100% active monitoring
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Cohort Avg Adherence</p>
                  <p className="dashboard-kpi-value text-emerald-600">80.0%</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    +2.4% this week
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Critical Dose Alerts</p>
                  <p className="dashboard-kpi-value text-rose-600">2 Alerts</p>
                  <p className="dashboard-kpi-meta text-rose-600 font-semibold">
                    1 Missed dose · 1 High BP
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Refill Status</p>
                  <p className="dashboard-kpi-value text-amber-600">1 Due</p>
                  <p className="dashboard-kpi-meta text-amber-600 font-semibold">
                    Michael Chang (Levothyroxine)
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-amber-50 text-amber-600">
                  <Pill className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Caregiver 2-Column Main Section */}
            <div className="dashboard-main-grid">
              {/* Left Column: Cohort Weekly Analytics & Priority Action Queue */}
              <div className="dashboard-card-section">
                {/* Cohort Weekly Adherence Breakdown Chart */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">
                        Cohort Weekly Adherence & Compliance
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Aggregated 7-day intake accuracy across 3 assigned patients
                      </p>
                    </div>
                    <Badge variant="primary" size="xs">
                      Live Telemetry
                    </Badge>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={CAREGIVER_COHORT_TREND}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'Adherence %' ? `${value}%` : `${value} doses`,
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="adherence"
                          name="Adherence %"
                          fill="#4f46e5"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="onTime"
                          name="On-Time Doses"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary metric pills */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-indigo-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Cohort Avg</p>
                      <p className="text-sm font-black text-indigo-700 m-0">80.0%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        On-Time Doses
                      </p>
                      <p className="text-sm font-black text-emerald-600 m-0">119</p>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Missed Doses</p>
                      <p className="text-sm font-black text-rose-600 m-0">13</p>
                    </div>
                  </div>
                </div>

                {/* Priority Clinical Triage & Action Queue */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Clinical Priority & Triage Queue</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        High-priority escalations requiring caregiver authorization or follow-up
                      </p>
                    </div>
                    <Link
                      to="/reminders"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Dose Logs →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {/* Item 1: Missed Dose Alert */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition">
                      <div className="flex items-start gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                          alt="Sarah Connor"
                          className="h-9 w-9 rounded-full object-cover border border-rose-200 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 m-0">
                              Sarah Connor (48y)
                            </h4>
                            <Badge variant="danger" size="xs">
                              Missed Dose (3h overdue)
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 m-0 mt-0.5">
                            Lisinopril 20mg · Scheduled for 08:00 AM
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              'SMS Nudge sent to Sarah Connor: Please log your morning Lisinopril dose.'
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs"
                        >
                          <Bell className="h-3 w-3" />
                          Send Nudge
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            alert('Initiating direct call to Sarah Connor (+1 555-876-5432)...')
                          }
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          title="Call Patient"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Impending Supply Depletion */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition">
                      <div className="flex items-start gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                          alt="Michael Chang"
                          className="h-9 w-9 rounded-full object-cover border border-amber-200 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 m-0">
                              Michael Chang (62y)
                            </h4>
                            <Badge variant="warning" size="xs">
                              Refill Authorization
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 m-0 mt-0.5">
                            Levothyroxine 50mcg has only 4 days supply remaining
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            '30-Day Refill authorized for Michael Chang at City Health Pharmacy!'
                          )
                        }
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer shadow-2xs shrink-0"
                      >
                        Authorize Refill
                      </button>
                    </div>

                    {/* Item 3: Patient Inquiry */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition">
                      <div className="flex items-start gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                          alt="Ibrahim Kadri"
                          className="h-9 w-9 rounded-full object-cover border border-indigo-200 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 m-0">
                              Ibrahim Kadri (54y)
                            </h4>
                            <Badge variant="success" size="xs">
                              Vitals Reported
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 m-0 mt-0.5">
                            Fasting Glucose: 114 mg/dL · Blood Pressure: 122/78 mmHg
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg shrink-0">
                        In Target Range ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Today's Dose Execution Feed & Inquiries */}
              <div className="dashboard-card-section">
                {/* Today's Cohort Dose Execution Feed */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Today's Cohort Dose Timeline</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Live schedule across all 3 assigned patients
                      </p>
                    </div>
                    <Link
                      to="/reminders"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Full Log →
                    </Link>
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
                                {dose.time} · {dose.patient}
                              </span>
                              {dose.status === 'taken' && (
                                <Badge variant="success" size="xs">
                                  Taken on Time
                                </Badge>
                              )}
                              {dose.status === 'missed' && (
                                <Badge variant="danger" size="xs">
                                  Missed Alert
                                </Badge>
                              )}
                              {dose.status === 'upcoming' && (
                                <Badge variant="gray" size="xs">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                            <h3 className="dose-med-title">{dose.med}</h3>
                            <p className="dose-med-instruction">{dose.instruction}</p>
                          </div>
                        </div>

                        <div className="dose-action-buttons">
                          {dose.status === 'missed' ? (
                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  `Urgent SMS reminder dispatched to ${dose.patient} for ${dose.med}`
                                )
                              }
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                            >
                              Dispatch Alert
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">
                              {dose.status === 'taken' ? 'Logged ✓' : 'Scheduled'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Inquiries */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Recent Patient Inquiries</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Direct messages from assigned patients
                      </p>
                    </div>
                    <Link
                      to="/notifications"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Notifications ({PATIENTS.length})
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {PATIENTS.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{p.lastTime}</span>
                        </div>
                        <p className="text-xs text-slate-700 m-0 line-clamp-2 leading-relaxed">
                          "{p.lastMessage}"
                        </p>
                        <div className="mt-2.5 flex items-center justify-between">
                          <Badge
                            variant={
                              p.status === 'Stable'
                                ? 'success'
                                : p.status === 'Refill Due'
                                  ? 'warning'
                                  : 'danger'
                            }
                            size="xs"
                          >
                            {p.status}
                          </Badge>
                          <Link
                            to="/notifications"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            Reply <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Caregiver Actions */}
                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title mb-3">Clinical Oversight Tools</h2>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Broadcasting morning adherence reminder to all 3 monitored patients...'
                        )
                      }
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 font-bold text-xs transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-600" />
                        Broadcast Cohort Dose Reminder
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
                    </button>

                    <Link
                      to="/patients"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        Assigned Patients Directory
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/reminders"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        View Live Dose Compliance Logs
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/notifications"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-violet-600" />
                        Open Notifications Center
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* B. ADMIN PLATFORM OVERVIEW                                                */}
        {/* ========================================================================= */}
        {userRole === 'admin' && (
          <>
            {/* 4 KPI Cards for Admin Platform Overview */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Total Platform Users</p>
                  <p className="dashboard-kpi-value text-indigo-600">1,480</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    +12% growth this month
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Active Caregivers</p>
                  <p className="dashboard-kpi-value text-emerald-600">48</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    99.2% response rate
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <Shield className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">System API Uptime</p>
                  <p className="dashboard-kpi-value text-violet-600">99.98%</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    All services operational
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-violet-50 text-violet-600">
                  <Server className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">HIPAA Security Audit</p>
                  <p className="dashboard-kpi-value text-emerald-600">100%</p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    Zero security violations
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Admin Main 2-Column Section */}
            <div className="dashboard-main-grid">
              {/* Left Column: Platform Telemetry & Microservice Health */}
              <div className="dashboard-card-section">
                {/* Platform Telemetry Chart */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Platform Daily Ingestion & Traffic</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active daily sessions and OCR prescription transactions
                      </p>
                    </div>
                    <Badge variant="primary" size="xs">
                      Live Telemetry
                    </Badge>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ADMIN_PLATFORM_DATA}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="activeUsers"
                          name="Active Users"
                          fill="#4f46e5"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar
                          dataKey="ocrScans"
                          name="OCR Scans"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Infrastructure Status */}
                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title mb-3">Microservice Health Status</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <Database className="h-4 w-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">
                            PostgreSQL Cloud DB
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">12ms response latency</p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        Operational
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">Auth & JWT Gateway</p>
                          <p className="text-[10px] text-slate-500 m-0">99.99% uptime</p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        Operational
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <Eye className="h-4 w-4 text-violet-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">
                            Computer Vision OCR
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">Average scan 1.2s</p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        Operational
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 m-0">
                            SMS / Push Dispatcher
                          </p>
                          <p className="text-[10px] text-slate-500 m-0">Queue: 0 pending</p>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">
                        Operational
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Security Audit Trail & Fast Admin Links */}
              <div className="dashboard-card-section">
                {/* Security Audit Log */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2 className="dashboard-panel-title">Security & Access Audit Trail</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time RBAC compliance logs
                      </p>
                    </div>
                    <Link
                      to="/analytics"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Full Audit →
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>Role Elevation Approved</span>
                        <span className="text-[10px] text-slate-400">12m ago</span>
                      </div>
                      <p className="text-slate-600 m-0 text-[11px]">
                        User dr.oliver@example.com assigned Caregiver credentials.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>Automated Backup Snapshot</span>
                        <span className="text-[10px] text-slate-400">1h ago</span>
                      </div>
                      <p className="text-slate-600 m-0 text-[11px]">
                        Encrypted database replica backup generated and stored.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>Security Audit Check Passed</span>
                        <span className="text-[10px] text-slate-400">3h ago</span>
                      </div>
                      <p className="text-slate-600 m-0 text-[11px]">
                        HIPAA transmission security scan finished with 0 vulnerabilities.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Administration Quick Access */}
                <div className="dashboard-panel">
                  <h2 className="dashboard-panel-title mb-3">Administration Modules</h2>
                  <div className="space-y-2">
                    <Link
                      to="/admin/users"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 font-bold text-xs transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        User Directory & RBAC Roles
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
                    </Link>

                    <Link
                      to="/analytics"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        System Analytics & Reports
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/settings"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-violet-600" />
                        Platform Security & Settings
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* C. PATIENT DASHBOARD VIEW                                                 */}
        {/* ========================================================================= */}
        {userRole === 'patient' && (
          <>
            {/* 4 Key Stat KPI Cards for Patient */}
            <div className="dashboard-kpi-grid">
              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Total Prescriptions</p>
                  <p className="dashboard-kpi-value">{currentPatient.totalMeds}</p>
                  <p className="dashboard-kpi-meta text-indigo-600 font-semibold">
                    4 active regimens
                  </p>
                </div>
                <div className="dashboard-kpi-icon bg-indigo-50 text-indigo-600">
                  <Pill className="h-6 w-6" />
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div>
                  <p className="dashboard-kpi-label">Today's Doses</p>
                  <p className="dashboard-kpi-value">
                    {takenCount} / {patientDoses.length}
                  </p>
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    {patientDoses.length - takenCount} remaining today
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
                  <p className="dashboard-kpi-meta text-emerald-600 font-semibold">
                    +4.2% vs target
                  </p>
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
                      {takenCount} of {patientDoses.length} Completed
                    </Badge>
                  </div>

                  <div className="dose-timeline-list">
                    {patientDoses.map((dose) => (
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
                              <button
                                onClick={() => handleTakeDose(dose.id)}
                                className="dose-btn-take"
                              >
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
          </>
        )}
      </div>
    </Layout>
  );
}
