/**
 * Thin wrapper around the browser Notification API. Reminders are still
 * fully usable without permission (the in-app reminder list is the source
 * of truth) — this only adds a native OS popup on top when granted, and a
 * page-title flash as a fallback everyone gets for free.
 */

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** setTimeout has a ~24.8 day max delay before it fires immediately; only
 * schedule reminders due within the next 6 hours so we never hit that. */
const MAX_SCHEDULE_MS = 6 * 60 * 60 * 1000;

/** Returns a timeout id you can clearTimeout() later, or null if this dose
 * is already due, too far in the future, or notifications aren't granted. */
export function scheduleDoseNotification(dose, medicationName) {
  if (notificationPermission() !== "granted") return null;
  const delay = new Date(dose.scheduled_for).getTime() - Date.now();
  if (delay < 0 || delay > MAX_SCHEDULE_MS) return null;

  return setTimeout(() => {
    try {
      const n = new Notification("PillSync — time for your dose", {
        body: `${medicationName}${dose.dose_quantity ? ` · ${dose.dose_quantity} dose(s)` : ""}`,
        tag: dose.id,
        icon: "/pill-favicon.svg",
      });
      n.onclick = () => window.focus();
    } catch {
      // Some browsers throw if the tab is backgrounded oddly; never let a
      // reminder crash the app.
    }
  }, delay);
}
