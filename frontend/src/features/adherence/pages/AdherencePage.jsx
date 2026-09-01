import { useEffect, useState } from 'react';
import { adherenceApi } from '../../../api/adherence';
import { Layout } from '../../../components/layout';
//import { Badge } from '../../../components/common/Badge';
import { CardSkeleton, Alert } from '../../../components/common';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Flame, ShieldCheck } from 'lucide-react';
import './AdherencePage.css';

export function AdherencePage() {
  const [summary, setSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [setMonthlyData] = useState([]);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdherenceData = async () => {
      try {
        setLoading(true);

        const [summaryData, weekly, monthly, history] = await Promise.all([
          adherenceApi.getSummary(),
          adherenceApi.getWeeklyAdherence(),
          adherenceApi.getMonthlyAdherence(),
          adherenceApi.getMedicationHistory(),
        ]);

        setSummary(summaryData);
        setWeeklyData(weekly);
        setMonthlyData(monthly);
        setMedicationHistory(history);
      } catch (err) {
        setError('Failed to fetch adherence data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdherenceData();
  }, [setMonthlyData]);

  if (loading) {
    return (
      <Layout>
        <CardSkeleton count={4} />
      </Layout>
    );
  }

  const adherenceData = [
    {
      name: 'Taken',
      value: summary?.takenDoses || 0,
      color: '#10b981',
    },
    {
      name: 'Missed',
      value: summary?.missedDoses || 0,
      color: '#ef4444',
    },
  ];

  return (
    <Layout>
      <div className="adherence-container">
        {/* Header */}
        <div className="adherence-header">
          <div>
            <h1 className="adherence-title">Adherence & Compliance Dashboard</h1>
            <p className="adherence-subtitle">
              Longitudinal tracking of medication intake consistency, streaks, and clinical
              adherence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Verified Protocol: 94% Target Met
            </span>
          </div>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* Summary Stat KPI Cards */}
        {summary && (
          <div className="adherence-kpi-grid">
            <div className="adherence-kpi-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Overall Adherence
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-indigo-600">{summary.overallAdherence}%</p>
                <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +3.8%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Across all prescribed regimens</p>
            </div>

            <div className="adherence-kpi-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Doses Taken
              </p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{summary.takenDoses}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                out of {summary.totalDoses} scheduled
              </p>
            </div>

            <div className="adherence-kpi-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Doses Missed
              </p>
              <p className="text-3xl font-black text-rose-600 mt-1">{summary.missedDoses}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                out of {summary.totalDoses} scheduled
              </p>
            </div>

            <div className="adherence-kpi-card">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Streak
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-amber-500">{summary.streak} Days</p>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Consecutive on-time intake</p>
            </div>
          </div>
        )}

        {/* Weekly Chart & Dose Overview Donut */}
        <div className="adherence-charts-grid">
          {weeklyData.length > 0 && (
            <div className="adherence-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="adherence-panel-title">Weekly Adherence Rate</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily performance breakdown vs target
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                    <Bar dataKey="adherence" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="adherence-panel">
            <h2 className="adherence-panel-title mb-1">Dose Ratio Breakdown</h2>
            <p className="text-xs text-slate-500 mb-4">Taken vs Missed aggregate ratio</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adherenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {adherenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {adherenceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-600">{item.name} Doses</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adherence by Medication Table */}
        {medicationHistory.length > 0 && (
          <div className="adherence-panel">
            <h2 className="adherence-panel-title mb-1">Adherence by Prescribed Medication</h2>
            <p className="text-xs text-slate-500 mb-4">
              Compliance breakdown per active prescription regimen
            </p>

            <div className="overflow-x-auto">
              <table className="adherence-table">
                <thead>
                  <tr>
                    <th>Medication Name</th>
                    <th>Taken Doses</th>
                    <th>Missed Doses</th>
                    <th>Compliance Score</th>
                  </tr>
                </thead>
                <tbody>
                  {medicationHistory.map((med) => (
                    <tr key={med.id}>
                      <td className="font-bold text-slate-900">{med.medicationName}</td>
                      <td>
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {med.taken} taken
                        </span>
                      </td>
                      <td>
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {med.missed} missed
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 rounded-full bg-slate-100 h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${med.adherence}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{med.adherence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
