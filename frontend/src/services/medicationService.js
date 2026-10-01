import api from './api';

export const medicationService = {
  listMedicines: async () => (await api.get('/medicines/')).data,
  createMedicine: async (payload) => (await api.post('/medicines/', payload)).data,
  listSchedules: async (medicineId) => (await api.get(`/medicines/${medicineId}/schedules/`)).data,
  createSchedule: async (medicineId, payload) => (await api.post(`/medicines/${medicineId}/schedules/`, payload)).data,
  updateSchedule: async (scheduleId, payload) => (await api.patch(`/schedules/${scheduleId}/`, payload)).data,
  deleteSchedule: async (scheduleId) => api.delete(`/schedules/${scheduleId}/`),
  listHistory: async (medicineId) => (await api.get(`/medicines/${medicineId}/history/`)).data,
  getAdherence: async (params = {}) => (await api.get('/adherence/', { params })).data,
  getMedicineAdherence: async (medicineId, params = {}) => (await api.get(`/adherence/medicines/${medicineId}/`, { params })).data,
  listReminders: async () => (await api.get('/reminders/')).data,
  markReminderTaken: async (id) => (await api.post(`/reminders/${id}/taken/`)).data,
  markReminderMissed: async (id) => (await api.post(`/reminders/${id}/missed/`)).data,
  snoozeReminder: async (id, minutes) => (await api.post(`/reminders/${id}/snooze/`, { minutes })).data,
  uploadOcr: async (formData, onUploadProgress) => (await api.post('/ocr/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })).data,
  correctOcr: async (id, payload) => (await api.patch(`/ocr/${id}/`, payload)).data,
  listPrescriptions: async () => (await api.get('/prescriptions/')).data,
  createPrescription: async (formData) => (await api.post('/prescriptions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data,
  getRefillPrediction: async (medicineId) => (await api.get(`/refills/medicines/${medicineId}/prediction/`)).data,
};
