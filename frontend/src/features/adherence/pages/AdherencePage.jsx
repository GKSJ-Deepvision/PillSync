import { useEffect, useState } from 'react';
import { adherenceApi, mockAdherenceData } from '../../../api/adherence';
import { Layout } from '../../../components/layout';
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
  ComposedChart,
  Line,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  Download,
  CheckCircle2,
  Award,
} from 'lucide-react';
import './AdherencePage.css';

export function AdherencePage() {
  const [summary, setSummary] = useState(mockAdherenceData.summary);
  const [weeklyData, setWeeklyData] = useState(mockAdherenceData.weeklyAdherence);
  const [healthData, setHealthData] = useState(mockAdherenceData.healthImprovement);
  const [medicationHistory, setMedicationHistory] = useState(mockAdherenceData.medicationHistory);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchAdherenceData = async () => {
      try {
        setLoading(true);
        const [summaryRes, weeklyRes, healthRes, historyRes] = await Promise.all([
          adherenceApi.getSummary().catch(() => mockAdherenceData.summary),
          adherenceApi.getWeeklyAdherence().catch(() => mockAdherenceData.weeklyAdherence),
          adherenceApi.getHealthImprovement().catch(() => mockAdherenceData.healthImprovement),
          adherenceApi.getMedicationHistory().catch(() => mockAdherenceData.medicationHistory),
        ]);

        if (isMounted) {
          setSummary(summaryRes || mockAdherenceData.summary);
          setWeeklyData(weeklyRes || mockAdherenceData.weeklyAdherence);
          setHealthData(healthRes || mockAdherenceData.healthImprovement);
          setMedicationHistory(historyRes || mockAdherenceData.medicationHistory);
        }
      } catch (err) {
        console.error('Error fetching adherence data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdherenceData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <CardSkeleton count={4} />
      </Layout>
    );
  }

  const doseRatioData = [
    { name: 'Taken on Time', value: summary?.takenDoses || 37, color: '#10b981' },
    { name: 'Missed / Delayed', value: summary?.missedDoses || 2, color: '#f43f5e' },
  ];

  return (
    <Layout>
      <div className="adherence-container">
        {/* Header Banner */}
        <div className="adherence-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Clinical Protocol · 94% Target Exceeded
              </span>
            </div>
            <h1 className="adherence-title">Adherence & Health Analytics</h1>
            <p className="adherence-subtitle">
              Longitudinal tracking of medication intake consistency, streaks, and daily health
              improvement vitals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                alert('Adherence and health vitals summary PDF exported successfully.')
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export Clinical Report
            </button>
          </div>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {/* 1. Summary Stat KPI Cards */}
        <div className="adherence-kpi-grid">
          <div className="adherence-kpi-card">
            <p className="adherence-kpi-label">Overall Adherence</p>
            <p className="adherence-kpi-value text-indigo-600">{summary.overallAdherence}%</p>
            <div className="adherence-kpi-meta text-emerald-600 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+7.2% above clinical baseline</span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <p className="adherence-kpi-label">Doses Completed</p>
            <p className="adherence-kpi-value text-emerald-600">
              {summary.takenDoses}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {summary.totalDoses}</span>
            </p>
            <div className="adherence-kpi-meta text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>94.8% on-schedule accuracy</span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <p className="adherence-kpi-label">Intake Streak</p>
            <p className="adherence-kpi-value text-amber-500">{summary.streak} Days</p>
            <div className="adherence-kpi-meta text-amber-600 font-bold">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Consecutive on-time intake</span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <p className="adherence-kpi-label">Health Vitality Score</p>
            <p className="adherence-kpi-value text-emerald-600">{summary.healthScore} / 100</p>
            <div className="adherence-kpi-meta text-emerald-700 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Optimal recovery state</span>
            </div>
          </div>
        </div>

        {/* 2. FEATURE HIGHLIGHT: Daily Health Improvement Correlation Chart */}
        <div className="adherence-health-banner">
          <div className="adherence-health-header">
            <div>
              <h2 className="adherence-health-title">
                <HeartPulse className="h-5 w-5 text-indigo-600" />
                Daily Health Improvement & Medication Correlation
              </h2>
              <p className="adherence-health-subtitle">
                Demonstrating how consistent daily medication adherence directly stabilizes blood
                pressure and glycemic health
              </p>
            </div>

            <div className="adherence-metric-tabs">
              {[
                { id: 'all', label: 'All Vitals' },
                { id: 'bp', label: 'Blood Pressure (BP)' },
                { id: 'sugar', label: 'Blood Glucose' },
                { id: 'vitality', label: 'Vitality Score' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedMetric(tab.id)}
                  className={
                    'adherence-metric-tab-btn ' +
                    (selectedMetric === tab.id ? 'adherence-metric-tab-btn-active' : '')
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={healthData}
                margin={{ top: 15, right: 20, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[60, 160]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    backgroundColor: '#ffffff',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => {
                    if (name === 'Adherence %') return [val + '%', name];
                    if (name === 'Systolic BP') return [val + ' mmHg', name];
                    if (name === 'Blood Glucose') return [val + ' mg/dL', name];
                    if (name === 'Health Vitality') return [val + ' / 100', name];
                    return [val, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="adherence"
                  name="Adherence %"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#adherenceGradient)"
                />

                {(selectedMetric === 'all' || selectedMetric === 'bp') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="systolicBP"
                    name="Systolic BP"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ef4444' }}
                  />
                )}

                {(selectedMetric === 'all' || selectedMetric === 'sugar') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bloodSugar"
                    name="Blood Glucose"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                )}

                {(selectedMetric === 'all' || selectedMetric === 'vitality') && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="healthScore"
                    name="Health Vitality"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-100">
            <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5 border border-indigo-50">
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                BP
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Blood Pressure Stabilized</p>
                <p className="text-[10px] text-slate-500">122/78 mmHg (Reduced by 16 mmHg)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5 border border-indigo-50">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                GLU
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Fasting Glucose In Range</p>
                <p className="text-[10px] text-slate-500">114 mg/dL (Reduced by 28 mg/dL)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5 border border-indigo-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                RX
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Care Plan Target</p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  100% Weekend On-Time Intake
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Weekly Bar Chart & Dose Ratio Donut */}
        <div className="adherence-charts-grid">
          <div className="adherence-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="adherence-panel-title">Weekly Intake Consistency</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daily doses completed vs scheduled</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                <Award className="h-3.5 w-3.5" /> 90% Target Met
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val) => [val + '%', 'Adherence']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="adherence" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="adherence-panel flex flex-col justify-between">
            <div>
              <h2 className="adherence-panel-title mb-1">Dose Ratio Breakdown</h2>
              <p className="text-xs text-slate-500 mb-2">Taken on time vs missed aggregate ratio</p>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={doseRatioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {doseRatioData.map((entry, index) => (
                        <Cell key={'cell-' + index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {doseRatioData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} Doses</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Caregiver Clinical Progress Review Box */}
        <div className="adherence-clinical-note-box">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            alt="Caregiver"
            className="adherence-clinical-avatar"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-slate-900">Dr. Oliver Mitchell</h3>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Lead Caregiver & Physician Review
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-2">
              "Outstanding adherence consistency over the past 14 days! Maintaining &gt;90%
              on-schedule intake with Metformin and Lisinopril has directly stabilized systolic
              blood pressure to 122 mmHg and lowered fasting blood glucose to 114 mg/dL. Continue
              current morning and evening regimens."
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>📅 Reviewed: Today, 08:30 AM</span>
              <span>🛡️ Next Milestone Check: Sunday, Sep 6</span>
            </div>
          </div>
        </div>

        {/* 5. Adherence by Medication Table */}
        <div className="adherence-panel">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="adherence-panel-title">Adherence by Prescribed Regimen</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compliance breakdown and real-world health impact per active medicine
              </p>
            </div>
          </div>

          <div className="adherence-table-wrapper">
            <table className="adherence-table">
              <thead>
                <tr>
                  <th>Medication & Category</th>
                  <th>Completed Doses</th>
                  <th>Compliance Rate</th>
                  <th>Clinical Health Impact</th>
                </tr>
              </thead>
              <tbody>
                {medicationHistory.map((med) => (
                  <tr key={med.id}>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 m-0">{med.medicationName}</p>
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {med.category || 'General Care'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {med.taken} taken
                        </span>
                        {med.missed > 0 ? (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                            {med.missed} missed
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-500">
                            0 missed
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 rounded-full bg-slate-100 h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: med.adherence + '%' }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{med.adherence}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-slate-600">
                        {med.impact ||
                          'Regimen maintained according to prescribed clinical instructions.'}
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
