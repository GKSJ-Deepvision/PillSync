import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { patientService } from '../../services/patientService';
import { Activity, CheckCircle, CircleAlert, Clock, Brain, ShieldCheck, ShieldAlert, ShieldX, TrendingDown, TrendingUp, BarChart2, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Risk level configuration
// ---------------------------------------------------------------------------
const RISK_CONFIG = {
  LOW: {
    label: 'LOW RISK',
    icon: ShieldCheck,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
    glow: 'shadow-emerald-100',
  },
  MEDIUM: {
    label: 'MEDIUM RISK',
    icon: ShieldAlert,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bar: 'bg-amber-500',
    glow: 'shadow-amber-100',
  },
  HIGH: {
    label: 'HIGH RISK',
    icon: ShieldX,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
    bar: 'bg-red-500',
    glow: 'shadow-red-100',
  },
};

// ---------------------------------------------------------------------------
// Feature importance bar
// ---------------------------------------------------------------------------
const FeatureBar = ({ feature, importance }) => {
  const width = Math.round(importance * 100);
  const label = feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-44 font-medium text-slate-600 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(width * 3.5, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right font-bold text-slate-700">{(importance * 100).toFixed(1)}%</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------
const StatPill = ({ label, value, color = 'text-slate-800' }) => (
  <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
    <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
    <span className="text-[11px] text-slate-500 font-medium mt-0.5 text-center">{label}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Rate bar
// ---------------------------------------------------------------------------
const RateBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-bold text-slate-800">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ML Risk Prediction panel
// ---------------------------------------------------------------------------
const MLRiskPanel = ({ risk }) => {
  if (!risk) return null;

  // Model not yet trained or insufficient history
  if (!risk.available) {
    return (
      <Card
        title="ML Risk Prediction"
        subtitle="Random Forest · Future 7-day adherence risk"
        className="sm:col-span-2 lg:col-span-4"
      >
        <div className="flex items-start gap-3 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Prediction unavailable</p>
            <p className="text-xs text-slate-500 mt-1">{risk.message}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Random Forest ML · Trained on synthetic Synthea data · Academic prototype — not a medical diagnosis.
        </p>
      </Card>
    );
  }

  const cfg = RISK_CONFIG[risk.risk_level] || RISK_CONFIG.MEDIUM;
  const RiskIcon = cfg.icon;

  return (
    <Card
      title="ML Risk Prediction"
      subtitle="Predicted future 7-day adherence risk"
      className="sm:col-span-2 lg:col-span-4"
    >
      {/* Risk level banner */}
      <div className={`mt-4 rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${cfg.glow} shadow-sm`}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-xl border ${cfg.border} bg-white shadow-sm`}>
            <RiskIcon className={`h-7 w-7 ${cfg.text}`} />
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.text}`}>
              Predicted Adherence Risk
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-3xl font-extrabold ${cfg.text}`}>{cfg.label}</span>
            </div>
          </div>
        </div>
        {/* Recent adherence score */}
        <div className="flex flex-col items-center bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm min-w-[110px]">
          <span className="text-[11px] text-slate-500 font-medium">Recent Adherence</span>
          <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{risk.adherence_score}%</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Last 21 days</span>
        </div>
      </div>

      {/* Dose statistics */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatPill label="Taken Doses" value={risk.taken_doses} color="text-emerald-700" />
        <StatPill label="Missed Doses" value={risk.missed_doses} color="text-red-700" />
        <StatPill label="Snoozed Doses" value={risk.snoozed_doses} color="text-amber-700" />
      </div>

      {/* Rates */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <RateBar label="Miss Rate" value={risk.miss_rate} color="bg-red-400" />
          <RateBar label="Snooze Rate" value={risk.snooze_rate} color="bg-amber-400" />
        </div>

        {/* Confidence */}
        {risk.confidence && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Model Confidence</p>
            {Object.entries(risk.confidence).map(([cls, prob]) => {
              const c = RISK_CONFIG[cls] || RISK_CONFIG.MEDIUM;
              return (
                <div key={cls} className="flex items-center gap-2 text-xs">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.badge} w-16 text-center`}>{cls}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${prob * 100}%` }} />
                  </div>
                  <span className="w-9 text-right font-bold text-slate-600">{(prob * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature importance */}
      {risk.top_features && risk.top_features.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-brand-500" />
            Top Factors (Feature Importance)
          </p>
          <div className="space-y-2">
            {risk.top_features.map((f) => (
              <FeatureBar key={f.feature} feature={f.feature} importance={f.importance} />
            ))}
          </div>
        </div>
      )}

      {/* Model source */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <Brain className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Random Forest ML</span> · Trained on synthetic Synthea data (108 patients) ·{' '}
          <span className="font-semibold">Academic prototype — not a medical diagnosis.</span>{' '}
          Predicts future 7-day adherence risk from your 21-day medication history.
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
const Adherence = () => {
  const [summary, setSummary] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [mlRisk, setMlRisk] = useState(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    patientService.fetchAdherence()
      .then(setSummary)
      .catch((err) => setError(err.response?.data?.detail || err.message || 'Unable to load adherence summary.'));

    patientService.fetchIntelligence().then(setIntelligence).catch(() => {});

    patientService.fetchAdherenceRisk()
      .then(setMlRisk)
      .catch(() => setMlRisk({ available: false, message: 'ML risk prediction is currently unavailable.' }))
      .finally(() => setMlLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="adherence-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Adherence Analytics</h1>
        <p className="text-xs text-slate-455 mt-0.5 font-medium">Compliance tracker metrics.</p>
      </div>

      {/* ── Existing adherence cards ── */}
      {!summary && !error ? <Loading text="Loading adherence summary..." /> : error ? <ErrorMessage message={error} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Monthly adherence"><div className="flex items-center gap-3 mt-4"><Activity className="h-6 w-6 text-brand-600" /><span className="text-3xl font-extrabold text-slate-800">{summary.monthly}%</span></div></Card>
          <Card title="Taken doses"><div className="flex items-center gap-3 mt-4"><CheckCircle className="h-6 w-6 text-emerald-600" /><span className="text-3xl font-extrabold text-slate-800">{summary.taken}</span></div></Card>
          <Card title="Missed doses"><div className="flex items-center gap-3 mt-4"><CircleAlert className="h-6 w-6 text-red-600" /><span className="text-3xl font-extrabold text-slate-800">{summary.missed}</span></div></Card>
          <Card title="Pending doses"><div className="flex items-center gap-3 mt-4"><Clock className="h-6 w-6 text-amber-600" /><span className="text-3xl font-extrabold text-slate-800">{summary.pending}</span></div></Card>
          <Card title="Tracking overview" className="sm:col-span-2 lg:col-span-4"><p className="text-sm text-slate-600">{summary.total ? `You have logged ${summary.total} doses. Keep marking doses from your schedule to build a reliable adherence history.` : 'Mark doses from your schedule to begin building an adherence history.'}</p></Card>
          <Card title="Dose breakdown" subtitle="Current recorded dose statuses" className="sm:col-span-2 lg:col-span-4"><div className="space-y-3 mt-3">{[['Taken', summary.taken, 'bg-emerald-500'], ['Missed', summary.missed, 'bg-red-500'], ['Pending', summary.pending, 'bg-amber-500']].map(([label, value, color]) => <div key={label} className="flex items-center gap-3 text-xs"><span className="w-16 font-semibold text-slate-600">{label}</span><div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${summary.total ? Math.max((value / summary.total) * 100, value ? 4 : 0) : 0}%` }} /></div><span className="w-8 text-right font-bold text-slate-700">{value}</span></div>)}</div></Card>
          {intelligence && <Card title="Risk and pattern insights" subtitle="Informational decision support" className="sm:col-span-2 lg:col-span-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"><div><p className="font-bold text-slate-800">Missed-dose risk: <span className="capitalize">{intelligence.missed_dose_risk.level}</span></p><p className="text-slate-600 mt-1">Estimated score: {intelligence.missed_dose_risk.score}/100.</p><p className="text-[11px] text-slate-500 mt-1">Source: {intelligence.missed_dose_risk.source}</p></div><div><p className="font-bold text-slate-800">Adherence pattern</p><p className="text-slate-600 mt-1 capitalize">{intelligence.adherence_pattern.status}</p></div><div><p className="font-bold text-slate-800">Model status</p><p className="text-slate-600 mt-1">{intelligence.trained_model.available ? `Probability: ${Math.round(intelligence.trained_model.probability * 100)}%` : 'Collecting labeled dose history'}</p></div></div><p className="text-[11px] text-slate-500 mt-4">{intelligence.disclaimer}</p></Card>}
        </div>
      )}

      {/* ── ML Risk Prediction panel ── */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-600" />
          ML Risk Prediction
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide">
            Random Forest
          </span>
        </h2>
        {mlLoading ? (
          <Loading text="Running adherence risk prediction..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MLRiskPanel risk={mlRisk} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Adherence;
