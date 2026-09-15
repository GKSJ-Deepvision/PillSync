import { useState } from "react";
import { createReminders } from "../api";
import { FREQUENCIES, WEEKDAYS, timeSlotCountFor } from "../frequency";

const DEFAULT_TIMES = ["08:00", "20:00", "14:00"];

export function CreateReminderForm({ userId, medicineId, onCreated }) {
  const [frequency, setFrequency] = useState("ONCE_DAILY");
  const [times, setTimes] = useState(["08:00"]);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [intervalDays, setIntervalDays] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const slotCount = timeSlotCountFor(frequency);

  function handleFrequencyChange(value) {
    setFrequency(value);
    const count = timeSlotCountFor(value);
    setTimes(DEFAULT_TIMES.slice(0, count));
  }

  function handleTimeChange(index, value) {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!medicineId || !userId) {
      setError({ message: "Enter a User ID and Medicine ID above first." });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReminders({
        user_id: userId,
        medicine_id: medicineId,
        frequency,
        times: times.map((t) => (t.length === 5 ? `${t}:00` : t)),
        ...(frequency === "WEEKLY" ? { day_of_week: dayOfWeek } : {}),
        ...(frequency === "CUSTOM" ? { interval_days: Number(intervalDays) } : {}),
      });
      onCreated?.();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-800">New reminder</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => handleFrequencyChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: slotCount }).map((_, i) => (
          <div key={i}>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {slotCount === 1 ? "Time" : `Time ${i + 1}`}
            </label>
            <input
              type="time"
              value={times[i] || "08:00"}
              onChange={(e) => handleTimeChange(i, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
        ))}
      </div>

      {frequency === "WEEKLY" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Day of week</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {frequency === "CUSTOM" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Repeat every N days</label>
          <input
            type="number"
            min={1}
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message || "Something went wrong."}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create reminder"}
      </button>
    </form>
  );
}
