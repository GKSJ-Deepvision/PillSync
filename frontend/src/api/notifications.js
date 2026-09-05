import api from './client.js';

/** Delivery preferences, device registration and the send log. */
export const notificationsApi = {
  async getPreferences() {
    const { data } = await api.get('/notifications/preferences/');
    return data;
  },

  async updatePreferences(payload) {
    const { data } = await api.patch('/notifications/preferences/', payload);
    return data;
  },

  async registerDevice(payload) {
    const { data } = await api.post('/notifications/devices/', payload);
    return data;
  },

  async listDevices() {
    const { data } = await api.get('/notifications/devices/');
    return data;
  },

  async removeDevice(id) {
    await api.delete(`/notifications/devices/${id}/`);
  },

  async log(params = {}) {
    const { data } = await api.get('/notifications/log/', { params });
    return data;
  },

  async deliveryStats() {
    const { data } = await api.get('/notifications/log/delivery_stats/');
    return data;
  },
};

export default notificationsApi;
