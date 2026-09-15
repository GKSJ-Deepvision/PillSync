/**
 * Refill / low-stock prediction — a documented rule-based formula, not a
 * trained model (see ml/src/refill_prediction/predict.py for the Python
 * mirror + the milestone-3 write-up on why a formula is the right scope
 * here). Kept as pure functions so they're trivial to unit test.
 *
 * Worked example from the spec: 60 tablets at 2/day (one schedule, every
 * day of the week) -> dailyDoseTotal = 2 -> daysRemaining = 30.
 */

/** Average units-per-day across a set of active schedules, honoring
 * partial-week schedules (e.g. "3x a week" contributes 3/7 per day). */
export function dailyDoseTotal(schedules = []) {
  if (!schedules.length) return 0;
  const weeklyTotal = schedules.reduce((sum, s) => {
    const daysActive = s.days_of_week?.length ?? 7;
    return sum + Number(s.dose_quantity || 0) * daysActive;
  }, 0);
  return weeklyTotal / 7;
}

function addDays(date, days) {
  const source = new Date(date);
  const d = new Date(Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * @param {object} args
 * @param {number} args.stockQuantity
 * @param {Array}  args.schedules - active medication_schedules rows
 * @param {number} [args.refillLeadDays] - days of buffer before depletion
 * @param {Date}   [args.today]
 */
export function predictRefill({
  stockQuantity,
  schedules = [],
  refillLeadDays = 5,
  today = new Date(),
}) {
  const dailyDose = dailyDoseTotal(schedules);

  if (dailyDose <= 0) {
    return {
      dailyDose: 0,
      daysRemaining: null,
      depletionDate: null,
      refillByDate: null,
      status: "no-schedule",
    };
  }

  const daysRemaining = Math.max(0, Math.floor(Number(stockQuantity || 0) / dailyDose));
  const depletionDate = addDays(today, daysRemaining);
  const refillByDate = addDays(depletionDate, -refillLeadDays);

  let status = "ok";
  if (daysRemaining <= 0) status = "empty";
  else if (daysRemaining <= refillLeadDays) status = "low";

  return { dailyDose, daysRemaining, depletionDate, refillByDate, status };
}

export const REFILL_STATUS_LABEL = {
  "no-schedule": "No active schedule",
  empty: "Out of stock",
  low: "Refill soon",
  ok: "Stocked",
};
