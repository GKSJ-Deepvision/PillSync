/**
 * Adherence analytics — pure functions over a list of `dose_logs` rows
 * (`{ scheduled_for, status, medication_id }`). Only "taken" and "missed"
 * count toward the percentage; "pending"/"snoozed" doses haven't resolved
 * yet and would understate today's adherence if included.
 */

export function computeAdherence(doseLogs = []) {
  const resolved = doseLogs.filter((d) => d.status === "taken" || d.status === "missed");
  const taken = resolved.filter((d) => d.status === "taken").length;
  const total = resolved.length;
  return {
    taken,
    missed: total - taken,
    total,
    percentage: total ? Math.round((taken / total) * 100) : null,
  };
}

/** Buckets dose logs by calendar day (YYYY-MM-DD, local date of scheduled_for). */
export function groupByDay(doseLogs = []) {
  const map = {};
  for (const d of doseLogs) {
    const day = new Date(d.scheduled_for).toLocaleDateString("en-CA"); // YYYY-MM-DD
    map[day] ??= { taken: 0, missed: 0, pending: 0, total: 0 };
    map[day].total += 1;
    if (d.status === "taken") map[day].taken += 1;
    else if (d.status === "missed") map[day].missed += 1;
    else map[day].pending += 1;
  }
  return map;
}

/** Consecutive fully-adherent days, most recent first, stopping at the
 * first day that had a resolved-but-not-fully-taken outcome. Days with no
 * doses scheduled at all don't break the streak (nothing to miss). */
export function currentStreak(dayMap) {
  const days = Object.keys(dayMap).sort((a, b) => (a < b ? 1 : -1));
  let streak = 0;
  for (const day of days) {
    const d = dayMap[day];
    if (d.total === 0) continue;
    if (d.pending > 0) continue; // day not finished yet, skip without breaking
    if (d.taken === d.total) streak += 1;
    else break;
  }
  return streak;
}

export function byMedication(doseLogs = []) {
  const map = {};
  for (const d of doseLogs) {
    const key = d.medication_id;
    map[key] ??= { medication: d.medications, taken: 0, missed: 0, total: 0 };
    if (d.status === "taken" || d.status === "missed") {
      map[key].total += 1;
      if (d.status === "taken") map[key].taken += 1;
      else map[key].missed += 1;
    }
  }
  return Object.values(map).map((m) => ({
    ...m,
    percentage: m.total ? Math.round((m.taken / m.total) * 100) : null,
  }));
}
