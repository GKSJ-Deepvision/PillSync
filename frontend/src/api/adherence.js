import { apiClient } from './client';

const adherenceApi = {
  getSummary: (params = {}) =>
    apiClient.get('/adherence/summary/', { params }).then((response) => response.data),

  getHistory: (params = {}) =>
    apiClient.get('/adherence/history/', { params }).then((response) => response.data),

  getMedications: (params = {}) =>
    apiClient.get('/adherence/medications/', { params }).then((response) => response.data),

  getToday: () => apiClient.get('/adherence/today/').then((response) => response.data),

  getWeekly: () => apiClient.get('/adherence/weekly/').then((response) => response.data),

  getMonthly: (month, year) =>
    apiClient
      .get('/adherence/monthly/', {
        params: { month, year },
      })
      .then((response) => response.data),

  getReport: (params = {}) =>
    apiClient.get('/adherence/report/', { params }).then((response) => response.data),

  logDose: (payload) =>
    apiClient.post('/adherence/log/', payload).then((response) => response.data),

  updateDose: (eventId, payload) =>
    apiClient.patch(`/adherence/log/${eventId}/`, payload).then((response) => response.data),
};

export { adherenceApi };
