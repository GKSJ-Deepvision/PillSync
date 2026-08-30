import { apiClient, USE_MOCK_API } from './client';

// Mock data
const mockAdherenceData = {
  summary: {
    overallAdherence: 87,
    takenDoses: 34,
    missedDoses: 5,
    totalDoses: 39,
    streak: 12,
  },
  weeklyAdherence: [
    { day: 'Mon', adherence: 100, taken: 3, missed: 0 },
    { day: 'Tue', adherence: 100, taken: 3, missed: 0 },
    { day: 'Wed', adherence: 67, taken: 2, missed: 1 },
    { day: 'Thu', adherence: 100, taken: 3, missed: 0 },
    { day: 'Fri', adherence: 100, taken: 3, missed: 0 },
    { day: 'Sat', adherence: 80, taken: 2, missed: 1 },
    { day: 'Sun', adherence: 100, taken: 3, missed: 0 },
  ],
  monthlyAdherence: [
    { week: 'Week 1', adherence: 95 },
    { week: 'Week 2', adherence: 88 },
    { week: 'Week 3', adherence: 90 },
    { week: 'Week 4', adherence: 75 },
  ],
  medicationHistory: [
    {
      id: '1',
      medicationName: 'Aspirin',
      taken: 28,
      missed: 2,
      adherence: 93,
    },
    {
      id: '2',
      medicationName: 'Metformin',
      taken: 58,
      missed: 2,
      adherence: 97,
    },
    {
      id: '3',
      medicationName: 'Levothyroxine',
      taken: 25,
      missed: 1,
      adherence: 96,
    },
    {
      id: '4',
      medicationName: 'Atenolol',
      taken: 28,
      missed: 0,
      adherence: 100,
    },
  ],
};

const mockAdherenceApi = {
  getSummary: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockAdherenceData.summary;
  },

  getWeeklyAdherence: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockAdherenceData.weeklyAdherence;
  },

  getMonthlyAdherence: async (month, year) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockAdherenceData.monthlyAdherence;
  },

  getMedicationHistory: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockAdherenceData.medicationHistory;
  },

  getAdherenceReport: async (filters = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      ...mockAdherenceData,
      filters,
    };
  },

  getConsistency: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      consecutive_days: 12,
      missed_days: 5,
      improvement: 8,
      target: 90,
    };
  },
};

const realAdherenceApi = {
  getSummary: () =>
    apiClient.get('/adherence/summary').then((res) => res.data),

  getWeeklyAdherence: () =>
    apiClient.get('/adherence/weekly').then((res) => res.data),

  getMonthlyAdherence: (month, year) =>
    apiClient.get('/adherence/monthly', { params: { month, year } }).then((res) => res.data),

  getMedicationHistory: () =>
    apiClient.get('/adherence/history').then((res) => res.data),

  getAdherenceReport: (filters = {}) =>
    apiClient.get('/adherence/report', { params: filters }).then((res) => res.data),

  getConsistency: () =>
    apiClient.get('/adherence/consistency').then((res) => res.data),
};

export const adherenceApi = USE_MOCK_API ? mockAdherenceApi : realAdherenceApi;
