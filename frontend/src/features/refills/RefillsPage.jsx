import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { listMedications, adjustStock } from "../medications/api";
import { listDoseHistory } from "../reminders/api";
import { predictRefillsBatch, REFILL_STATUS_LABEL, ADHERENCE_RISK_LABEL } from "./mlApi";

const STATUS_STYLE = {
  ok: { bar: "bg-mint", text: "text-mint-deep" },
  low: { bar: "bg-[#F59E0B]", text: "text-[#B45309]" },
  empty: { bar: "bg-rose", text: "text-rose-deep" },
  "no-schedule": { bar: "bg-ink/20", text: "text-ink-fog" },
};

const ADHERENCE_STYLE = {
  "insufficient-data": "bg-ink/10 text-ink-fog",
  stable: "bg-mint-soft text-mint-deep",
  watch: "bg-[#FEF3C7] text-[#B45309]",
  declining: "bg-coral-soft text-coral-deep",
};

const HISTORY_LOOKBACK_DAYS = 45;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RefillsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: meds } = await listMedications(user.id);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - HISTORY_LOOKBACK_DAYS);
    const { data: history } = await listDoseHistory(user.id, { fromDate: fromDate.toISOString() });

    const medsWithHistory = meds.map((med) => ({
      ...med,
      recent_dose_logs: history.filter((log) => log.medication_id === med.id),
    }));

    setMedications(medsWithHistory);
    const result = await predictRefillsBatch(medsWithHistory);
    setPredictions(result.predictions);
    setSummary(result.summary);
    setModelInfo(result.predictions[0]?.model_version ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logRefill = async (medicationId, amount) => {
    await adjustStock(medicationId, amount);
    refresh();
  };

  const byId = Object.fromEntries(medications.map((m) => [m.id, m]));
  const rows = predictions.map((prediction) => ({ med: byId[prediction.medication_id], prediction }));
  const lowStock = rows.filter((r) => r.prediction.stock_status === "low" || r.prediction.stock_status === "empty");

  return (
    <DashboardLayout eyebrow="Stock & refills" title="Refill alerts">
      {!loading && summary && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="badge bg-indigo-soft text-indigo-deep">
            {modelInfo && modelInfo !== "offline-fallback" && modelInfo !== "fallback-rule-based"
              ? "AI-adjusted predictions"
              : "Rule-based (AI service offline)"}
          </span>
          {summary.adherence_watch_count > 0 && (
            <span className="badge bg-coral-soft text-coral-deep">
              {summary.adherence_watch_count} medicine{summary.adherence_watch_count > 1 ? "s" : ""} with adherence risk
            </span>
          )}
        </div>
      )}

      {!loading && lowStock.length > 0 && (
        <div className="mb-6 rounded-2xl border px-5 py-4" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-soft)" }}>
          <p className="font-body text-sm font-semibold" style={{ color: "var(--brand-deep)" }}>
            {lowStock.length} medicine{lowStock.length > 1 ? "s" : ""} need{lowStock.length === 1 ? "s" : ""} a refill soon
          </p>
          <p className="mt-0.5 font-body text-[13px] text-ink-fog">
            {lowStock.map((r) => r.med?.name).filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-ink-fog">Analyzing stock levels and adherence history…</p>
      ) : rows.length === 0 ? (
        <p className="card text-center font-body text-sm text-ink-fog">Add a medicine to see refill predictions.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ med, prediction }) => {
            if (!med) return null;
            const style = STATUS_STYLE[prediction.stock_status];
            const fillPct = Math.min(100, Math.round((med.stock_quantity / Math.max(med.low_stock_threshold * 4, 1)) * 100));
            return (
              <div key={med.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">{med.name}</h3>
                    <p className="font-body text-[12px] text-ink-fog">{med.stock_quantity} units in stock</p>
                  </div>
                  <span className={`badge bg-porcelain-dim ${style.text}`}>{REFILL_STATUS_LABEL[prediction.stock_status]}</span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-porcelain-dim">
                  <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${fillPct}%` }} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-fog">Prescribed / day</dt>
                    <dd className="font-body text-sm font-semibold text-ink">{prediction.prescribed_daily_dose || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-fog">Days remaining</dt>
                    <dd className="font-body text-sm font-semibold text-ink">{prediction.days_remaining ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-fog">Runs out</dt>
                    <dd className="font-body text-sm font-semibold text-ink">{formatDate(prediction.depletion_date)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-fog">Refill by</dt>
                    <dd className="font-body text-sm font-semibold text-ink">{formatDate(prediction.refill_by_date)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
                  <span className={`badge ${ADHERENCE_STYLE[prediction.adherence_risk]}`}>
                    {ADHERENCE_RISK_LABEL[prediction.adherence_risk]}
                  </span>
                  {prediction.confidence > 0 && (
                    <span className="font-body text-[11px] text-ink-fog">
                      {Math.round(prediction.confidence * 100)}% confidence · {Math.round(prediction.predicted_adherence_rate * 100)}% predicted adherence
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2 pt-1">
                  <button type="button" onClick={() => logRefill(med.id, 30)} className="btn-secondary flex-1 py-2 text-[13px]">
                    + Log refill (30)
                  </button>
                  <button type="button" onClick={() => logRefill(med.id, -1)} className="btn-secondary flex-1 py-2 text-[13px]">
                    − 1 dose used
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
