/* eslint-disable no-unused-vars, no-console */
// Category color mapping (matches dashboard color-coding)
const categoryColors = {
  'Blood Pressure': '#D97B5B',
  Diabetes: '#7FA98E',
  Thyroid: '#C9A96E',
  Antibiotics: '#8E7CC3',
  Vitamins: '#C9A96E',
  'Heart Medications': '#D97B5B',
  Other: '#8A8578',
};

const freqLabels = { 1: '1 time/day', 2: '2 times/day', 3: '3 times/day' };

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
  const category = document.getElementById('medCategory').value;
  const frequency = document.getElementById('medFrequency').value;
  const stock = document.getElementById('medStock').value;
  const startDate = document.getElementById('medStartDate').value;
  const errorMsg = document.getElementById('formError');

  if (!name || !stock || !startDate) {
    errorMsg.textContent = 'Please fill in all required fields.';
    return;
  }

  const times = Array.from(document.querySelectorAll('.dose-time')).map((input) => input.value);

  // Basic inference of dosage from name if possible (e.g. "Metformin 500mg" -> "500mg")
  // Or just "1 tablet" default.
  let dosage = '1 tablet';
  if (name.includes('mg') || name.includes('mcg')) {
    dosage = name.split(' ').slice(1).join(' ') || dosage;
  }

  const payload = {
    name: name,
    dosage: dosage,
    disease: category,
    total_quantity: parseInt(stock),
    daily_frequency: parseInt(frequency),
    times: times,
  };

  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You are not logged in!');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/medicines/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorMsg.textContent = errorData.detail || 'Failed to add medicine.';
      return;
    }

    // Temporarily save to localStorage as well for any UI components that haven't been updated to use API
    const existing = JSON.parse(localStorage.getItem('pillsync_medicines') || '[]');
    existing.push({
      name: name,
      category: category,
      freq: freqLabels[frequency],
      stock: parseInt(stock),
      color: categoryColors[category] || '#8A8578',
      times: times,
      startDate: startDate,
    });
    localStorage.setItem('pillsync_medicines', JSON.stringify(existing));

    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Error adding medicine:', error);
    errorMsg.textContent = 'An error occurred while connecting to the server.';
  }
});
