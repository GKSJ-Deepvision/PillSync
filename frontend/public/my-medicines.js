/* eslint-disable no-unused-vars */
let allMedicines = [];
let activeCategory = 'All';
let searchTerm = '';

const categoryColors = {
  'Blood Pressure': '#D97B5B',
  Diabetes: '#7FA98E',
  Thyroid: '#C9A96E',
  Antibiotics: '#8E7CC3',
  Vitamins: '#C9A96E',
  'Heart Medications': '#D97B5B',
  Other: '#8A8578',
};

async function fetchMedicines() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('You are not logged in!');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('/api/v1/medicines/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch medicines');
      return;
    }

    const data = await response.json();
    const medicines = data.results || data; // handle paginated {results:[]} or plain array

    // Map API data format to the format expected by the UI
    allMedicines = medicines.map((med) => ({
      id: med.id,
      name: med.name,
      category: med.category_display || med.category || 'Other',
      freq: med.schedules && med.schedules.length > 0 ? `${med.schedules.length} time(s)/day` : '—',
      stock: med.quantity_remaining,
      color: categoryColors[med.category] || '#8A8578',
      times: med.schedules ? med.schedules.map((s) => s.time_of_day?.slice(0, 5)) : [],
    }));

    renderFilterChips();
    renderList();
  } catch (error) {
    console.error('Error fetching medicines:', error);
  }
}

function renderFilterChips() {
  const categories = ['All', ...new Set(allMedicines.map((m) => m.category))];
  const chipsContainer = document.getElementById('filterChips');
  chipsContainer.innerHTML = '';

  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategory = cat;
      renderFilterChips();
      renderList();
    };
    chipsContainer.appendChild(chip);
  });
}

async function deleteMedicine(id) {
  if (!confirm('Remove this medicine from your list?')) return;

  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`/api/v1/medicines/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok || res.status === 204) {
      allMedicines = allMedicines.filter((m) => m.id !== id);
      renderFilterChips();
      renderList();
    } else {
      alert('Failed to delete medicine. Please try again.');
    }
  } catch (err) {
    console.error('Error deleting medicine:', err);
    alert('Network error while deleting medicine.');
  }
}

function renderList() {
  const list = document.getElementById('fullMedicineList');
  list.innerHTML = '';

  let filtered =
    activeCategory === 'All'
      ? allMedicines
      : allMedicines.filter((m) => m.category === activeCategory);

  if (searchTerm) {
    filtered = filtered.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">No medicines found.</div>`;
    return;
  }

  filtered.forEach((med) => {
    const stockLow = med.stock <= 5;
    const stockClass = stockLow ? 'stock-low' : 'stock-ok';
    const stockText = stockLow ? `Only ${med.stock} left` : `${med.stock} in stock`;
    const timesText = med.times && med.times.length > 0 ? med.times.join(', ') : '';

    const card = document.createElement('div');
    card.className = 'full-med-card';
    card.innerHTML = `
      <div class="category-dot" style="background:${med.color}"></div>
      <div class="full-med-info">
        <div class="m-name">${med.name}</div>
        <div class="m-meta">${med.category} · ${med.freq}</div>
        ${timesText ? `<div class="m-times">⏰ ${timesText}</div>` : ''}
      </div>
      <div class="full-med-actions">
        <span class="stock-tag ${stockClass}">${stockText}</span>
        <button class="icon-btn delete" onclick="deleteMedicine('${med.id}')">Delete</button>
      </div>
    `;

    list.appendChild(card);
  });
}

document.getElementById('searchBar').addEventListener('input', function () {
  searchTerm = this.value;
  renderList();
});

// Fetch when the page loads
fetchMedicines();
