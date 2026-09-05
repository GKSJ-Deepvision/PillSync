import api from './client.js';

/** Medicines, dosage schedules and prescriptions. */
export const medicationsApi = {
  async listMedicines(params = {}) {
    const { data } = await api.get('/medicines/', { params });
    return data;
  },

  async byCondition(params = {}) {
    const { data } = await api.get('/medicines/by-condition/', { params });
    return data;
  },

  async lowStock(params = {}) {
    const { data } = await api.get('/medicines/low-stock/', { params });
    return data;
  },

  async createMedicine(payload) {
    const { data } = await api.post('/medicines/', payload);
    return data;
  },

  async updateMedicine(id, payload) {
    const { data } = await api.patch(`/medicines/${id}/`, payload);
    return data;
  },

  async stopMedicine(id) {
    await api.delete(`/medicines/${id}/`);
  },

  async refill(id, quantity) {
    const { data } = await api.post(`/medicines/${id}/refill/`, quantity ? { quantity } : {});
    return data;
  },

  async createSchedule(payload) {
    const { data } = await api.post('/schedules/', payload);
    return data;
  },

  async updateSchedule(id, payload) {
    const { data } = await api.patch(`/schedules/${id}/`, payload);
    return data;
  },

  async removeSchedule(id) {
    await api.delete(`/schedules/${id}/`);
  },
};

export const prescriptionsApi = {
  async list(params = {}) {
    const { data } = await api.get('/prescriptions/', { params });
    return data;
  },

  async expiring() {
    const { data } = await api.get('/prescriptions/expiring/');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/prescriptions/', payload);
    return data;
  },

  async archive(id) {
    await api.delete(`/prescriptions/${id}/`);
  },
};

export default medicationsApi;
