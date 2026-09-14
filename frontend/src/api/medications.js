import { apiClient, USE_MOCK_API } from './client';

// Mock data
const mockMedications = [
  {
    id: '1',
    name: 'Aspirin',
    dosage: '100mg',
    quantity: 30,
    frequency: 'Once daily',
    schedule: ['Morning'],
    disease: 'Heart Medications',
    instructions: 'Take with food',
    startDate: '2024-01-15',
    endDate: null,
    status: 'active',
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    quantity: 60,
    frequency: 'Twice daily',
    schedule: ['Morning', 'Evening'],
    disease: 'Diabetes',
    instructions: 'Take with meals',
    startDate: '2023-06-20',
    endDate: null,
    status: 'active',
  },
  {
    id: '3',
    name: 'Levothyroxine',
    dosage: '50mcg',
    quantity: 90,
    frequency: 'Once daily',
    schedule: ['Morning'],
    disease: 'Thyroid',
    instructions: 'Take on empty stomach',
    startDate: '2023-01-10',
    endDate: null,
    status: 'active',
  },
  {
    id: '4',
    name: 'Atenolol',
    dosage: '50mg',
    quantity: 30,
    frequency: 'Once daily',
    schedule: ['Morning'],
    disease: 'Blood Pressure',
    instructions: 'Do not stop abruptly',
    startDate: '2024-03-01',
    endDate: null,
    status: 'active',
  },
];

const mockMedicationApi = {
  getMedications: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMedications;
  },

  getMedicationById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedications.find((m) => m.id === id);
  },

  createMedication: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newMed = {
      id: Date.now().toString(),
      ...data,
      status: 'active',
    };
    mockMedications.push(newMed);
    return newMed;
  },

  updateMedication: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockMedications.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    mockMedications[index] = { ...mockMedications[index], ...data };
    return mockMedications[index];
  },

  deleteMedication: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockMedications.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    mockMedications.splice(index, 1);
    return { success: true };
  },

  searchMedications: async (query) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedications.filter(
      (m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.disease.toLowerCase().includes(query.toLowerCase())
    );
  },

  getMedicationsByDisease: async (disease) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedications.filter((m) => m.disease === disease);
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
