/* eslint-disable no-unused-vars */

const BASE_URL = '/api/v1';

// Category color mapping (for local display only)
const categoryColors = {
  BLOOD_PRESSURE: '#D97B5B',
  DIABETES: '#7FA98E',
  THYROID: '#C9A96E',
  ANTIBIOTICS: '#8E7CC3',
  VITAMINS: '#C9A96E',
  HEART: '#D97B5B',
  OTHER: '#8A8578',
};

// Slot mapping based on time of day
function getSlot(timeStr) {
  const [hours] = timeStr.split(':').map(Number);
  if (hours >= 5 && hours < 12) return 'MORNING';
  if (hours >= 12 && hours < 17) return 'AFTERNOON';
  if (hours >= 17 && hours < 21) return 'EVENING';
  return 'NIGHT';
}

// Fetch patient profile ID for the logged-in user
let patientProfileId = null;

async function loadPatientProfile() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  try {
    // 1. Try patient's own self profile
    const meRes = await fetch(`${BASE_URL}/profiles/patients/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.id) {
        patientProfileId = meData.id;
        return;
      }
    }

    // 2. Fallback to list
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
    console.error('Could not load patient profile:', err);
  }
}

// Initialize default date to today
const startDateInput = document.getElementById('medStartDate');
if (startDateInput && !startDateInput.value) {
  startDateInput.value = new Date().toISOString().split('T')[0];
}

// Update how many time inputs show based on chosen frequency
document.getElementById('medFrequency').addEventListener('change', function () {
  const count = parseInt(this.value);
  const container = document.getElementById('timeInputs');
  container.innerHTML = '';

  const defaultTimes = ['08:00', '13:00', '20:00'];
  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'dose-time';
    input.value = defaultTimes[i] || '08:00';
    container.appendChild(input);
  }
});

document.getElementById('medForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('medName').value.trim();
  const category = document.getElementById('medCategory').value;
  const stock = document.getElementById('medStock').value;
  const startDate = document.getElementById('medStartDate').value || new Date().toISOString().split('T')[0];
  const errorMsg = document.getElementById('formError');
  errorMsg.textContent = '';

  if (!name || !stock) {
    errorMsg.textContent = 'Please fill in the medicine name and stock.';
    return;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You are not logged in!');
    window.location.href = 'login.html';
    return;
  }

  if (!patientProfileId) {
    await loadPatientProfile();
  }

  if (!patientProfileId) {
    errorMsg.textContent = 'Could not find your patient profile. Please make sure you are logged in as a patient.';
    return;
  }

  // Build schedules from the time inputs with distinct slots
  const times = Array.from(document.querySelectorAll('.dose-time')).map((input) => input.value);
  const slotPool = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  const usedSlots = new Set();

  const schedules = times.map((time, idx) => {
    let slot = getSlot(time);
    if (usedSlots.has(slot)) {
      // Find another available slot
      const alt = slotPool.find((s) => !usedSlots.has(s));
      if (alt) slot = alt;
    }
    usedSlots.add(slot);

    return {
      slot: slot,
      time_of_day: time.length === 5 ? time + ':00' : time, // backend expects HH:MM:SS
      quantity_per_dose: 1,
      frequency: 'DAILY',
      start_date: startDate,
    };
  });

  const payload = {
    patient: patientProfileId,
    name: name,
    category: category,
    quantity_remaining: parseInt(stock, 10),
    start_date: startDate,
    schedules: schedules,
  };

  try {
    const response = await fetch(`${BASE_URL}/medicines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const details = errorData?.error?.details || errorData;
      if (details && typeof details === 'object') {
        const firstKey = Object.keys(details)[0];
        const firstVal = details[firstKey];
        errorMsg.textContent = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : String(firstVal);
      } else {
        errorMsg.textContent =
          errorData.detail || errorData?.error?.message || 'Failed to add medicine.';
      }
      return;
    }

    window.location.href = 'my-medicines.html';
  } catch (error) {
    console.error('Error adding medicine:', error);
    errorMsg.textContent = 'An error occurred while connecting to the server.';
  }
});

// Load patient profile when page opens
loadPatientProfile();

