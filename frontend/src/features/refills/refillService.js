// AI Refill Prediction Engine Service

export const calculateRefillPrediction = ({
  stock = 60,
  dailyFrequency = 2,
  qtyPerDose = 1,
  missedDoses = 0,
  medicineName = 'Medication'
}) => {
  const dailyConsumption = dailyFrequency * qtyPerDose;
  const effectiveStock = stock + (missedDoses * qtyPerDose);
  const daysRemaining = dailyConsumption > 0 ? Math.floor(effectiveStock / dailyConsumption) : 0;
  
  const today = new Date();
  const depletionDate = new Date(today.getTime() + daysRemaining * 86400000);
  const refillLeadDays = Math.max(1, daysRemaining - 5);
  const refillDate = new Date(today.getTime() + refillLeadDays * 86400000);
  
  const isLowStock = daysRemaining <= 5;
  const warningMessage = isLowStock 
    ? `Your ${medicineName} is expected to finish in ${daysRemaining} days. Please arrange a refill.` 
    : '';

  return {
    stock,
    dailyConsumption,
    daysRemaining,
    depletionDateStr: depletionDate.toLocaleDateString(),
    refillDateStr: refillDate.toLocaleDateString(),
    isLowStock,
    warningMessage
  };
};

const REFILL_STORAGE_KEY = 'pillsync_refill_medicines';

const DEFAULT_REFILL_MEDS = [
  {
    id: 1,
    name: 'Blood Pressure Med (Amlodipine)',
    stock: 10,
    dailyFrequency: 2,
    qtyPerDose: 1,
    category: 'Blood Pressure'
  },
  {
    id: 2,
    name: 'Metformin',
    stock: 60,
    dailyFrequency: 2,
    qtyPerDose: 1,
    category: 'Diabetes'
  },
  {
    id: 3,
    name: 'Thyroxine (Synthroid)',
    stock: 28,
    dailyFrequency: 1,
    qtyPerDose: 1,
    category: 'Thyroid'
  }
];

export const getRefillTrackedMedicines = () => {
  try {
    const raw = localStorage.getItem(REFILL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REFILL_STORAGE_KEY, JSON.stringify(DEFAULT_REFILL_MEDS));
      return DEFAULT_REFILL_MEDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse refill medicines', e);
    return DEFAULT_REFILL_MEDS;
  }
};

export const updateMedicineStock = (id, amount = 30) => {
  const current = getRefillTrackedMedicines();
  const updated = current.map(m => m.id === id ? { ...m, stock: m.stock + amount } : m);
  localStorage.setItem(REFILL_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('pillsync_refill_updated'));
  return updated;
};
