import { apiClient } from './client';

const PATIENT_ID = Number(import.meta.env.VITE_PATIENT_ID || 1);

const normalizeReminder = (r) => ({
  ...r,
  medicationId: r.schedule,
  medicationName: r.medicine_name,
  time: r.dose_datetime
    ? new Date(r.dose_datetime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '',
  date: r.dose_datetime ? r.dose_datetime.split('T')[0] : '',
  dosage: '',
  schedule: r.dose_datetime || '',
  status: r.status?.toLowerCase() || 'upcoming',
});

const getList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
};

export const reminderApi = {
  getReminders: async (filters = {}) => {
    const response = await apiClient.get('/reminders/', {
      params: { ...filters, patient_id: PATIENT_ID },
    });
    return getList(response).map(normalizeReminder);
  },

  getReminderById: async (id) => {
    const response = await apiClient.get(`/reminders/${id}/`);
    return normalizeReminder(response.data);
  },

  markTaken: async (id) => {
    const response = await apiClient.patch(`/reminders/${id}/status/`, {
      patient_id: PATIENT_ID,
      status: 'TAKEN',
    });
    return normalizeReminder(response.data);
  },

  markMissed: async (id) => {
    const response = await apiClient.patch(`/reminders/${id}/status/`, {
      patient_id: PATIENT_ID,
      status: 'MISSED',
    });
    return normalizeReminder(response.data);
  },

  getTodayReminders: async () => {
    const response = await apiClient.get('/reminders/today/', {
      params: { patient_id: PATIENT_ID },
    });
    return getList(response).map(normalizeReminder);
  },

  getUpcomingReminders: async () => {
    const response = await apiClient.get('/reminders/upcoming/', {
      params: { patient_id: PATIENT_ID },
    });
    return getList(response).map(normalizeReminder);
  },
};
