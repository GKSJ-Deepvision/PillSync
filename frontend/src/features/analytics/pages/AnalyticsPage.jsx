import { Layout } from '../../../components/layout';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';
import { TrendingUp, Users, Activity, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import './AnalyticsPage.css';

const MONTHLY_TREND = [
  { month: 'Mar', adherence: 76, target: 80 },
  { month: 'Apr', adherence: 81, target: 80 },
  { month: 'May', adherence: 84, target: 80 },
  { month: 'Jun', adherence: 83, target: 80 },
  { month: 'Jul', adherence: 89, target: 80 },
  { month: 'Aug', adherence: 92, target: 80 },
];

// const DISEASE_COMPLIANCE = [
//   { disease: 'Hypertension', adherence: 91, count: 420 },
//   { disease: 'Type 2 Diabetes', adherence: 88, count: 380 },
//   { disease: 'Thyroid', adherence: 95, count: 210 },
//   { disease: 'Cardiac', adherence: 78, count: 160 },
//   { disease: 'Supplements', adherence: 84, count: 190 },
// ];

const RISK_PIE_DATA = [
  { name: 'Compliant (>85%)', value: 68, color: '#10b981' },
  { name: 'Moderate (70-85%)', value: 22, color: '#f59e0b' },
  { name: 'High Risk (<70%)', value: 10, color: '#ef4444' },
];

const AUDIT_LOGS = [
  {
    id: '1',
    user: 'Dr. Oliver Mitchell',
    role: 'Caregiver',
    action: 'Sent dose reminder nudge to Sarah Connor',
    time: '10 mins ago',
    status: 'Success',
  },
  {
    id: '2',
    user: 'Ibrahim Kadri',
    role: 'Patient',
    action: 'Logged Metformin 500mg taken',
    time: '35 mins ago',
    status: 'Success',
  },
  {
    id: '3',
    user: 'Sarah Jenkins',
    role: 'Admin',
    action: 'Updated security password policy (HIPAA compliant)',
    time: '2 hours ago',
    status: 'Policy Updated',
  },
  {
    id: '4',
    user: 'Robert Taylor',
    role: 'Patient',
    action: 'Missed scheduled Lisinopril dose (Notification triggered)',
    time: '4 hours ago',
    status: 'Alert Dispatched',
  },
  {
    id: '5',
    user: 'Dr. Oliver Mitchell',
    role: 'Caregiver',
    action: 'Added prescription renewal request for Eleanor Vance',
    time: '6 hours ago',
    status: 'Success',
  },
];

export function AnalyticsPage() {
  return (
    <Layout>
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <div className="analytics-title-row">
              <h1 className="analytics-title">Clinical & Platform Analytics</h1>
              <Badge variant="primary" size="sm">
                Live HIPAA Feed
              </Badge>
            </div>
            <p className="analytics-subtitle">
              Longitudinal adherence analytics, population compliance rates, and system audit trail
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => alert('Exporting HIPAA compliant CSV report...')}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="analytics-kpi-grid">
          <div className="analytics-kpi-card">
            <div className="analytics-kpi-header">
              <div>
                <p className="analytics-kpi-label">Total Patients</p>
                <p className="analytics-kpi-value text-slate-900">1,248</p>
              </div>
              <div className="analytics-kpi-icon-box icon-indigo">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="analytics-kpi-subtext text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              +12.4% new registrations
            </p>
          </div>

          <div className="analytics-kpi-card">
            <div className="analytics-kpi-header">
              <div>
                <p className="analytics-kpi-label">Cohort Adherence</p>
                <p className="analytics-kpi-value text-emerald-600">88.4%</p>
              </div>
              <div className="analytics-kpi-icon-box icon-emerald">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="analytics-kpi-subtext text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              +8.4% above 80% baseline
            </p>
          </div>

          <div className="analytics-kpi-card">
            <div className="analytics-kpi-header">
              <div>
                <p className="analytics-kpi-label">Active Prescriptions</p>
                <p className="analytics-kpi-value text-indigo-700">3,890</p>
              </div>
              <div className="analytics-kpi-icon-box icon-violet">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="analytics-kpi-subtext text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              Avg 3.1 Rx per patient
            </p>
          </div>

          <div className="analytics-kpi-card">
            <div className="analytics-kpi-header">
              <div>
                <p className="analytics-kpi-label">Notification Delivery</p>
                <p className="analytics-kpi-value text-sky-700">99.2%</p>
              </div>
              <div className="analytics-kpi-icon-box icon-sky">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="analytics-kpi-subtext text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              SMS & Push channels active
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="analytics-charts-grid">
          {/* Chart 1: Longitudinal Trend */}
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <h3 className="analytics-chart-title">Population Adherence Trend</h3>
                <p className="analytics-chart-desc">
                  Monthly patient compliance percentage vs. 80% target
                </p>
              </div>
              <Badge variant="primary" size="xs">
                6 Months
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MONTHLY_TREND}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[60, 100]}
                    unit="%"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="adherence"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAdherence)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cohort Risk Ratio */}
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <h3 className="analytics-chart-title">Risk Segmentation</h3>
                <p className="analytics-chart-desc">Cohort distribution by adherence risk</p>
              </div>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={RISK_PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {RISK_PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-slate-800">1,248</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Patients</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
              {RISK_PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="audit-table-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security & Clinical Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Immutable chronological log of platform events and clinical actions
              </p>
            </div>
            <Badge variant="gray" size="xs">
              Live Stream
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="audit-table">
              <thead>
                <tr className="audit-table-head">
                  <th>User</th>
                  <th>Role</th>
                  <th>Action / Event</th>
                  <th>Time</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="audit-table-row">
                    <td className="font-bold text-slate-900">{log.user}</td>
                    <td>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {log.role}
                      </span>
                    </td>
                    <td className="text-slate-600">{log.action}</td>
                    <td className="text-slate-400 text-[11px]">{log.time}</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
