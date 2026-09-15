import { apiClient } from "../../api/client";

/**
 * @typedef {Object} ReminderPayload
 * @property {string} medicine_id
 * @property {string} user_id
 * @property {"ONCE_DAILY"|"TWICE_DAILY"|"THREE_TIMES_DAILY"|"WEEKLY"|"AS_NEEDED"|"CUSTOM"} frequency
 * @property {string[]} times - "HH:MM:SS" entries
 * @property {number} [day_of_week] - 0=Monday..6=Sunday, required for WEEKLY
 * @property {number} [interval_days] - required for CUSTOM
 */

export function listReminders({ userId, medicineId, isActive }) {
  return apiClient
    .get("/v1/reminders", {
      params: {
        user_id: userId,
        medicine_id: medicineId || undefined,
        is_active: isActive,
      },
    })
    .then((res) => res.data);
}

/** @param {ReminderPayload} payload */
export function createReminders(payload) {
  return apiClient.post("/v1/reminders", payload).then((res) => res.data);
}

export function updateReminder(reminderId, payload) {
  return apiClient.patch(`/v1/reminders/${reminderId}`, payload).then((res) => res.data);
}

export function deactivateReminder(reminderId) {
  return apiClient.post(`/v1/reminders/${reminderId}/deactivate`).then((res) => res.data);
}

/** @param {"TAKEN"|"MISSED"|"SNOOZE"} action */
export function logReminderAction(reminderId, action, snoozeMinutes) {
  return apiClient
    .post(`/v1/reminders/${reminderId}/actions`, {
      action,
      ...(snoozeMinutes ? { snooze_minutes: snoozeMinutes } : {}),
    })
    .then((res) => res.data);
}
