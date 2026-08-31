
import { Layout } from '../../../components/layout';
import { Card } from '../../../components/common/Card';
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
  Pie
  
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  ShieldCheck,
  Download,
  
  CheckCircle2,
} from 'lucide-react';
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
  { id: '1', user: 'Dr. Oliver Mitchell', role: 'Caregiver', action: 'Sent dose reminder nudge to Sarah Connor', time: '10 mins ago', status: 'Success' },
  { id: '2', user: 'Ibrahim Kadri', role: 'Patient', action: 'Logged Metformin 500mg taken', time: '35 mins ago', status: 'Success' },
  { id: '3', user: 'Sarah Jenkins', role: 'Admin', action: 'Updated security password policy (HIPAA compliant)', time: '2 hours ago', status: 'Policy Updated' },
  { id: '4', user: 'Robert Taylor', role: 'Patient', action: 'Missed scheduled Lisinopril dose (Notification triggered)', time: '4 hours ago', status: 'Alert Dispatched' },
  { id: '5', user: 'Dr. Oliver Mitchell', role: 'Caregiver', action: 'Added prescription renewal request for Eleanor Vance', time: '6 hours ago', status: 'Success' },
];

export function AnalyticsPage() {
  

  return (
    <Layout>
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <div className="flex items-center gap-2">
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
          <Card className="p-5 rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patients</p>
                <p className="text-3xl font-black text-slate-900 mt-1">1,248</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-2">+12.4% new registrations</p>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cohort Adherence</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">88.4%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-2">+8.4% above 80% clinical baseline</p>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Prescriptions</p>
                <p className="text-3xl font-black text-indigo-700 mt-1">3,890</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">Avg 3.1 Rx per patient</p>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Delivery</p>
                <p className="text-3xl font-black text-sky-700 mt-1">99.2%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">SMS & Push channels operational</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="analytics-charts-grid">
          {/* Chart 1: Longitudinal Trend */}
          <Card className="p-5 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Population Adherence Trend</h3>
                <p className="text-xs text-slate-400">Monthly patient compliance percentage vs. 80% target</p>
              </div>
              <Badge variant="primary" size="xs">6 Months</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[60, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="adherence" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAdherence)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Cohort Risk Ratio */}
          <Card className="p-5 rounded-3xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Risk Segmentation</h3>
                <p className="text-xs text-slate-400">Cohort distribution by adherence risk</p>
              </div>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={RISK_PIE_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
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
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Audit Log Table */}
        <div className="audit-table-container p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security & Clinical Audit Trail</h3>
              <p className="text-xs text-slate-400">Immutable chronological log of platform events and clinical actions</p>
            </div>
            <Badge variant="gray" size="xs">Live Stream</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Action / Event</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 font-bold text-slate-900">{log.user}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{log.action}</td>
                    <td className="py-3 text-slate-400 text-[11px]">{log.time}</td>
                    <td className="py-3 text-right">
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
