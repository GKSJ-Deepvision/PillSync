import api from './client.js';

/** Refill forecasts, and the stock changes that feed them. */
export const refillsApi = {
  async list(params = {}) {
    const { data } = await api.get('/refills/', { params });
    return data;
  },

  async summary(params = {}) {
    const { data } = await api.get('/refills/summary/', { params });
    return data;
  },

  async projection(id) {
    const { data } = await api.get(`/refills/${id}/projection/`);
    return data;
  },

  async recompute() {
    const { data } = await api.post('/refills/recompute/');
    return data;
  },

  async accuracy() {
    const { data } = await api.get('/refills/accuracy/');
    return data;
  },

  async adjustStock(medicineId, quantity, reason = '') {
    const { data } = await api.post(`/medicines/${medicineId}/adjust-stock/`, { quantity, reason });
    return data;
  },

  async stockHistory(medicineId) {
    const { data } = await api.get(`/medicines/${medicineId}/stock-history/`);
    return data;
  },
};

export default refillsApi;
