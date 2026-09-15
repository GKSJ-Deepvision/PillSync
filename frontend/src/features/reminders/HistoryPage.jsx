import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { listDoseHistory } from "./api";
import { listMedications } from "../medications/api";

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const STATUS_BADGE = {
  taken: "bg-mint-soft text-mint-deep",
  missed: "bg-rose-soft text-rose-deep",
  pending: "bg-porcelain-dim text-ink-fog",
  snoozed: "bg-amber-100 text-amber-700",
  skipped: "bg-porcelain-dim text-ink-fog",
};

function groupByDate(logs) {
  const groups = {};
  for (const log of logs) {
    const day = new Date(log.scheduled_for).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    groups[day] ??= [];
    groups[day].push(log);
  }
  return groups;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [rangeDays, setRangeDays] = useState(30);
  const [medicationId, setMedicationId] = useState("");
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    listMedications(user.id).then(({ data }) => setMedications(data));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - rangeDays);
    listDoseHistory(user.id, {
      fromDate: fromDate.toISOString(),
      medicationId: medicationId || undefined,
      status: status || undefined,
    }).then(({ data }) => {
      setLogs(data);
      setLoading(false);
    });
  }, [user?.id, rangeDays, medicationId, status]);

  const groups = useMemo(() => groupByDate(logs), [logs]);

  return (
    <DashboardLayout eyebrow="Medication history" title="Dose history">
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="field-input w-auto" value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}>
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="field-input w-auto" value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
          <option value="">All medicines</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select className="field-input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="taken">Taken</option>
          <option value="missed">Missed</option>
          <option value="pending">Pending</option>
          <option value="snoozed">Snoozed</option>
        </select>
      </div>

      {loading ? (
        <p className="font-body text-sm text-ink-fog">Loading history…</p>
      ) : logs.length === 0 ? (
        <p className="card text-center font-body text-sm text-ink-fog">No dose history in this range yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, dayLogs]) => (
            <div key={day}>
              <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-fog">{day}</h3>
              <div className="card divide-y divide-ink/5 p-0">
                {dayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-semibold text-ink">{log.medications?.name}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                        {new Date(log.scheduled_for).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ·{" "}
                        {log.dose_quantity} dose(s)
                      </p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[log.status] ?? STATUS_BADGE.pending}`}>{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
