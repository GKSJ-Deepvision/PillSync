import { mondayOf, toISODate } from "./adherence";

/** Count rows by a key; missing or blank keys are grouped under `fallback`. */
export function countBy(rows = [], getKey, fallback = "Uncategorised") {
  const counts = {};
  for (const row of rows) {
    const raw = getKey(row);
    const key = raw && String(raw).trim() ? String(raw).trim() : fallback;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** [[key, count], ...] with the largest count first (ties keep alphabetical order). */
export function sortedEntries(counts = {}) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Sign-ups per week for the last `weeks` weeks, oldest first. */
export function weeklySignups(rows = [], weeks = 8, now = new Date()) {
  const start = mondayOf(now);
  start.setDate(start.getDate() - (weeks - 1) * 7);

  const buckets = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    return { label: toISODate(d).slice(5), count: 0 };
  });

  for (const row of rows) {
    const created = new Date(row.created_at);
    if (Number.isNaN(created.getTime()) || created < start || created > now) continue;
    const index = Math.floor((created - start) / (7 * 24 * 60 * 60 * 1000));
    if (buckets[index]) buckets[index].count += 1;
  }
  return buckets;
}

/** Percentage of resolved doses that were taken; null when nothing was resolved. */
export function adherencePct(taken = 0, missed = 0) {
  const total = taken + missed;
  return total === 0 ? null : Math.round((taken / total) * 100);
}