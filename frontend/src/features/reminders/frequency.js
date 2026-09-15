export const FREQUENCIES = [
  { value: "ONCE_DAILY", label: "Once daily", timeSlotCount: 1 },
  { value: "TWICE_DAILY", label: "Twice daily (morning / night)", timeSlotCount: 2 },
  { value: "THREE_TIMES_DAILY", label: "Three times daily", timeSlotCount: 3 },
  { value: "WEEKLY", label: "Weekly", timeSlotCount: 1 },
  { value: "AS_NEEDED", label: "As needed", timeSlotCount: 1 },
  { value: "CUSTOM", label: "Custom interval", timeSlotCount: 1 },
];

export const WEEKDAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export function timeSlotCountFor(frequency) {
  return FREQUENCIES.find((f) => f.value === frequency)?.timeSlotCount ?? 1;
}

export function formatTime(hhmmss) {
  if (!hhmmss) return "—";
  const [h, m] = hhmmss.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${suffix}`;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
