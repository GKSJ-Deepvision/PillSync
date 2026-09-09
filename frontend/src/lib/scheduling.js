/**
 * Given a medication's reminder times ("HH:MM:SS" or "HH:MM" strings) and a
 * reference Date, returns each scheduled dose for that day as a Date object.
 */
export function todaysScheduledDoses(reminderTimes, referenceDate = new Date()) {
  return (reminderTimes || [])
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(referenceDate);
      d.setHours(h, m, 0, 0);
      return d;
    })
    .sort((a, b) => a - b);
}

/**
 * Classifies a scheduled dose time relative to "now":
 * - "upcoming": still in the future
 * - "due": within the grace window (default 30 min) after the scheduled time
 * - "overdue": past the grace window, should be logged as missed
 */
export function doseWindowStatus(scheduledFor, now = new Date(), graceMinutes = 30) {
  const diffMs = now - scheduledFor;
  const graceMs = graceMinutes * 60 * 1000;
  if (diffMs < 0) return "upcoming";
  if (diffMs <= graceMs) return "due";
  return "overdue";
}

/**
 * Computes a simple adherence percentage from a list of dose_logs statuses.
 * Only 'taken' and 'missed' count toward the total; 'pending'/'snoozed' are excluded.
 */
export function adherencePercentage(statuses) {
  const counted = statuses.filter((s) => s === "taken" || s === "missed");
  if (counted.length === 0) return null;
  const taken = counted.filter((s) => s === "taken").length;
  return Math.round((taken / counted.length) * 100);
}
