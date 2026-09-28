import { apiClient, USE_MOCK_API } from './client';

export const mockAdherenceData = {
  summary: {
    overallAdherence: 94,
    takenDoses: 37,
    missedDoses: 2,
    totalDoses: 39,
    streak: 14,
    healthScore: 94,
    avgSystolic: 122,
    avgBloodSugar: 114,
    vitalityLevel: 'Optimal Recovery',
  },
  weeklyAdherence: [
    { day: 'Mon', adherence: 100, taken: 4, missed: 0 },
    { day: 'Tue', adherence: 100, taken: 4, missed: 0 },
    { day: 'Wed', adherence: 75, taken: 3, missed: 1 },
    { day: 'Thu', adherence: 100, taken: 4, missed: 0 },
    { day: 'Fri', adherence: 100, taken: 4, missed: 0 },
    { day: 'Sat', adherence: 100, taken: 4, missed: 0 },
    { day: 'Sun', adherence: 100, taken: 4, missed: 0 },
  ],
  monthlyAdherence: [
    { week: 'Week 1', adherence: 88, healthScore: 82 },
    { week: 'Week 2', adherence: 92, healthScore: 88 },
    { week: 'Week 3', adherence: 95, healthScore: 92 },
    { week: 'Week 4', adherence: 97, healthScore: 96 },
  ],
  healthImprovement: [
    {
      day: 'Mon',
      date: 'Aug 25',
      adherence: 90,
      systolicBP: 138,
      diastolicBP: 88,
      bloodSugar: 142,
      healthScore: 78,
      status: 'Improving',
    },
    {
      day: 'Tue',
      date: 'Aug 26',
      adherence: 100,
      systolicBP: 132,
      diastolicBP: 84,
      bloodSugar: 130,
      healthScore: 84,
      status: 'Optimal',
    },
    {
      day: 'Wed',
      date: 'Aug 27',
      adherence: 85,
      systolicBP: 135,
      diastolicBP: 86,
      bloodSugar: 136,
      healthScore: 80,
      status: 'Normal',
    },
    {
      day: 'Thu',
      date: 'Aug 28',
      adherence: 100,
      systolicBP: 128,
      diastolicBP: 82,
      bloodSugar: 122,
      healthScore: 90,
      status: 'Optimal',
    },
    {
      day: 'Fri',
      date: 'Aug 29',
      adherence: 75,
      systolicBP: 134,
      diastolicBP: 85,
      bloodSugar: 135,
      healthScore: 78,
      status: 'Recovering',
    },
    {
      day: 'Sat',
      date: 'Aug 30',
      adherence: 100,
      systolicBP: 124,
      diastolicBP: 80,
      bloodSugar: 118,
      healthScore: 93,
      status: 'Optimal',
    },
    {
      day: 'Sun',
      date: 'Aug 31',
      adherence: 100,
      systolicBP: 122,
      diastolicBP: 78,
      bloodSugar: 114,
      healthScore: 96,
      status: 'Target Reached',
    },
  ],
  medicationHistory: [
    {
      id: '1',
      medicationName: 'Metformin 500mg',
      category: 'Type 2 Diabetes',
      taken: 28,
      missed: 0,
      adherence: 100,
      impact: 'Fasting glucose stabilized at 114 mg/dL',
    },
    {
      id: '2',
      medicationName: 'Lisinopril 10mg',
      category: 'Hypertension',
      taken: 27,
      missed: 1,
      adherence: 96,
      impact: 'Systolic BP reduced to 122 mmHg',
    },
    {
      id: '3',
      medicationName: 'Vitamin D3 2000 IU',
      category: 'Nutritional Support',
      taken: 25,
      missed: 1,
      adherence: 96,
      impact: 'Bone and immune density support',
    },
    {
      id: '4',
      medicationName: 'Atorvastatin 20mg',
      category: 'Cardiovascular / Lipid',
      taken: 28,
      missed: 0,
      adherence: 100,
      impact: 'LDL cholesterol target range achieved',
    },
  ],
};

const mockAdherenceApi = {
  getSummary: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAdherenceData.summary;
  },

  getWeeklyAdherence: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAdherenceData.weeklyAdherence;
  },

  getMonthlyAdherence: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAdherenceData.monthlyAdherence;
  },

  getHealthImprovement: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAdherenceData.healthImprovement;
  },

  getMedicationHistory: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAdherenceData.medicationHistory;
  },

  getAdherenceReport: async (filters = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      ...mockAdherenceData,
      filters,
    };
  },

  getConsistency: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      consecutive_days: 14,
      missed_days: 2,
      improvement: 12,
      target: 90,
    };
  },
};

const realAdherenceApi = {
  getSummary: () =>
    apiClient
      .get('/adherence/summary')
      .then((res) => res.data)
      .catch(() => mockAdherenceData.summary),

  getWeeklyAdherence: () =>
    apiClient
      .get('/adherence/weekly')
      .then((res) => res.data)
      .catch(() => mockAdherenceData.weeklyAdherence),

  getMonthlyAdherence: (month, year) =>
    apiClient
      .get('/adherence/monthly', { params: { month, year } })
      .then((res) => res.data)
      .catch(() => mockAdherenceData.monthlyAdherence),

  getHealthImprovement: () =>
    apiClient
      .get('/adherence/health-improvement')
      .then((res) => res.data)
      .catch(() => mockAdherenceData.healthImprovement),

  getMedicationHistory: () =>
    apiClient
      .get('/adherence/history')
      .then((res) => res.data)
      .catch(() => mockAdherenceData.medicationHistory),

  getAdherenceReport: (filters = {}) =>
    apiClient
      .get('/adherence/report', { params: filters })
      .then((res) => res.data)
      .catch(() => mockAdherenceData),

  getConsistency: () =>
    apiClient
      .get('/adherence/consistency')
      .then((res) => res.data)
      .catch(() => ({
        consecutive_days: 14,
        missed_days: 2,
        improvement: 12,
        target: 90,
      })),
};

export const adherenceApi = USE_MOCK_API ? mockAdherenceApi : realAdherenceApi;
