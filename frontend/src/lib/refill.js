/** Display helpers for the refill_forecast() results. */

export function urgency(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return "unknown";
  if (daysLeft <= 0) return "empty";
  if (daysLeft <= 5) return "low";
  if (daysLeft <= 10) return "soon";
  return "ok";
}

export const URGENCY_STYLES = {
  empty: { card: "bg-red-50 border-red-200", text: "text-red-700", bar: "bg-red-500", label: "Out of stock" },
  low: { card: "bg-red-50 border-red-200", text: "text-red-700", bar: "bg-red-500", label: "Low stock" },
  soon: { card: "bg-amber-50 border-amber-200", text: "text-amber-700", bar: "bg-amber-500", label: "Refill soon" },
  ok: { card: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500", label: "Stock OK" },
  unknown: { card: "bg-gray-50 border-gray-200", text: "text-gray-600", bar: "bg-gray-300", label: "No estimate" },
};

/** Bar length: 30+ days of stock = full. */
export function stockBarPercent(daysLeft, fullAtDays = 30) {
  if (!daysLeft || daysLeft <= 0) return 0;
  return Math.min(100, Math.round((daysLeft / fullAtDays) * 100));
}

export function basisNote(forecast) {
  return forecast.basis === "observed"
    ? "Based on the doses you actually took in the last 14 days."
    : "Based on your schedule (not enough dose history yet).";
}

export function daysLeftText(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return "Can't estimate yet";
  if (daysLeft < 1) return "Less than a day left";
  const d = Math.floor(daysLeft);
  return `About ${d} day${d === 1 ? "" : "s"} left`;
}

export function shortDate(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}