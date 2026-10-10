import api from './api';

export const caregiverService = {
  listPatients: async () => (await api.get('/relationships/caregiver-patients/')).data,
  getPatientDashboard: async (patientId, params = {}) => (
    await api.get(`/analytics/caregiver/patients/${patientId}/dashboard/`, { params })
  ).data,
};
