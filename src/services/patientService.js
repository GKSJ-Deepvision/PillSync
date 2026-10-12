// import api from './api'; // Will be used when Django backend is connected
import { MOCK_PATIENTS, MOCK_USERS, MOCK_ACTIVITY_LOGS } from '../data/mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const patientService = {
  fetchMyPatients: async () => {
    // Future Integration:
    // const response = await api.get('/caregiver/patients/');
    // return response.data;
    await delay();
    return MOCK_PATIENTS;
  },

  fetchPatientDetails: async (patientId) => {
    // Future Integration:
    // const response = await api.get(`/caregiver/patients/${patientId}/`);
    // return response.data;
    await delay();
    const patient = MOCK_PATIENTS.find((p) => p.id === patientId);
    if (patient) return patient;
    throw new Error('Patient details not found.');
  },

  fetchUserList: async () => {
    // Future Integration:
    // const response = await api.get('/admin/users/');
    // return response.data;
    await delay();
    return MOCK_USERS;
  },

  fetchActivityLogs: async () => {
    // Future Integration:
    // const response = await api.get('/admin/activity-logs/');
    // return response.data;
    await delay();
    return MOCK_ACTIVITY_LOGS;
  }
};
