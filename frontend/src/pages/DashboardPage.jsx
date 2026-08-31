import { useState } from "react";
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Badge } from '../components/common/Badge';
import {
  MessageSquare,
  Edit3,
  CheckCircle2,
  MoreHorizontal,
  Phone,
  Minus,
  X,
  Send,
  Users,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import './DashboardPage.css';

const PATIENT_PROFILES = [
  {
    id: 'p1',
    name: 'Ibrahim Kadri',
    age: 54,
    consultation: 'Individual Therapy & Diabetes Regimen',
    visited: 'Online',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activityPie: [
      { name: 'Quizzes', value: 4, color: '#f87171' },
      { name: 'Articles', value: 7, color: '#6366f1' },
      { name: 'Medication', value: 2, color: '#fbbf24' },
    ],
    selfControl: [
      { label: 'Emotion Control', left: 45, right: 55 },
      { label: 'Stress Management', left: 60, right: 40 },
      { label: 'Daily Routine', left: 80, right: 20 },
      { label: 'Self Esteem', left: 70, right: 30 },
      { label: 'Diet & Rx Adherence', left: 90, right: 10 },
    ],
  },
  {
    id: 'p2',
    name: 'Sarah Connor',
    age: 48,
    consultation: 'Cardiac Care & Cholesterol Protocol',
    visited: 'Clinic Visited',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    activityPie: [
      { name: 'Quizzes', value: 2, color: '#f87171' },
      { name: 'Articles', value: 4, color: '#6366f1' },
      { name: 'Medication', value: 5, color: '#fbbf24' },
    ],
    selfControl: [
      { label: 'Emotion Control', left: 35, right: 65 },
      { label: 'Stress Management', left: 40, right: 60 },
      { label: 'Daily Routine', left: 65, right: 35 },
      { label: 'Self Esteem', left: 55, right: 45 },
      { label: 'Diet & Rx Adherence', left: 64, right: 36 },
    ],
  },
];

const INITIAL_TASKS = [
  { id: 1, text: 'Morning Metformin 500mg (8:00 AM)', done: true },
  { id: 2, text: 'Take Blood Pressure Reading', done: true },
  { id: 3, text: 'Log 20-min Post-Lunch Walk', done: false },
  { id: 4, text: 'Evening Atorvastatin 20mg (9:00 PM)', done: false },
];

const WELLBEING_DATA = [
  { month: 'Jan', thisMonth: 40, lastMonth: 30 },
  { month: 'Feb', thisMonth: 60, lastMonth: 45 },
  { month: 'Mar', thisMonth: 75, lastMonth: 60 },
  { month: 'Apr', thisMonth: 50, lastMonth: 70 },
  { month: 'May', thisMonth: 65, lastMonth: 55 },
  { month: 'Jun', thisMonth: 80, lastMonth: 65 },
  { month: 'Jul', thisMonth: 70, lastMonth: 75 },
  { month: 'Aug', thisMonth: 95, lastMonth: 70 },
  { month: 'Sep', thisMonth: 85, lastMonth: 80 },
  { month: 'Oct', thisMonth: 75, lastMonth: 65 },
  { month: 'Nov', thisMonth: 90, lastMonth: 85 },
  { month: 'Dec', thisMonth: 88, lastMonth: 80 },
];

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [selfControlRange, setSelfControlRange] = useState('W');
  const [progressRange, setProgressRange] = useState('M');
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const activePatient = PATIENT_PROFILES[selectedPatientIndex];

  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'patient', text: 'Hello Doctor Oliver. I logged my morning Metformin on time!' },
    { id: 2, sender: 'doctor', text: 'Great job, Ibrahim! Keep up this consistency. Your adherence score is at 94%.' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const toggleTask = (taskId) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
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

  const isCaregiverOrAdmin = user?.role === 'caregiver' || user?.role === 'admin';

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Caregiver & Admin Patient Switcher Bar */}
        {isCaregiverOrAdmin && (
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50/80 border border-indigo-100 p-3.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-bold">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Monitoring Patient:</span>
              <select
                value={selectedPatientIndex}
                onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
                className="rounded-xl border border-indigo-200 bg-white px-3 py-1 font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {PATIENT_PROFILES.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name} (Age: {p.age})
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-500 font-medium">Caregiver Oversight Active</span>
              <Badge variant="primary" size="xs">
                Clinical Live Mode
              </Badge>
            </div>
          </div>
        )}

        {/* 1. Top Patient Hero Banner */}
        <div className="dashboard-hero-banner">
          <div className="dashboard-hero-inner">
            {/* Left: Patient Avatar & Info */}
            <div className="dashboard-hero-patient">
              <img
                src={activePatient.avatar}
                alt={activePatient.name}
                className="dashboard-hero-avatar"
              />
              <div>
                <h2 className="dashboard-hero-name">
                  {activePatient.name}
                </h2>
                <div className="dashboard-hero-meta">
                  <span>Age: {activePatient.age}</span>
                  <span>·</span>
                  <span>Consultation: {activePatient.consultation}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Visited: {activePatient.visited}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="dashboard-hero-actions">
              <button
                onClick={() => {
                  const chatEl = document.getElementById('chat-widget');
                  chatEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="dashboard-hero-btn"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Message</span>
              </button>
              <button
                onClick={() => navigate('/medications')}
                className="dashboard-hero-btn"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Regimen</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Top Grid Row (3 Cards: Self Control, Weekly Activities, Daily Tasks) */}
        <div className="dashboard-grid-top">
          {/* Card 1: Self Control */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Self Control</h3>
              <div className="dashboard-range-group">
                {['W', 'M', 'Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelfControlRange(range)}
                    className={`dashboard-range-btn ${
                      selfControlRange === range ? 'dashboard-range-btn-active' : ''
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="self-control-list">
              {activePatient.selfControl.map((metric) => (
                <div key={metric.label} className="self-control-item">
                  <div className="self-control-header">
                    <span className="self-control-label">{metric.label}</span>
                    <div className="self-control-values">
                      <span>{metric.left}%</span>
                      <div className="self-control-track">
                        <div
                          className="self-control-fill"
                          style={{ width: `${metric.left}%` }}
                        />
                      </div>
                      <span>{metric.right}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Weekly Activities Donut Chart */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Weekly Activities</h3>
              <span className="text-[11px] font-semibold text-slate-400">2 Feb - 9 Feb</span>
            </div>

            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePatient.activityPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activePatient.activityPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-score">
                <span className="donut-score-text">40%</span>
                <span className="donut-score-label">Score</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend">
              <div className="donut-legend-row">
                <div className="donut-legend-info">
                  <span className="donut-legend-dot bg-[#f87171]"></span>
                  <span className="donut-legend-name">Quizzes</span>
                </div>
                <span className="donut-legend-value">04</span>
              </div>
              <div className="donut-legend-row">
                <div className="donut-legend-info">
                  <span className="donut-legend-dot bg-[#6366f1]"></span>
                  <span className="donut-legend-name">Articles</span>
                </div>
                <span className="donut-legend-value">07</span>
              </div>
              <div className="donut-legend-row">
                <div className="donut-legend-info">
                  <span className="donut-legend-dot bg-[#fbbf24]"></span>
                  <span className="donut-legend-name">Medication</span>
                </div>
                <span className="donut-legend-value">02</span>
              </div>
            </div>
          </div>

          {/* Card 3: Daily Tasks */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">Daily Tasks</h3>
              <span className="text-[11px] font-bold text-indigo-600">
                {tasks.filter((t) => t.done).length}/{tasks.length} Done
              </span>
            </div>

            <div className="task-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="task-item"
                >
                  <span
                    className={`task-text ${
                      task.done ? 'task-text-done' : 'task-text-pending'
                    }`}
                  >
                    {task.text}
                  </span>

                  {task.done ? (
                    <div className="task-badge-done">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="task-badge-pending">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Bottom Grid Row (2 Columns: Progress of Well-being & Consultation Chat) */}
        <div className="dashboard-grid-bottom">
          {/* Card 4: Progress of Well-being Bar Chart */}
          <div className="wellbeing-card">
            <div className="wellbeing-header">
              <h3 className="dashboard-card-title">Progress of well-being</h3>

              <div className="wellbeing-legend-group">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="wellbeing-legend-item">
                    <span className="wellbeing-legend-dot bg-indigo-600"></span>
                    This Month
                  </span>
                  <span className="wellbeing-legend-item">
                    <span className="wellbeing-legend-dot bg-indigo-200"></span>
                    Last Month
                  </span>
                </div>

                <div className="dashboard-range-group border-l border-slate-200 pl-3">
                  {['W', 'M', 'Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setProgressRange(range)}
                      className={`dashboard-range-btn ${
                        progressRange === range ? 'dashboard-range-btn-active' : ''
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart with Emoji Y-Axis */}
            <div className="wellbeing-chart-layout">
              <div className="wellbeing-emoji-axis">
                <span>😊</span>
                <span>😐</span>
                <span>🙁</span>
                <span>😴</span>
              </div>

              <div className="wellbeing-chart-area">
                <div className="wellbeing-floating-peak">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <span>Excellent · Aug 2026</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WELLBEING_DATA} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis domain={[0, 100]} hide={true} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Adherence']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar
                      dataKey="thisMonth"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="lastMonth"
                      fill="#e0e7ff"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 5: Interactive Consultation Chat Widget */}
          <div id="chat-widget" className="chat-card">
            {/* Chat Top Header */}
            <div className="chat-card-header">
              <div className="chat-user-info">
                <img
                  src={activePatient.avatar}
                  alt={activePatient.name}
                  className="chat-avatar"
                />
                <div>
                  <h4 className="chat-user-name">{activePatient.name}</h4>
                  <span className="chat-user-status">Active now</span>
                </div>
              </div>

              <div className="chat-header-actions">
                <button
                  onClick={() => alert(`Initiating secure audio consultation call with ${activePatient.name}...`)}
                  className="chat-header-icon-btn"
                  title="Call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button className="chat-header-icon-btn" title="Minimize">
                  <Minus className="h-4 w-4" />
                </button>
                <button className="chat-header-icon-btn" title="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="chat-stream">
              {chatMessages.map((msg) => {
                const isPatient = msg.sender === 'patient';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`chat-bubble ${
                        isPatient ? 'chat-bubble-patient' : 'chat-bubble-doctor'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="text"
                placeholder="Type message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="chat-input-field"
              />
              <button type="submit" className="chat-send-btn">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
