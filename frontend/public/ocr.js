/* eslint-disable no-unused-vars */
/* OCR Scanner Frontend Handler */

const BASE_URL = '/api/v1';

let currentFile = null;
let patientProfileId = null;

// Category mapping helper
function guessCategory(medName) {
  const name = (medName || '').toLowerCase();
  if (name.includes('lisinopril') || name.includes('amlodipine') || name.includes('losartan')) {
    return 'BLOOD_PRESSURE';
  }
  if (name.includes('metformin') || name.includes('glipizide') || name.includes('insulin')) {
    return 'DIABETES';
  }
  if (name.includes('levothyroxine') || name.includes('synthroid')) {
    return 'THYROID';
  }
  if (name.includes('amoxycillin') || name.includes('azithromycin') || name.includes('cipro')) {
    return 'ANTIBIOTICS';
  }
  if (name.includes('atorvastatin') || name.includes('aspirin')) {
    return 'HEART';
  }
  return 'OTHER';
}

function getSlot(timeStr) {
  const [hours] = timeStr.split(':').map(Number);
  if (hours >= 5 && hours < 12) return 'MORNING';
  if (hours >= 12 && hours < 17) return 'AFTERNOON';
  if (hours >= 17 && hours < 21) return 'EVENING';
  return 'NIGHT';
}

async function loadPatientProfile() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const res = await fetch(`${BASE_URL}/profiles/patients/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        patientProfileId = data.results[0].id;
      } else if (Array.isArray(data) && data.length > 0) {
        patientProfileId = data[0].id;
      }
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// UI Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const previewCard = document.getElementById('previewCard');
const previewImg = document.getElementById('previewImg');
const previewFileName = document.getElementById('previewFileName');
const btnClearImg = document.getElementById('btnClearImg');
const btnScan = document.getElementById('btnScan');
const scanBtnText = document.getElementById('scanBtnText');
const scanBtnSpinner = document.getElementById('scanBtnSpinner');
const btnSample = document.getElementById('btnSample');

const reviewCard = document.getElementById('reviewCard');
const confidenceBox = document.getElementById('confidenceBox');
const confidenceVal = document.getElementById('confidenceVal');
const confidenceBadge = document.getElementById('confidenceBadge');
const rawToggleBtn = document.getElementById('rawToggleBtn');
const rawTextView = document.getElementById('rawTextView');

const medNameInput = document.getElementById('medName');
const medDosageInput = document.getElementById('medDosage');
const medCategoryInput = document.getElementById('medCategory');
const medFrequencySelect = document.getElementById('medFrequency');
const medStockInput = document.getElementById('medStock');
const medStartDateInput = document.getElementById('medStartDate');
const timeInputsContainer = document.getElementById('timeInputs');
const formError = document.getElementById('formError');
const reviewForm = document.getElementById('reviewForm');
const toast = document.getElementById('toast');

// Set today's date as default start date
if (medStartDateInput) {
  medStartDateInput.value = new Date().toISOString().split('T')[0];
}

// File Selection & Drag-and-Drop
const btnBrowse = document.getElementById('btnBrowse');
if (btnBrowse) {
  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
}
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, WEBP).', true);
    return;
  }
  currentFile = file;
  previewFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewCard.style.display = 'block';
    btnScan.disabled = false;
  };
  reader.readAsDataURL(file);
}

btnClearImg.addEventListener('click', (e) => {
  e.stopPropagation();
  currentFile = null;
  fileInput.value = '';
  previewImg.src = '';
  previewCard.style.display = 'none';
  btnScan.disabled = true;
});

// Load Sample Prescription Image
btnSample.addEventListener('click', async () => {
  const token = localStorage.getItem('access_token');
  try {
    const res = await fetch(`${BASE_URL}/ocr/sample-image/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not fetch sample prescription.');
    const blob = await res.blob();
    const sampleFile = new File([blob], 'sample_prescription.png', { type: 'image/png' });
    handleFile(sampleFile);
  } catch (err) {
    console.error('Error fetching sample:', err);
    showToast('Could not load sample prescription image.', true);
  }
});

// Scan Action
btnScan.addEventListener('click', async () => {
  if (!currentFile) return;

  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  btnScan.disabled = true;
  scanBtnSpinner.style.display = 'inline-block';
  scanBtnText.textContent = 'Scanning image with OCR...';

  const formData = new FormData();
  formData.append('image', currentFile);

  try {
    const res = await fetch(`${BASE_URL}/ocr/scan/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error || 'OCR processing failed.');
    }

    const data = await res.json();
    populateResults(data);
  } catch (err) {
    console.error('OCR Error:', err);
    showToast(err.message || 'Error occurred while scanning prescription.', true);
  } finally {
    btnScan.disabled = false;
    scanBtnSpinner.style.display = 'none';
    scanBtnText.textContent = 'Re-scan Prescription';
  }
});

function updateTimeInputs(count) {
  timeInputsContainer.innerHTML = '';
  const defaultTimes = ['08:00', '13:00', '20:00'];
  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'dose-time';
    input.value = defaultTimes[i] || '08:00';
    timeInputsContainer.appendChild(input);
  }
}

medFrequencySelect.addEventListener('change', (e) => {
  updateTimeInputs(parseInt(e.target.value));
});

function populateResults(data) {
  reviewCard.style.display = 'block';

  // Confidence meter
  const conf = data.confidence || 0;
  confidenceVal.textContent = `${conf}%`;

  confidenceBadge.className = 'badge-pill';
  if (conf >= 80) {
    confidenceBadge.classList.add('badge-high');
    confidenceBadge.textContent = 'High Confidence';
  } else if (conf >= 50) {
    confidenceBadge.classList.add('badge-medium');
    confidenceBadge.textContent = 'Moderate Confidence';
  } else {
    confidenceBadge.classList.add('badge-low');
    confidenceBadge.textContent = 'Low - Please Verify';
  }

  // Pre-fill editable inputs
  medNameInput.value = data.medicine_name || '';
  medDosageInput.value = data.dosage || '';
  medStockInput.value = data.quantity || 30;

  // Category
  medCategoryInput.value = guessCategory(data.medicine_name);

  // Frequency
  if (data.frequency === 'TWICE_DAILY') {
    medFrequencySelect.value = '2';
    updateTimeInputs(2);
  } else if (data.frequency === 'THREE_TIMES_DAILY') {
    medFrequencySelect.value = '3';
    updateTimeInputs(3);
  } else {
    medFrequencySelect.value = '1';
    updateTimeInputs(1);
  }

  // Raw text inspector
  rawTextView.textContent = data.raw_text || 'No text detected.';
  reviewCard.scrollIntoView({ behavior: 'smooth' });
}

rawToggleBtn.addEventListener('click', () => {
  const isHidden = rawTextView.style.display === 'none' || !rawTextView.style.display;
  rawTextView.style.display = isHidden ? 'block' : 'none';
  rawToggleBtn.textContent = isHidden ? '▼ Hide Raw OCR Text' : '▶ View Raw OCR Text';
});

// Save Medicine to Database
reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = medNameInput.value.trim();
  const dosage = medDosageInput.value.trim();
  const category = medCategoryInput.value;
  const stock = parseInt(medStockInput.value) || 0;
  const startDate = medStartDateInput.value;

  if (!name) {
    formError.textContent = 'Medicine name is required.';
    return;
  }
  if (!patientProfileId) {
    formError.textContent = 'Patient profile not loaded. Please refresh the page.';
    return;
  }

  const token = localStorage.getItem('access_token');
  const times = Array.from(document.querySelectorAll('.dose-time')).map((input) => input.value);
  const schedules = times.map((time) => ({
    slot: getSlot(time),
    time_of_day: time + ':00',
    quantity_per_dose: 1,
    frequency: 'DAILY',
    start_date: startDate,
  }));

  const fullName = dosage ? `${name} ${dosage}` : name;
  const payload = {
    patient: patientProfileId,
    name: fullName,
    category: category,
    quantity_remaining: stock,
    start_date: startDate,
    schedules: schedules,
  };

  try {
    const res = await fetch(`${BASE_URL}/medicines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      formError.textContent = err?.detail || 'Failed to save medicine.';
      return;
    }

    showToast('Medicine successfully added from OCR scan!');
    setTimeout(() => {
      window.location.href = 'my-medicines.html';
    }, 1200);
  } catch (err) {
    console.error('Failed to save medicine:', err);
    formError.textContent = 'Network error saving medicine.';
  }
});

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? 'var(--terracotta)' : 'var(--sage-deep)';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// Initialize
loadPatientProfile();
