import { apiClient, USE_MOCK_API } from './client';

// Mock data
const mockReminders = [
  {
    id: '1',
    medicationId: '1',
    medicationName: 'Aspirin',
    schedule: 'Morning',
    time: '08:00',
    dosage: '100mg',
    status: 'upcoming',
    date: new Date().toISOString().split('T')[0],
    frequency: 'daily',
    nextReminder: '2024-08-31',
  },
  {
    id: '2',
    medicationId: '2',
    medicationName: 'Metformin',
    schedule: 'Morning',
    time: '09:00',
    dosage: '500mg',
    status: 'taken',
    date: new Date().toISOString().split('T')[0],
    frequency: 'daily',
    nextReminder: '2024-08-31',
  },
  {
    id: '3',
    medicationId: '2',
    medicationName: 'Metformin',
    schedule: 'Evening',
    time: '21:00',
    dosage: '500mg',
    status: 'missed',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    frequency: 'daily',
    nextReminder: '2024-08-31',
  },
  {
    id: '4',
    medicationId: '3',
    medicationName: 'Levothyroxine',
    schedule: 'Morning',
    time: '07:00',
    dosage: '50mcg',
    status: 'snoozed',
    date: new Date().toISOString().split('T')[0],
    frequency: 'daily',
    nextReminder: '2024-09-01',
  },
];

const mockReminderApi = {
  getReminders: async (filters = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let result = mockReminders;
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.date) {
      result = result.filter((r) => r.date === filters.date);
    }
    return result;
  },

  getReminderById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockReminders.find((r) => r.id === id);
  },

  markTaken: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const reminder = mockReminders.find((r) => r.id === id);
    if (reminder) {
      reminder.status = 'taken';
    }
    return reminder;
  },

  markMissed: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const reminder = mockReminders.find((r) => r.id === id);
    if (reminder) {
      reminder.status = 'missed';
    }
    return reminder;
  },

  snoozeReminder: async (id, minutes = 30) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const reminder = mockReminders.find((r) => r.id === id);
    if (reminder) {
      reminder.status = 'snoozed';
      const snoozedTime = new Date();
      snoozedTime.setMinutes(snoozedTime.getMinutes() + minutes);
      reminder.nextReminder = snoozedTime.toISOString();
    }
    return reminder;
  },

  getTodayReminders: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const today = new Date().toISOString().split('T')[0];
    return mockReminders.filter((r) => r.date === today);
  },

  getUpcomingReminders: async (days = 7) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockReminders.filter((r) => r.status === 'upcoming').slice(0, days);
  },
};

const realReminderApi = {
  getReminders: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiClient.get(`/reminders?${params}`).then((res) => res.data);
  },

  getReminderById: (id) => apiClient.get(`/reminders/${id}`).then((res) => res.data),

  markTaken: (id) => apiClient.post(`/reminders/${id}/taken`).then((res) => res.data),

  markMissed: (id) => apiClient.post(`/reminders/${id}/missed`).then((res) => res.data),

  snoozeReminder: (id, minutes = 30) =>
    apiClient.post(`/reminders/${id}/snooze`, { minutes }).then((res) => res.data),

  getTodayReminders: () => apiClient.get('/reminders/today').then((res) => res.data),

  getUpcomingReminders: (days = 7) =>
    apiClient.get('/reminders/upcoming', { params: { days } }).then((res) => res.data),
};

export const reminderApi = USE_MOCK_API ? mockReminderApi : realReminderApi;
