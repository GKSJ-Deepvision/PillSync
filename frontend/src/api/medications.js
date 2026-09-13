import { apiClient } from './client';

export const medicationApi = {
  getMedications: () => apiClient.get('/medications/').then((res) => res.data),

  getMedicationById: (id) =>
    apiClient.get(`/medications/${id}/`).then((res) => res.data),

  createMedication: (data) =>
    apiClient.post('/medications/', data).then((res) => res.data),

  updateMedication: (id, data) =>
    apiClient.put(`/medications/${id}/`, data).then((res) => res.data),

  patchMedication: (id, data) =>
    apiClient.patch(`/medications/${id}/`, data).then((res) => res.data),

  deleteMedication: (id) =>
    apiClient.delete(`/medications/${id}/`),
};