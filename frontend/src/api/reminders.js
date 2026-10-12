import { apiClient, USE_MOCK_API } from './client';
import { getScopedStorage, setScopedStorage } from '../utils/userStorage';

// Real dynamic reminders storage linked to user's saved medications (Zero dummy data)
function getStoredReminders() {
  const existingReminders = getScopedStorage('pillsync_reminders', []) || [];
  let meds = getScopedStorage('pillsync_patient_medications', null);

  if (!meds || !Array.isArray(meds) || meds.length === 0) {
    return [];
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const merged = [];

  meds.forEach((m) => {
    const schedules =
      Array.isArray(m.schedule) && m.schedule.length > 0 ? m.schedule : ['08:00 AM'];

    schedules.forEach((timeStr) => {
      const generatedId = `rem-${m.id || m.name}-${timeStr.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Check if this dose was already recorded/taken in existing reminders
      const existing = existingReminders.find(
        (er) =>
          String(er.id) === String(generatedId) ||
          (er.medicationId && String(er.medicationId) === String(m.id) && er.time === timeStr) ||
          (er.medicationName &&
            er.medicationName.trim().toLowerCase() === m.name.trim().toLowerCase() &&
            er.time === timeStr)
      );

      const isToday =
        existing &&
        (existing.date === todayStr ||
          (existing.takenAt && existing.takenAt.split('T')[0] === todayStr));
      const preservedStatus = existing && isToday ? existing.status || 'upcoming' : 'upcoming';

      if (existing) {
        merged.push({
          ...existing,
          id: existing.id || generatedId,
          medicationId: m.id || existing.medicationId,
          medicationName: m.name,
          dosage: m.dosage || existing.dosage || '',
          time: timeStr,
          schedule: timeStr.includes('PM') ? 'Evening' : 'Morning',
          date: todayStr,
          status: preservedStatus,
        });
      } else {
        merged.push({
          id: generatedId,
          medicationId: m.id,
          medicationName: m.name,
          schedule: timeStr.includes('PM') ? 'Evening' : 'Morning',
          time: timeStr,
          dosage: m.dosage || '',
          status: 'upcoming',
          date: todayStr,
          frequency: m.frequency || 'Daily',
          nextReminder: todayStr,
        });
      }
    });
  });

  saveStoredReminders(merged);
  return merged;
}

function saveStoredReminders(rems) {
  setScopedStorage('pillsync_reminders', rems);
  try {
    localStorage.setItem('pillsync_reminders', JSON.stringify(rems));
  } catch {
    // ignore localStorage failure
  }
}

const mockReminderApi = {
  getReminders: async (filters = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    let result = getStoredReminders();
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.date) {
      result = result.filter((r) => r.date === filters.date);
    }
    return result;
  },

  getReminderById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const rems = getStoredReminders();
    return rems.find((r) => String(r.id) === String(id));
  },

  markTaken: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const rems = getStoredReminders();
    let updated = false;

    const modified = rems.map((r) => {
      if (String(r.id) === String(id) || r.id === id) {
        updated = true;
        return {
          ...r,
          status: 'taken',
          takenAt: new Date().toISOString(),
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return r;
    });

    if (updated) {
      saveStoredReminders(modified);
      return modified.find((r) => String(r.id) === String(id));
    }

    // Loose match fallback
    const loose = rems.map((r) => {
      if (String(r.id).includes(String(id)) || String(id).includes(String(r.id))) {
        return {
          ...r,
          status: 'taken',
          takenAt: new Date().toISOString(),
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return r;
    });
    saveStoredReminders(loose);
    return { id, status: 'taken' };
  },

  markAsTaken: async (id) => {
    return mockReminderApi.markTaken(id);
  },

  markMissed: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const rems = getStoredReminders();
    const modified = rems.map((r) =>
      String(r.id) === String(id) || r.id === id ? { ...r, status: 'missed' } : r
    );
    saveStoredReminders(modified);
    return modified.find((r) => String(r.id) === String(id)) || { id, status: 'missed' };
  },

  markAsMissed: async (id) => {
    return mockReminderApi.markMissed(id);
  },

  snoozeReminder: async (id, minutes = 30) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const rems = getStoredReminders();
    const snoozedTime = new Date();
    snoozedTime.setMinutes(snoozedTime.getMinutes() + minutes);

    const modified = rems.map((r) =>
      String(r.id) === String(id) || r.id === id
        ? { ...r, status: 'snoozed', nextReminder: snoozedTime.toISOString() }
        : r
    );
    saveStoredReminders(modified);
    return modified.find((r) => String(r.id) === String(id)) || { id, status: 'snoozed' };
  },

  getTodayReminders: async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const today = new Date().toISOString().split('T')[0];
    const rems = getStoredReminders();
    return rems.filter((r) => r.date === today);
  },

  getUpcomingReminders: async (days = 7) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const rems = getStoredReminders();
    return rems.filter((r) => r.status === 'upcoming').slice(0, days);
  },
};

const realReminderApi = {
  getReminders: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiClient
      .get(`/reminders?${params}`)
      .then((res) => res.data)
      .catch(() => mockReminderApi.getReminders(filters));
  },

  getReminderById: (id) =>
    apiClient
      .get(`/reminders/${id}`)
      .then((res) => res.data)
      .catch(() => mockReminderApi.getReminderById(id)),

  markTaken: async (id, patientId) => {
    try {
      const res = await apiClient.patch(`/reminders/${id}/status/`, {
        status: 'TAKEN',
        patient_id: patientId,
      });
      mockReminderApi.markTaken(id);
      return res.data;
    } catch {
      try {
        const res = await apiClient.post(`/reminders/${id}/taken`);
        mockReminderApi.markTaken(id);
        return res.data;
      } catch {
        return mockReminderApi.markTaken(id);
      }
    }
  },

  markAsTaken: function (id, patientId) {
    return this.markTaken(id, patientId);
  },

  markMissed: async (id, patientId) => {
    try {
      const res = await apiClient.patch(`/reminders/${id}/status/`, {
        status: 'MISSED',
        patient_id: patientId,
      });
      mockReminderApi.markMissed(id);
      return res.data;
    } catch {
      try {
        const res = await apiClient.post(`/reminders/${id}/missed`);
        mockReminderApi.markMissed(id);
        return res.data;
      } catch {
        return mockReminderApi.markMissed(id);
      }
    }
  },

  markAsMissed: function (id, patientId) {
    return this.markMissed(id, patientId);
  },

  snoozeReminder: (id, minutes = 30) =>
    apiClient
      .post(`/reminders/${id}/snooze`, { minutes })
      .then((res) => {
        mockReminderApi.snoozeReminder(id, minutes);
        return res.data;
      })
      .catch(() => mockReminderApi.snoozeReminder(id, minutes)),

  getTodayReminders: () =>
    apiClient
      .get('/reminders/today')
      .then((res) => res.data)
      .catch(() => mockReminderApi.getTodayReminders()),

  getUpcomingReminders: (days = 7) =>
    apiClient
      .get('/reminders/upcoming', { params: { days } })
      .then((res) => res.data)
      .catch(() => mockReminderApi.getUpcomingReminders(days)),
};

export const reminderApi = USE_MOCK_API ? mockReminderApi : realReminderApi;
