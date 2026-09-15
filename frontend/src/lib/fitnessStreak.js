/**
 * Streak analytics over `fitness_logs` rows
 * (`{ log_date, completed_exercise_ids, diet_followed }`). A day "counts"
 * toward the streak if the patient logged at least one completed exercise
 * or marked their diet as followed — mirrors how lib/adherence.js treats a
 * day as resolved only once something meaningful happened on it.
 */

function dayCounts(log) {
  return (log.completed_exercise_ids?.length ?? 0) > 0 || log.diet_followed === true;
}

/** Current consecutive-day streak counting back from today (or yesterday,
 * so a streak isn't lost just because today hasn't been logged yet). */
export function currentFitnessStreak(logs = []) {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  let streak = 0;
  const cursor = new Date();

  // If today isn't logged yet, start checking from yesterday instead of
  // zeroing the streak out at the first look of the day.
  const todayKey = cursor.toLocaleDateString("en-CA");
  if (!byDate.has(todayKey) || !dayCounts(byDate.get(todayKey))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (;;) {
    const key = cursor.toLocaleDateString("en-CA");
    const log = byDate.get(key);
    if (!log || !dayCounts(log)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive counting days within the fetched window. */
export function longestFitnessStreak(logs = []) {
  const dates = [...new Set(logs.filter(dayCounts).map((l) => l.log_date))].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    if (prev) {
      const diffDays = (new Date(d) - new Date(prev)) / 86400000;
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

/** Last `days` entries as { date, active } for a simple calendar heatmap. */
export function buildHeatmap(logs = [], days = 30) {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const out = [];
  const cursor = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    const log = byDate.get(key);
    out.push({ date: key, active: !!log && dayCounts(log) });
  }
  return out;
}
