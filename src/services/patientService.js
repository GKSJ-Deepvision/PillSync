import api from './api';

export const patientService = {
  fetchDashboard: async () => {
    const response = await api.get('/patient/dashboard/');
    return response.data;
  },

  fetchMedications: async () => {
    const response = await api.get('/patient/medications/');
    return response.data;
  },

  addMedication: async (medication) => {
    const response = await api.post('/patient/medications/', medication);
    return response.data;
  },

  deleteMedication: async (medicationId) => {
    await api.delete(`/patient/medications/${medicationId}/`);
  },

  refillMedication: async (medicationId) => {
    const response = await api.patch(`/patient/medications/${medicationId}/refill/`);
    return response.data;
  },

  fetchSchedule: async () => {
    const response = await api.get('/patient/schedule/');
    return response.data;
  },

  updateScheduleStatus: async (scheduleId, status, minutes) => {
    const response = await api.patch(`/patient/schedule/${scheduleId}/status/`, { status, minutes });
    return response.data;
  },

  fetchAdherence: async () => {
    const response = await api.get('/patient/adherence/');
    return response.data;
  },

  fetchNotifications: async () => {
    const response = await api.get('/patient/notifications/');
    return response.data;
  },

  markNotificationsRead: async () => {
    await api.patch('/patient/notifications/');
  },

  deleteNotification: async (notificationId) => {
    await api.delete(`/patient/notifications/${notificationId}/`);
  },

  fetchIntelligence: async () => {
    const response = await api.get('/patient/intelligence/');
    return response.data;
  },

  scanMedicationText: async (text) => {
    const response = await api.post('/patient/medications/ocr/', { text });
    return response.data;
  },

  fetchMyPatients: async () => {
    const response = await api.get('/caregiver/patients/');
    return response.data;
  },

  fetchPatientDetails: async (patientId) => {
    const response = await api.get(`/caregiver/patients/${patientId}/`);
    return response.data;
  },

  fetchUserList: async () => {
    const response = await api.get('/admin/users/');
    return response.data;
  },

  fetchActivityLogs: async () => {
    const response = await api.get('/admin/activity-logs/');
    return response.data;
  },

  fetchAlerts: async () => {
    const response = await api.get('/caregiver/alerts/');
    return response.data;
  },

  resolveAlert: async (alertId) => {
    const response = await api.patch(`/caregiver/alerts/${alertId}/resolve/`);
    return response.data;
  },

  createAlert: async (alert) => {
    const response = await api.post('/caregiver/alerts/create/', alert);
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/status/`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.patch(`/admin/users/${userId}/`, userData);
    return response.data;
  },

  fetchAdherenceRisk: async () => {
    const response = await api.get('/patient/adherence/risk/');
    return response.data;
  },
};
