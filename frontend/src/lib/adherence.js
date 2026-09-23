/** Helpers for the weekly adherence report (rows come from the adherence_* SQL functions). */

export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the week containing `date` (matches Postgres date_trunc('week')). */
export function mondayOf(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekRange(offsetWeeks = 0, ref = new Date()) {
  const start = mondayOf(ref);
  start.setDate(start.getDate() + offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end, from: toISODate(start), to: toISODate(end) };
}

export function weekLabel({ start, end }) {
  const f = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(start)} – ${f(end)}`;
}

/** Totals for a list of daily rows. pct is null when nothing was resolved. */
export function summarize(rows = []) {
  const taken = rows.reduce((s, r) => s + (r.taken || 0), 0);
  const missed = rows.reduce((s, r) => s + (r.missed || 0), 0);
  const total = taken + missed;
  return { taken, missed, pct: total === 0 ? null : Math.round((100 * taken) / total) };
}

/**
 * Consecutive perfect days, counted back from the latest row. Days with no doses neither
 * extend nor break the streak.
 */
export function currentStreak(rows = []) {
  let streak = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const pct = rows[i].pct;
    if (pct === null || pct === undefined) continue;
    if (pct === 100) streak += 1;
    else break;
  }
  return streak;
}

export function compareWeeks(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) {
    return { delta: null, direction: "none" };
  }
  const delta = current - previous;
  return { delta, direction: delta > 0 ? "up" : delta < 0 ? "down" : "same" };
}

export function pctColor(pct) {
  if (pct === null || pct === undefined) return "#d1d5db";
  if (pct >= 90) return "#10b981";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
}

/** Plain-language findings for the report. */
export function insights({ weekPct, bySlot = [], byMed = [] }) {
  const out = [];
  if (weekPct === null) return ["No completed doses in this week yet."];
  if (weekPct >= 90) out.push("Excellent adherence this week. Keep it up.");
  else if (weekPct >= 70) out.push("Good, with room to improve. Try to catch the doses you miss most.");
  else out.push("Several doses were missed this week. Consider a caregiver check-in or moving reminder times.");
  const slots = bySlot.filter((s) => s.pct !== null && s.taken + s.missed >= 3).sort((a, b) => a.pct - b.pct);
  if (slots.length > 1 && slots[0].pct < 80) out.push(`Most missed doses are in the ${slots[0].slot} (${slots[0].pct}% taken).`);
  const meds = byMed.filter((m) => m.pct !== null && m.taken + m.missed >= 3).sort((a, b) => a.pct - b.pct);
  if (meds.length > 1 && meds[0].pct < 80) out.push(`${meds[0].name} is the medicine you miss most (${meds[0].pct}% taken).`);
  return out;
}