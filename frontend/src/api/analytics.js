import api from './client.js';

export const analyticsApi = {
  async dashboard(params = {}) {
    const { data } = await api.get('/analytics/dashboard/', { params });
    return data;
  },

  async caregiver() {
    const { data } = await api.get('/analytics/caregiver/');
    return data;
  },

  async admin() {
    const { data } = await api.get('/analytics/admin/');
    return data;
  },

  async performance() {
    const { data } = await api.get('/analytics/performance/');
    return data;
  },
};

export default analyticsApi;
