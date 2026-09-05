import api from './client.js';

/** Reference data: medicine catalogue, conditions and the enum lists. */
export const referenceApi = {
  async enums() {
    const { data } = await api.get('/reference/enums/');
    return data;
  },

  async conditions(params = {}) {
    const { data } = await api.get('/reference/conditions/', { params });
    return data;
  },

  async medicines(params = {}) {
    const { data } = await api.get('/reference/medicines/', { params });
    return data;
  },

  async categories() {
    const { data } = await api.get('/reference/categories/');
    return data;
  },
};

export default referenceApi;
