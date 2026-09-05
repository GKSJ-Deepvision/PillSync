import api from './client.js';

/** Patient profiles, conditions, emergency contacts and caregiver links. */
export const profilesApi = {
  async listPatients(params = {}) {
    const { data } = await api.get('/profiles/patients/', { params });
    return data;
  },

  async getMyProfile() {
    const { data } = await api.get('/profiles/patients/me/');
    return data;
  },

  async createPatient(payload) {
    const { data } = await api.post('/profiles/patients/', payload);
    return data;
  },

  async updatePatient(id, payload) {
    const { data } = await api.patch(`/profiles/patients/${id}/`, payload);
    return data;
  },

  async deactivatePatient(id) {
    await api.delete(`/profiles/patients/${id}/`);
  },

  async listConditions(params = {}) {
    const { data } = await api.get('/profiles/patient-conditions/', { params });
    return data;
  },

  async addCondition(payload) {
    const { data } = await api.post('/profiles/patient-conditions/', payload);
    return data;
  },

  async removeCondition(id) {
    await api.delete(`/profiles/patient-conditions/${id}/`);
  },

  async listEmergencyContacts(params = {}) {
    const { data } = await api.get('/profiles/emergency-contacts/', { params });
    return data;
  },

  async addEmergencyContact(payload) {
    const { data } = await api.post('/profiles/emergency-contacts/', payload);
    return data;
  },

  async removeEmergencyContact(id) {
    await api.delete(`/profiles/emergency-contacts/${id}/`);
  },
};

export const caregivingApi = {
  async listAssignments(params = {}) {
    const { data } = await api.get('/caregiver-assignments/', { params });
    return data;
  },

  async invite(payload) {
    const { data } = await api.post('/caregiver-assignments/', payload);
    return data;
  },

  async accept(id) {
    const { data } = await api.post(`/caregiver-assignments/${id}/accept/`);
    return data;
  },

  async decline(id) {
    const { data } = await api.post(`/caregiver-assignments/${id}/decline/`);
    return data;
  },

  async revoke(id) {
    const { data } = await api.post(`/caregiver-assignments/${id}/revoke/`);
    return data;
  },
};
