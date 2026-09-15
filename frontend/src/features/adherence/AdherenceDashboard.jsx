import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AdherenceBarChart from "../../components/charts/AdherenceBarChart";
import { useAuth } from "../../context/AuthContext";
import { listDoseHistory } from "../reminders/api";
import { computeAdherence, groupByDay, currentStreak, byMedication } from "../../lib/adherence";

const WINDOW_DAYS = 14;

export default function AdherenceDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - WINDOW_DAYS + 1);
    fromDate.setHours(0, 0, 0, 0);
    listDoseHistory(user.id, { fromDate: fromDate.toISOString() }).then(({ data }) => {
      setLogs(data);
      setLoading(false);
    });
  }, [user?.id]);

  const overall = useMemo(() => computeAdherence(logs), [logs]);
  const dayMap = useMemo(() => groupByDay(logs), [logs]);
  const streak = useMemo(() => currentStreak(dayMap), [dayMap]);
  const perMedication = useMemo(() => byMedication(logs), [logs]);

  const chartDays = useMemo(() => {
    const out = [];
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      const bucket = dayMap[key];
      const percentage = bucket && bucket.total > 0 ? Math.round((bucket.taken / bucket.total) * 100) : bucket ? null : null;
      out.push({ label: d.toLocaleDateString(undefined, { day: "numeric" }), percentage: bucket?.total ? percentage : null });
    }
    return out;
  }, [dayMap]);

  return (
    <DashboardLayout eyebrow="Adherence analytics" title="Adherence dashboard">
      {loading ? (
        <p className="font-body text-sm text-ink-fog">Crunching your dose history…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Overall adherence</p>
              <p className="mt-1 font-display text-3xl font-semibold" style={{ color: "var(--brand-deep)" }}>
                {overall.percentage === null ? "—" : `${overall.percentage}%`}
              </p>
              <p className="mt-1 font-body text-[12px] text-ink-fog">last {WINDOW_DAYS} days</p>
            </div>
            <div className="card text-center">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Current streak</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ink">{streak}</p>
              <p className="mt-1 font-body text-[12px] text-ink-fog">fully-adherent day{streak === 1 ? "" : "s"}</p>
            </div>
            <div className="card text-center">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Doses taken / missed</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ink">
                {overall.taken} / {overall.missed}
              </p>
              <p className="mt-1 font-body text-[12px] text-ink-fog">of {overall.total} logged</p>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Daily trend</h2>
            <div className="overflow-x-auto text-ink">
              <AdherenceBarChart days={chartDays} />
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-display text-base font-semibold text-ink">By medicine</h2>
            {perMedication.length === 0 ? (
              <p className="font-body text-sm text-ink-fog">No resolved doses in this window yet.</p>
            ) : (
              <div className="divide-y divide-ink/5">
                {perMedication.map((m) => (
                  <div key={m.medication?.name ?? "unknown"} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">{m.medication?.name ?? "Medicine"}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                        {m.taken} taken · {m.missed} missed
                      </p>
                    </div>
                    <span className="font-display text-lg font-semibold" style={{ color: "var(--brand-deep)" }}>
                      {m.percentage === null ? "—" : `${m.percentage}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
