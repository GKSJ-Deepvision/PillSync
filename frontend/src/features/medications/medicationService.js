// Medication Service for multi-profile medicine management

const MEDICINES_STORAGE_KEY = 'pillsync_profile_medicines';

const DEFAULT_MEDICINES = [
  {
    id: 1,
    profileId: 1,
    name: 'Metformin',
    dosage: '500mg',
    quantity: '60 Tablets',
    frequency: '2 / day',
    category: 'Diabetes',
    stock: 45,
    status: 'Active'
  },
  {
    id: 2,
    profileId: 1,
    name: 'Amlodipine',
    dosage: '5mg',
    quantity: '30 Tablets',
    frequency: '1 / day',
    category: 'Blood Pressure',
    stock: 22,
    status: 'Active'
  },
  {
    id: 3,
    profileId: 3,
    name: 'Lisopril',
    dosage: '10mg',
    quantity: '30 Tablets',
    frequency: '1 / day',
    category: 'Blood Pressure',
    stock: 12,
    status: 'Active'
  }
];

export const getStoredMedicines = () => {
  try {
    const raw = localStorage.getItem(MEDICINES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(DEFAULT_MEDICINES));
      return DEFAULT_MEDICINES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load medicines from storage', err);
    return DEFAULT_MEDICINES;
  }
};

export const saveMedicine = (medObj) => {
  const current = getStoredMedicines();
  const newMed = {
    ...medObj,
    id: medObj.id || Date.now(),
    stock: medObj.stock || 30,
    status: 'Active'
  };
  const updated = [newMed, ...current.filter(m => m.id !== newMed.id)];
  localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(updated));
  return newMed;
};
