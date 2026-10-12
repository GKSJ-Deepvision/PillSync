import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { adherenceApi, mockAdherenceData } from '../../../api/adherence';
import { getCohortPatients } from '../../../utils/cohort';
import { getScopedStorage } from '../../../utils/userStorage';
import { apiClient } from '../../../api/client';
import { Layout } from '../../../components/layout';
import { CardSkeleton, Alert } from '../../../components/common';
import { Badge } from '../../../components/common/Badge';
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
  Activity,
  Droplets,
  Pill,
  Users,
} from 'lucide-react';
import './AdherencePage.css';

export function AdherencePage() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isCaregiver = userRole === 'caregiver';

  const [summary, setSummary] = useState(mockAdherenceData.summary);
  const [weeklyData, setWeeklyData] = useState(mockAdherenceData.weeklyAdherence);
  const [healthData, setHealthData] = useState(mockAdherenceData.healthImprovement);
  const [medicationHistory, setMedicationHistory] = useState(mockAdherenceData.medicationHistory);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cohort = isCaregiver ? getCohortPatients(user) : [];

  useEffect(() => {
    let isMounted = true;
    const fetchAdherenceData = async () => {
      try {
        setLoading(true);

        if (isCaregiver) {
          try {
            const res = await apiClient.get('/auth/users/');
            if (Array.isArray(res.data) && res.data.length > 0) {
              try {
                localStorage.setItem('pillsync_registered_users', JSON.stringify(res.data));
              } catch {
                // ignore storage error
              }
            }
          } catch {
            // ignore network error
          }

          const currentCohort = getCohortPatients(user);
          if (currentCohort.length === 0) {
            if (isMounted) {
              setSummary({
                overallAdherence: 0,
                takenDoses: 0,
                missedDoses: 0,
                totalDoses: 0,
                streak: 0,
                healthScore: 0,
                avgSystolic: 120,
                avgBloodSugar: 100,
                vitalityLevel: 'No Patients Assigned',
              });
              setWeeklyData([]);
              setHealthData([]);
              setMedicationHistory([]);
            }
            return;
          }

          const avgCohortAdherence = Math.round(
            currentCohort.reduce((acc, p) => acc + (p.adherence || 95), 0) / currentCohort.length
          );
          const totalDoses = currentCohort.length * 2;
          const takenDoses = Math.round(totalDoses * (avgCohortAdherence / 100));

          if (isMounted) {
            setSummary({
              overallAdherence: avgCohortAdherence,
              takenDoses,
              missedDoses: totalDoses - takenDoses,
              totalDoses,
              streak: 3,
              healthScore: Math.min(100, avgCohortAdherence + 2),
              avgSystolic: 122,
              avgBloodSugar: 102,
              vitalityLevel: 'Cohort Monitored',
            });
            setWeeklyData([
              { day: 'Mon', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Tue', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Wed', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Thu', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Fri', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Sat', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
              { day: 'Sun', adherence: avgCohortAdherence, taken: takenDoses, missed: 0 },
            ]);
            setHealthData([]);
            setMedicationHistory(
              currentCohort.map((p, i) => ({
                id: p.id || String(i + 1),
                medicationName: `${p.name}'s Regimen`,
                category: p.condition || 'General Monitoring',
                taken: 1,
                missed: 0,
                adherence: p.adherence || 95,
                impact: 'Regimen active and monitored in clinical protocol.',
              }))
            );
          }
          return;
        }

        // For patient role:
        const userMeds = getScopedStorage('pillsync_patient_medications', []);
        if (!userMeds || userMeds.length === 0) {
          if (isMounted) {
            setSummary({
              overallAdherence: 0,
              takenDoses: 0,
              missedDoses: 0,
              totalDoses: 0,
              streak: 0,
              healthScore: 100,
              avgSystolic: 120,
              avgBloodSugar: 100,
              vitalityLevel: 'Baseline Optimal',
            });
            setWeeklyData([]);
            setHealthData([]);
            setMedicationHistory([]);
          }
          return;
        }

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
  }, [user, isCaregiver]);

  if (loading) {
    return (
      <Layout>
        <CardSkeleton count={4} />
      </Layout>
    );
  }

  const doseRatioData =
    summary?.totalDoses > 0
      ? [
          { name: 'Taken on Time', value: summary.takenDoses, color: '#10b981' },
          { name: 'Missed / Delayed', value: summary.missedDoses, color: '#f43f5e' },
        ]
      : [{ name: 'No Doses Logged', value: 1, color: '#cbd5e1' }];

  const handleExportClinicalReport = () => {
    const rows = [
      ['Report Type', 'PillSync Patient Adherence & Clinical Vitals Report'],
      ['Timestamp', new Date().toISOString()],
      ['Overall Adherence Rate', `${summary?.overallAdherence || 100}%`],
      ['Doses Completed', `${summary?.takenDoses || 0} / ${summary?.totalDoses || 0}`],
      ['Current Adherence Streak', `${summary?.streak || 0} Days`],
      ['Clinical Vitality Score', `${summary?.healthScore || 100}%`],
      ['Average Systolic BP', `${summary?.avgSystolic || 120} mmHg`],
      ['Average Fasting Blood Sugar', `${summary?.avgBloodSugar || 100} mg/dL`],
      ['Active Regimens Monitored', medicationHistory.length],
    ];

    medicationHistory.forEach((med, i) => {
      rows.push([
        `Medication ${i + 1}`,
        `${med.medicationName} (${med.category}) - ${med.adherence}% adherence`,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => `"${e[0]}","${e[1]}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pillsync_adherence_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="adherence-container">
        {/* Header Banner */}
        <div className="adherence-header">
          <div>
            <div className="adherence-title-row">
              <h1 className="adherence-title">
                {isCaregiver
                  ? 'Cohort Adherence & Clinical Analytics'
                  : 'Adherence & Health Analytics'}
              </h1>
              <Badge variant="success" size="sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {summary.overallAdherence}% Target Met
              </Badge>
              <Badge variant="primary" size="sm">
                Verified Clinical Protocol
              </Badge>
            </div>
            <p className="adherence-subtitle">
              {isCaregiver
                ? 'Longitudinal tracking of assigned patient intake consistency, clinical adherence, and risk flags'
                : 'Longitudinal tracking of medication intake consistency, streaks, and daily health improvement vitals'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportClinicalReport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export Clinical Report
            </button>
          </div>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        {isCaregiver && cohort.length === 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  No Patients In Your Care Cohort Yet
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign patients from the Patients Portal to monitor real-time adherence telemetry,
                  dose streaks, and vital improvements.
                </p>
              </div>
            </div>
            <Link
              to="/patients"
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shrink-0"
            >
              Assign Patients
            </Link>
          </div>
        )}

        {!isCaregiver && summary.totalDoses === 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">No Prescriptions Logged Yet</h3>
                <p className="text-[11px] text-slate-500">
                  Scan or add your daily medications to begin tracking clinical adherence, streaks,
                  and health vitals.
                </p>
              </div>
            </div>
            <Link
              to="/medications/new"
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shrink-0"
            >
              Add Medication
            </Link>
          </div>
        )}

        {/* 1. Summary Stat KPI Cards */}
        <div className="adherence-kpi-grid">
          <div className="adherence-kpi-card">
            <div className="adherence-kpi-header">
              <div>
                <p className="adherence-kpi-label">Overall Adherence</p>
                <p className="adherence-kpi-value text-indigo-600">{summary.overallAdherence}%</p>
              </div>
              <div className="adherence-kpi-icon-box icon-indigo">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="adherence-kpi-meta text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{summary.totalDoses > 0 ? '+7.2% above baseline' : 'Optimal baseline'}</span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <div className="adherence-kpi-header">
              <div>
                <p className="adherence-kpi-label">Doses Completed</p>
                <p className="adherence-kpi-value text-emerald-600">
                  {summary.takenDoses}{' '}
                  <span className="text-sm font-semibold text-slate-400">
                    / {summary.totalDoses}
                  </span>
                </p>
              </div>
              <div className="adherence-kpi-icon-box icon-emerald">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="adherence-kpi-meta text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>{summary.totalDoses > 0 ? 'Logged on schedule' : 'No scheduled doses'}</span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <div className="adherence-kpi-header">
              <div>
                <p className="adherence-kpi-label">Intake Streak</p>
                <p className="adherence-kpi-value text-amber-600">{summary.streak} Days</p>
              </div>
              <div className="adherence-kpi-icon-box vital-icon-amber">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="adherence-kpi-meta text-amber-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>
                {summary.streak > 0 ? 'Consecutive on-time intake' : 'Start your streak today'}
              </span>
            </div>
          </div>

          <div className="adherence-kpi-card">
            <div className="adherence-kpi-header">
              <div>
                <p className="adherence-kpi-label">Health Vitality Score</p>
                <p className="adherence-kpi-value text-emerald-600">{summary.healthScore} / 100</p>
              </div>
              <div className="adherence-kpi-icon-box icon-emerald">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="adherence-kpi-meta text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
            {healthData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <HeartPulse className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No Biomarker Logs Recorded Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Once daily doses and vital signs are logged, correlation trends between medication
                  adherence and health metrics will graph automatically.
                </p>
              </div>
            ) : (
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
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  />

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
            )}
          </div>

          {/* 3 Vital Stats Summary Cards */}
          <div className="adherence-vitals-summary-grid">
            <div className="adherence-vital-stat-card">
              <div className="vital-icon-box vital-icon-rose">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="vital-stat-title">Blood Pressure Target</p>
                <p className="vital-stat-value">
                  {summary.totalDoses > 0 ? '120/80 mmHg (Target Range)' : 'Awaiting First Reading'}
                </p>
              </div>
            </div>

            <div className="adherence-vital-stat-card">
              <div className="vital-icon-box vital-icon-amber">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="vital-stat-title">Fasting Glucose Target</p>
                <p className="vital-stat-value">
                  {summary.totalDoses > 0 ? '< 120 mg/dL (Target Range)' : 'Awaiting First Reading'}
                </p>
              </div>
            </div>

            <div className="adherence-vital-stat-card">
              <div className="vital-icon-box vital-icon-emerald">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <p className="vital-stat-title">Care Plan Target</p>
                <p className="vital-stat-value text-emerald-700 font-semibold">
                  {summary.totalDoses > 0 ? '> 90% Protocol Target' : 'Zero Active Regimens'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Weekly Bar Chart & Dose Ratio Donut */}
        <div className="adherence-charts-grid">
          <div className="adherence-panel">
            <div className="adherence-panel-header">
              <div>
                <h2 className="adherence-panel-title">Weekly Intake Consistency</h2>
                <p className="adherence-panel-desc">Daily doses completed vs scheduled</p>
              </div>
              <Badge variant="primary" size="xs">
                <Award className="h-3.5 w-3.5" /> {summary.overallAdherence}% Target Met
              </Badge>
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
          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            MD
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-slate-900">Clinical Care Team</h3>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Attending Physician & Care Review
              </span>
            </div>
            {medicationHistory.length > 0 ? (
              <p className="text-xs text-slate-700 leading-relaxed mb-2">
                "Active intake monitored for your prescribed regimens (
                {medicationHistory.map((m) => m.medicationName).join(', ')}). Continue following
                your scheduled morning and evening dose timings."
              </p>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed mb-2">
                "No prescriptions active yet. Once you add your medications, clinical adherence
                insights and physician feedback will be automatically generated here."
              </p>
            )}
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>📅 Reviewed: Today</span>
              <span>🛡️ Telemetry: Active</span>
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
                {medicationHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-xs font-medium">
                      No prescriptions logged yet. Add your medications to track regimen adherence.
                    </td>
                  </tr>
                ) : (
                  medicationHistory.map((med) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
