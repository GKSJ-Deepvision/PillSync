import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { todaysScheduledDoses, doseWindowStatus } from "../../lib/scheduling";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, CheckIcon, CrossIcon, SnoozeIcon, categoryStyle, PillIcon } from "../../components/icons";

/**
 * For each active medication, makes sure a dose_logs row exists for each of
 * today's reminder times (creates any missing ones as 'pending'), then loads
 * today's logs joined with medicine names for display.
 */
async function ensureTodaysDoseLogs(patientId) {
  const { data: meds } = await supabase
    .from("medications")
    .select("id, reminder_times, disease_category")
    .eq("patient_id", patientId)
    .eq("active", true);

  if (!meds) return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: existing } = await supabase
    .from("dose_logs")
    .select("medication_id, scheduled_for")
    .eq("patient_id", patientId)
    .gte("scheduled_for", todayStart.toISOString())
    .lte("scheduled_for", todayEnd.toISOString());

  const existingKeys = new Set(
    (existing ?? []).map((r) => `${r.medication_id}|${r.scheduled_for}`)
  );

  const toInsert = [];
  for (const med of meds) {
    const doses = todaysScheduledDoses(med.reminder_times);
    for (const d of doses) {
      const key = `${med.id}|${d.toISOString()}`;
      if (!existingKeys.has(key)) {
        toInsert.push({
          medication_id: med.id,
          patient_id: patientId,
          scheduled_for: d.toISOString(),
        });
      }
    }
  }

  if (toInsert.length > 0) {
    // ignoreDuplicates relies on the unique index on (medication_id, scheduled_for) —
    // if two calls race (e.g. React's dev-mode double effect), the second insert
    // is silently skipped instead of creating a duplicate row.
    await supabase
      .from("dose_logs")
      .upsert(toInsert, {
        onConflict: "medication_id,scheduled_for",
        ignoreDuplicates: true,
      });
  }
}

export default function RemindersPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    await ensureTodaysDoseLogs(user.id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("dose_logs")
      .select("id, scheduled_for, status, snoozed_until, medications(name, dosage, disease_category)")
      .eq("patient_id", user.id)
      .gte("scheduled_for", todayStart.toISOString())
      .lte("scheduled_for", todayEnd.toISOString())
      .order("scheduled_for", { ascending: true });

    setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const respond = async (logId, status, snoozeMinutes) => {
    const updates = { status, responded_at: new Date().toISOString() };
    if (status === "snoozed") {
      updates.snoozed_until = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
    }
    await supabase.from("dose_logs").update(updates).eq("id", logId);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon /> Dashboard
      </Link>
      <h1 className="heading text-2xl font-bold text-gray-900">Today's reminders</h1>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && logs.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-brand-200 p-8 text-center">
          <p className="text-sm text-slate-600">
            No doses scheduled today. Add a medicine with reminder times to see them here.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {logs.map((log) => {
          const scheduledTime = new Date(log.scheduled_for);
          const windowStatus =
            log.status === "pending" ? doseWindowStatus(scheduledTime) : null;
          const style = categoryStyle(log.medications?.disease_category);
          const isUrgent = log.status === "pending" && windowStatus !== "upcoming";

          return (
            <li
              key={log.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                isUrgent ? "border-amber-300" : "border-slate-100"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.dot}`}>
                    <PillIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{log.medications?.name}</p>
                    <p className="text-sm text-slate-500">
                      {log.medications?.dosage} ·{" "}
                      {scheduledTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={log.status} windowStatus={windowStatus} />
              </div>

              {log.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(log.id, "taken")}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <CheckIcon /> Taken
                  </button>
                  <button
                    onClick={() => respond(log.id, "missed")}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 transition-colors text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <CrossIcon /> Missed
                  </button>
                  <button
                    onClick={() => respond(log.id, "snoozed", 15)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <SnoozeIcon /> Snooze
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status, windowStatus }) {
  const map = {
    taken: { label: "Taken", cls: "bg-emerald-100 text-emerald-700" },
    missed: { label: "Missed", cls: "bg-rose-100 text-rose-700" },
    snoozed: { label: "Snoozed", cls: "bg-amber-100 text-amber-700" },
    pending:
      windowStatus === "overdue"
        ? { label: "Overdue", cls: "bg-rose-100 text-rose-700" }
        : windowStatus === "due"
        ? { label: "Due now", cls: "bg-amber-100 text-amber-700" }
        : { label: "Upcoming", cls: "bg-slate-100 text-slate-600" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${cls}`}>{label}</span>;
}
