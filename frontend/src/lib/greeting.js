/**
 * Returns a time-of-day greeting window/label for the given hour (0-23).
 * Boundaries: [5,12) morning, [12,17) afternoon, [17,21) evening, else night.
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { window: "morning", label: "Good morning" };
  if (hour >= 12 && hour < 17) return { window: "afternoon", label: "Good afternoon" };
  if (hour >= 17 && hour < 21) return { window: "evening", label: "Good evening" };
  return { window: "night", label: "Good night" };
}
