import { apiClient, USE_MOCK_API } from './client';
import {
  getScopedStorage,
  setScopedStorage,
  getCurrentUserKey,
  getCurrentUser,
} from '../utils/userStorage';

export const DEFAULT_PATIENT_MEDS = [
  {
    id: 'med-reg-1',
    name: 'Metformin HCl',
    condition: 'Type 2 Diabetes Mellitus',
    disease: 'Diabetes',
    dosage: '500mg',
    form: 'Oral Tablet',
    frequency: 'Twice daily',
    schedule: ['08:00 AM', '08:00 PM'],
    instructions: 'Take with or immediately after meals',
    quantity: 60,
    status: 'active',
  },
  {
    id: 'med-reg-2',
    name: 'Lisinopril',
    condition: 'Hypertension (High Blood Pressure)',
    disease: 'Hypertension',
    dosage: '10mg',
    form: 'Oral Tablet',
    frequency: 'Once daily (Morning)',
    schedule: ['08:00 AM'],
    instructions: 'Take in the morning with water',
    quantity: 30,
    status: 'active',
  },
  {
    id: 'med-reg-3',
    name: 'Atorvastatin (Lipitor)',
    condition: 'High Cholesterol',
    disease: 'Cardiovascular Care',
    dosage: '20mg',
    form: 'Oral Tablet',
    frequency: 'Once daily (Bedtime)',
    schedule: ['09:00 PM'],
    instructions: 'Take at bedtime with water',
    quantity: 30,
    status: 'active',
  },
];

// User-scoped storage: brand new patient accounts start fresh with 0 medications
function getStoredMedications() {
  const stored = getScopedStorage('pillsync_patient_medications', null);

  if (stored !== null && Array.isArray(stored)) {
    return stored;
  }

  // All accounts start completely clean at 0 medications
  setScopedStorage('pillsync_patient_medications', []);
  return [];
}

function saveStoredMedications(meds) {
  setScopedStorage('pillsync_patient_medications', meds);
}

const mockMedicationApi = {
  getMedications: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getStoredMedications();
  },

  getMedicationById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const meds = getStoredMedications();
    return meds.find((m) => m.id === id);
  },

  createMedication: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const meds = getStoredMedications();
    const currentUser = getCurrentUser();
    const newMed = {
      id: Date.now().toString(),
      ...data,
      userId: getCurrentUserKey(),
      patientEmail: currentUser?.email || 'patient@example.com',
      patientName: currentUser?.name || 'Patient',
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };
    meds.unshift(newMed);
    saveStoredMedications(meds);
    return newMed;
  },

  updateMedication: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const meds = getStoredMedications();
    const index = meds.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    meds[index] = { ...meds[index], ...data };
    saveStoredMedications(meds);
    return meds[index];
  },

  deleteMedication: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const meds = getStoredMedications();
    const index = meds.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    meds.splice(index, 1);
    saveStoredMedications(meds);
    return { success: true };
  },

  searchMedications: async (query) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const meds = getStoredMedications();
    return meds.filter(
      (m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.disease?.toLowerCase().includes(query.toLowerCase())
    );
  },

  getMedicationsByDisease: async (disease) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const meds = getStoredMedications();
    return meds.filter((m) => m.disease === disease);
  },
};

const realMedicationApi = {
  getMedications: () => apiClient.get('/medications').then((res) => res.data),

  getMedicationById: (id) => apiClient.get(`/medications/${id}`).then((res) => res.data),

  createMedication: (data) => apiClient.post('/medications', data).then((res) => res.data),

  updateMedication: (id, data) => apiClient.put(`/medications/${id}`, data).then((res) => res.data),

  deleteMedication: (id) => apiClient.delete(`/medications/${id}`).then((res) => res.data),

  searchMedications: (query) =>
    apiClient.get('/medications/search', { params: { q: query } }).then((res) => res.data),

  getMedicationsByDisease: (disease) =>
    apiClient.get(`/medications/disease/${disease}`).then((res) => res.data),
};

export const medicationApi = USE_MOCK_API ? mockMedicationApi : realMedicationApi;
