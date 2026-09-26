/* eslint-disable no-unused-vars */

const BASE_URL = 'http://127.0.0.1:8000';

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
/*let patientProfileId = null;

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
      // The logged-in user's own profile is the first result
      if (data.results && data.results.length > 0) {
        patientProfileId = data.results[0].id;
      } else if (Array.isArray(data) && data.length > 0) {
        patientProfileId = data[0].id;
      }
    }
  } catch (err) {
    console.error('Could not load patient profile:', err);
  }
}*/

// Update how many time inputs show based on chosen frequency
document.getElementById('medFrequency').addEventListener('change', function () {
  const count = parseInt(this.value);
  const container = document.getElementById('timeInputs');
  container.innerHTML = '';

  const defaultTimes = ['08:00', '13:00', '21:00'];
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
  const dosage = document.getElementById('medDosage').value.trim();
  const category = document.getElementById('medCategory').value;
  const frequency = document.getElementById('medFrequency').value;
  const stock = document.getElementById('medStock').value;
  const startDate = document.getElementById('medStartDate').value;
  const errorMsg = document.getElementById('formError');

    if (!name || !dosage || !stock || !startDate) {
    errorMsg.textContent = 'Please fill in all required fields.';
    return;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You are not logged in!');
    window.location.href = 'login.html';
    return;
  }

  const times = Array.from(document.querySelectorAll('.dose-time')).map((input) => input.value);

  const payload = {
    name: name,
    dosage: dosage,
    disease: category,
    total_quantity: parseInt(stock),
    daily_frequency: parseInt(frequency),
    times: times,
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
      const details = errorData?.error?.details;
      if (details) {
        const firstError = Object.values(details)[0];
        errorMsg.textContent = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        errorMsg.textContent =
          errorData.detail || errorData?.error?.message || 'Failed to add medicine.';
      }
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Error adding medicine:', error);
    errorMsg.textContent = 'An error occurred while connecting to the server.';
  }
});