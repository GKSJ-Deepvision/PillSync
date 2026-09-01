import React from 'react';
import { BarChart3, TrendingUp, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const ADHERENCE_TRENDS = [
  { day: 'Mon', taken: 4, missed: 0, compliance: 100 },
  { day: 'Tue', taken: 3, missed: 1, compliance: 75 },
  { day: 'Wed', taken: 4, missed: 0, compliance: 100 },
  { day: 'Thu', taken: 4, missed: 0, compliance: 100 },
  { day: 'Fri', taken: 3, missed: 0, compliance: 100 },
  { day: 'Sat', taken: 4, missed: 0, compliance: 100 },
  { day: 'Sun', taken: 4, missed: 0, compliance: 100 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 border border-purple-200 dark:border-purple-800">
          <BarChart3 className="w-3.5 h-3.5" />
          Analytics & Compliance Reports
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Medication Adherence & Health Consistency Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Track weekly medication compliance trends, missed dosage analysis, and generate doctor export reports.
        </p>
      </div>

      {/* Summary Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Compliance Score</p>
            <h3 className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">94.2%</h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Excellent adherence
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Doses Consumed</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">118</h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              In past 30 days
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consistency Streak</p>
            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">14 Days</h3>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 block">
              🔥 Active streak
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Interactive Adherence Chart */}
      <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
          7-Day Dosage Adherence Trend (%)
        </h3>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ADHERENCE_TRENDS}>
              <defs>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8ee9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0c8ee9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="compliance" stroke="#0c8ee9" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
