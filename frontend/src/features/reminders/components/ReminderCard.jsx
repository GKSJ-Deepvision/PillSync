import { useState } from "react";
import { deactivateReminder, logReminderAction } from "../api";
import { FREQUENCIES, formatDateTime, formatTime, WEEKDAYS } from "../frequency";

const FREQUENCY_LABELS = Object.fromEntries(FREQUENCIES.map((f) => [f.value, f.label]));
const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.value, d.label]));

function scheduleSummary(reminder) {
  if (reminder.frequency === "WEEKLY" && reminder.day_of_week != null) {
    return `Every ${WEEKDAY_LABELS[reminder.day_of_week]}`;
  }
  if (reminder.frequency === "CUSTOM" && reminder.interval_days) {
    return `Every ${reminder.interval_days} day${reminder.interval_days === 1 ? "" : "s"}`;
  }
  return FREQUENCY_LABELS[reminder.frequency] || reminder.frequency;
}

export function ReminderCard({ reminder, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);

  async function runAction(action) {
    setBusy(true);
    setError(null);
    try {
      await logReminderAction(reminder.id, action, action === "SNOOZE" ? Number(snoozeMinutes) : undefined);
      setLastAction(action);
      onChanged?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    setBusy(true);
    setError(null);
    try {
      await deactivateReminder(reminder.id);
      onChanged?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const isSnoozed = Boolean(reminder.snoozed_until);

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition ${
        reminder.is_active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-slate-800">{formatTime(reminder.scheduled_time)}</p>
          <p className="text-sm text-slate-500">{scheduleSummary(reminder)}</p>
        </div>
        {isSnoozed && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            Snoozed
          </span>
        )}
        {!reminder.is_active && (
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
            Inactive
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-slate-500">
        Next due: <span className="font-medium text-slate-700">{formatDateTime(reminder.next_occurrence)}</span>
      </p>

      {lastAction && (
        <p className="mt-2 text-xs font-medium text-emerald-600">Logged: {lastAction}</p>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error.message}</p>}

      {reminder.is_active && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => runAction("TAKEN")}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Taken
          </button>
          <button
            onClick={() => runAction("MISSED")}
            disabled={busy}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Missed
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => runAction("SNOOZE")}
              disabled={busy}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Snooze
            </button>
            <input
              type="number"
              min={1}
              value={snoozeMinutes}
              onChange={(e) => setSnoozeMinutes(e.target.value)}
              className="w-14 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              aria-label="Snooze minutes"
            />
            <span className="text-xs text-slate-400">min</span>
          </div>
          <button
            onClick={handleDeactivate}
            disabled={busy}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
}
