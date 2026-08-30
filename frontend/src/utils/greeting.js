export function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return { window: "night", label: "Still up" };
  if (hour < 12) return { window: "dawn", label: "Good morning" };
  if (hour < 17) return { window: "midday", label: "Good afternoon" };
  if (hour < 21) return { window: "dusk", label: "Good evening" };
  return { window: "night", label: "Good night" };
}
