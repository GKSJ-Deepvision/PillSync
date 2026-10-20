import { toISODate } from "./adherence";

export const SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

/** Time of day for a dose: Morning 5-12, Afternoon 12-17, Evening 17-21, otherwise Night. */
export function timeSlot(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/** Totals for a list of dose logs. Snoozed doses count as pending. */
export function summarizeLogs(logs = []) {
  let taken = 0;
  let missed = 0;
  let pending = 0;
  for (const log of logs) {
    if (log.status === "taken") taken += 1;
    else if (log.status === "missed") missed += 1;
    else pending += 1;
  }
  const completed = taken + missed;
  return {
    taken,
    missed,
    pending,
    total: logs.length,
    adherence: completed > 0 ? Math.round((taken / completed) * 100) : null,
  };
}

/** Current period and the period just before it, as local-midnight boundaries (end is exclusive). */
export function periodRanges(days, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);

  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    currentPeriod: { from: start, to: end },
    previousPeriod: { from: previousStart, to: start },
  };
}

/** Logs scheduled in [from, to). */
export function filterByRange(logs = [], from, to) {
  return logs.filter((log) => {
    const time = new Date(log.scheduled_for);
    return time >= from && time < to;
  });
}

/** One entry per day of the period, oldest first, grouped by the viewer's local date. */
export function dailyAdherence(logs = [], days, now = new Date()) {
  const { currentPeriod } = periodRanges(days, now);
  const byDay = new Map();
  for (const log of logs) {
    const key = toISODate(new Date(log.scheduled_for));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(log);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(currentPeriod.from);
    date.setDate(date.getDate() + i);
    const key = toISODate(date);
    const summary = summarizeLogs(byDay.get(key) ?? []);
    return { key, date, ...summary };
  });
}

/** Number of missed doses in each time of day. */
export function missedBySlot(logs = []) {
  const counts = Object.fromEntries(SLOTS.map((slot) => [slot, 0]));
  for (const log of logs) {
    if (log.status === "missed") counts[timeSlot(new Date(log.scheduled_for))] += 1;
  }
  return counts;
}

/** Difference in percentage points, or null when either side has no data. */
export function changeInPoints(current, previous) {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return null;
  }
  return current - previous;
}

/** "none", "critical" (below 50), "attention" (below 80) or "good". */
export function adherenceStatus(pct) {
  if (pct === null || pct === undefined) return "none";
  if (pct < 50) return "critical";
  if (pct < 80) return "attention";
  return "good";
}

/** The most recent missed dose, or null. */
export function lastMissed(logs = []) {
  let latest = null;
  for (const log of logs) {
    if (log.status !== "missed") continue;
    if (!latest || new Date(log.scheduled_for) > new Date(latest.scheduled_for)) latest = log;
  }
  return latest;
}