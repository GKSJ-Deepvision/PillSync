import api from './api';

export const analyticsService = {
  getDashboard: async (params = {}) => (await api.get('/analytics/dashboard/', { params })).data,
};
