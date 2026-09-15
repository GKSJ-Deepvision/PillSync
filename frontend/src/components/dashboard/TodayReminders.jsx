import { useState } from "react";
import { useTodayDoses } from "../../features/reminders/useTodayDoses";
import { notificationPermission, requestNotificationPermission } from "../../features/reminders/notifications";

const STATUS_STYLE = {
  pending: { label: "Upcoming", className: "bg-porcelain-dim text-ink-fog" },
  snoozed: { label: "Snoozed", className: "bg-amber-100 text-amber-700" },
  taken: { label: "Taken", className: "bg-mint-soft text-mint-deep" },
  missed: { label: "Missed", className: "bg-rose-soft text-rose-deep" },
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export { useTodayDoses };

export default function TodayReminders({ patientId }) {
  const { doses, loading, takeAction } = useTodayDoses(patientId);
  const [permission, setPermission] = useState(notificationPermission());

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  if (loading) {
    return <p className="font-body text-sm text-ink-fog">Loading today&apos;s reminders…</p>;
  }

  return (
    <div className="space-y-3">
      {permission === "default" && (
        <button
          type="button"
          onClick={enableNotifications}
          className="flex w-full items-center justify-between rounded-xl border border-dashed border-ink/15 px-4 py-3 text-left transition-colors hover:bg-porcelain-dim"
        >
          <span className="font-body text-[13px] text-ink-fog">
            Turn on browser notifications to get reminded the moment a dose is due.
          </span>
          <span className="font-body text-[13px] font-semibold" style={{ color: "var(--brand-deep)" }}>
            Enable
          </span>
        </button>
      )}

      {doses.length === 0 ? (
        <p className="rounded-xl bg-porcelain-dim px-4 py-6 text-center font-body text-sm text-ink-fog">
          No doses scheduled today — add a medicine to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {doses.map((d) => {
            const status = STATUS_STYLE[d.status] ?? STATUS_STYLE.pending;
            const actionable = d.status === "pending" || d.status === "snoozed";
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/5 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {d.medications?.name ?? "Medicine"}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                    {formatTime(d.scheduled_for)} · {d.dose_quantity} dose(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge ${status.className}`}>{status.label}</span>
                  {actionable && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => takeAction(d.id, "taken")}
                        className="rounded-lg px-2.5 py-1.5 font-body text-[12px] font-semibold text-white"
                        style={{ backgroundColor: "var(--brand)" }}
                      >
                        Taken
                      </button>
                      <button
                        type="button"
                        onClick={() => takeAction(d.id, "snooze")}
                        className="rounded-lg border border-ink/10 px-2.5 py-1.5 font-body text-[12px] font-semibold text-ink-fog"
                      >
                        Snooze
                      </button>
                      <button
                        type="button"
                        onClick={() => takeAction(d.id, "missed")}
                        className="rounded-lg border border-ink/10 px-2.5 py-1.5 font-body text-[12px] font-semibold text-rose"
                      >
                        Missed
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
