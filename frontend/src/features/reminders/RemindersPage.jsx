import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  todaysScheduledDoses,
  doseWindowStatus,
} from "../../lib/scheduling";
import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckIcon,
  CrossIcon,
  SnoozeIcon,
  categoryStyle,
  PillIcon,
} from "../../components/icons";

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
    (existing ?? []).map(
      (r) => `${r.medication_id}|${r.scheduled_for}`
    )
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
    await supabase.from("dose_logs").upsert(toInsert, {
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
      .select(
        "id, scheduled_for, status, snoozed_until, medications(name, dosage, disease_category)"
      )
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
    const updates = {
      status,
      responded_at: new Date().toISOString(),
    };

    if (status === "snoozed") {
      updates.snoozed_until = new Date(
        Date.now() + snoozeMinutes * 60 * 1000
      ).toISOString();
    }

    await supabase
      .from("dose_logs")
      .update(updates)
      .eq("id", logId);

    load();
  };

  const takenCount = logs.filter(
    (log) => log.status === "taken"
  ).length;

  const pendingCount = logs.filter(
    (log) => log.status === "pending"
  ).length;

  const missedCount = logs.filter(
    (log) => log.status === "missed"
  ).length;

  return (
    <div
      className="w-full min-h-screen"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">

        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm transition-colors mb-3"
              style={{ color: "#64748B" }}
            >
              <ArrowLeftIcon />
              Dashboard
            </Link>

            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "#0F172A" }}
            >
              Today's Reminders
            </h1>

            <p
              className="text-sm mt-1"
              style={{ color: "#64748B" }}
            >
              Keep track of your medication schedule for today.
            </p>
          </div>

          {!loading && logs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <SummaryCard
                label="Taken"
                value={takenCount}
                type="taken"
              />

              <SummaryCard
                label="Pending"
                value={pendingCount}
                type="pending"
              />

              <SummaryCard
                label="Missed"
                value={missedCount}
                type="missed"
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              className="mx-auto mb-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "#CCFBF1",
                color: "#0F766E",
              }}
            >
              <PillIcon className="w-5 h-5" />
            </div>

            <p
              className="text-sm"
              style={{ color: "#64748B" }}
            >
              Loading today's reminders...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #99F6E4",
            }}
          >
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: "#CCFBF1",
                color: "#0F766E",
              }}
            >
              <PillIcon className="w-7 h-7" />
            </div>

            <h2
              className="text-lg font-semibold"
              style={{ color: "#0F172A" }}
            >
              No doses scheduled today
            </h2>

            <p
              className="text-sm mt-2 max-w-md mx-auto"
              style={{ color: "#64748B" }}
            >
              Add a medicine with reminder times to start tracking
              your medication schedule.
            </p>

            <Link
              to="/medications"
              className="inline-flex items-center mt-5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: "#0D9488",
                color: "#FFFFFF",
              }}
            >
              View Medicines
            </Link>
          </div>
        )}

        {/* Reminder list */}
        {!loading && logs.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {logs.map((log) => {
              const scheduledTime = new Date(log.scheduled_for);

              const windowStatus =
                log.status === "pending"
                  ? doseWindowStatus(scheduledTime)
                  : null;

              const style = categoryStyle(
                log.medications?.disease_category
              );

              const isUrgent =
                log.status === "pending" &&
                windowStatus !== "upcoming";

              return (
                <div
                  key={log.id}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    backgroundColor: isUrgent
                      ? "#FFFBEB"
                      : "#FFFFFF",
                    border: isUrgent
                      ? "1px solid #FDE68A"
                      : "1px solid #E2E8F0",
                    boxShadow: isUrgent
                      ? "0 4px 12px rgba(245, 158, 11, 0.08)"
                      : "0 2px 8px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  {/* Medicine information */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.dot}`}
                      >
                        <PillIcon className="w-6 h-6" />
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="font-semibold truncate"
                          style={{ color: "#0F172A" }}
                        >
                          {log.medications?.name || "Medicine"}
                        </h2>

                        <p
                          className="text-sm mt-1"
                          style={{ color: "#64748B" }}
                        >
                          {log.medications?.dosage ||
                            "Dosage not specified"}
                        </p>

                        <p
                          className="text-xs mt-1"
                          style={{ color: "#94A3B8" }}
                        >
                          {scheduledTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={log.status}
                      windowStatus={windowStatus}
                    />
                  </div>

                  {/* Actions */}
                  {log.status === "pending" && (
                    <div
                      className="grid grid-cols-3 gap-2 mt-5 pt-4"
                      style={{
                        borderTop: "1px solid #E2E8F0",
                      }}
                    >
                      <button
                        onClick={() =>
                          respond(log.id, "taken")
                        }
                        className="text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: "#DCFCE7",
                          color: "#15803D",
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <CheckIcon />
                        Taken
                      </button>

                      <button
                        onClick={() =>
                          respond(log.id, "missed")
                        }
                        className="text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: "#FFE4E6",
                          color: "#BE123C",
                          border: "1px solid #FECDD3",
                        }}
                      >
                        <CrossIcon />
                        Missed
                      </button>

                      <button
                        onClick={() =>
                          respond(log.id, "snoozed", 15)
                        }
                        className="text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <SnoozeIcon />
                        Snooze
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, type }) {
  const styles = {
    taken: {
      backgroundColor: "#F0FDF4",
      border: "1px solid #BBF7D0",
      labelColor: "#15803D",
      valueColor: "#166534",
    },

    pending: {
      backgroundColor: "#FFFBEB",
      border: "1px solid #FDE68A",
      labelColor: "#B45309",
      valueColor: "#92400E",
    },

    missed: {
      backgroundColor: "#FFF7F7",
      border: "1px solid #FECDD3",
      labelColor: "#BE123C",
      valueColor: "#9F1239",
    },
  };

  const current = styles[type];

  return (
    <div
      className="px-4 py-2.5 rounded-xl min-w-[78px]"
      style={{
        backgroundColor: current.backgroundColor,
        border: current.border,
      }}
    >
      <p
        className="text-xs font-medium"
        style={{ color: current.labelColor }}
      >
        {label}
      </p>

      <p
        className="text-lg font-bold mt-0.5"
        style={{ color: current.valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status, windowStatus }) {
  const map = {
    taken: {
      label: "Taken",
      backgroundColor: "#DCFCE7",
      color: "#15803D",
      border: "#BBF7D0",
    },

    missed: {
      label: "Missed",
      backgroundColor: "#FFE4E6",
      color: "#BE123C",
      border: "#FECDD3",
    },

    snoozed: {
      label: "Snoozed",
      backgroundColor: "#FEF3C7",
      color: "#B45309",
      border: "#FDE68A",
    },

    pending:
      windowStatus === "overdue"
        ? {
            label: "Overdue",
            backgroundColor: "#FFE4E6",
            color: "#BE123C",
            border: "#FECDD3",
          }
        : windowStatus === "due"
        ? {
            label: "Due now",
            backgroundColor: "#FEF3C7",
            color: "#B45309",
            border: "#FDE68A",
          }
        : {
            label: "Upcoming",
            backgroundColor: "#EFF6FF",
            color: "#2563EB",
            border: "#BFDBFE",
          },
  };

  const current = map[status] ?? map.pending;

  return (
    <span
      className="text-xs px-2.5 py-1.5 rounded-full font-semibold shrink-0"
      style={{
        backgroundColor: current.backgroundColor,
        color: current.color,
        border: `1px solid ${current.border}`,
      }}
    >
      {current.label}
    </span>
  );
}