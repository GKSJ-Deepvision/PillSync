// Prescription OCR Recognition Service

export const parsePrescriptionText = (rawText) => {
  return {
    medicine_name: 'Metformin',
    dosage: '500mg',
    quantity: 60,
    frequency: '2 / day',
    instructions: 'Take after meals',
    confidence: 0.95
  };
};
