import api from './client.js';

/** Dose events: today's reminders, what is coming, and what happened. */
export const remindersApi = {
  async today(params = {}) {
    const { data } = await api.get('/doses/today/', { params });
    return data;
  },

  async upcoming(params = {}) {
    const { data } = await api.get('/doses/upcoming/', { params });
    return data;
  },

  async history(params = {}) {
    const { data } = await api.get('/doses/history/', { params });
    return data;
  },

  async take(id, payload = {}) {
    const { data } = await api.post(`/doses/${id}/take/`, payload);
    return data;
  },

  async miss(id, payload = {}) {
    const { data } = await api.post(`/doses/${id}/miss/`, payload);
    return data;
  },

  async skip(id, payload = {}) {
    const { data } = await api.post(`/doses/${id}/skip/`, payload);
    return data;
  },

  async snooze(id, minutes = 15) {
    const { data } = await api.post(`/doses/${id}/snooze/`, { minutes });
    return data;
  },
};

export default remindersApi;
