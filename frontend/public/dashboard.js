/* eslint-disable no-unused-vars, no-console */
let myMedicines = [];
let todayDoses = [];

function saveTodayDoses() {
  localStorage.setItem('pillsync_today_doses', JSON.stringify(todayDoses));
}

function markDose(doseId, newStatus) {
  const dose = todayDoses.find((d) => d.id === doseId);
  if (dose) {
    dose.status = newStatus;
    saveTodayDoses();
    renderTimeline();
    renderAdherenceRing();
  }
}

function openProfileModal() {
  document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

const weekData = [
  { day: 'Mon', status: 'full' },
  { day: 'Tue', status: 'full' },
  { day: 'Wed', status: 'partial' },
  { day: 'Thu', status: 'missed' },
  { day: 'Fri', status: 'full' },
  { day: 'Sat', status: 'future' },
  { day: 'Sun', status: 'future' },
];

let activeCategory = 'All';

const categoryColors = {
  'Blood Pressure': '#D97B5B',
  Diabetes: '#7FA98E',
  Thyroid: '#C9A96E',
  Antibiotics: '#8E7CC3',
  Vitamins: '#C9A96E',
  'Heart Medications': '#D97B5B',
  Other: '#8A8578',
};

async function loadDashboardData() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // 1. Fetch User Profile
  try {
    const userRes = await fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userRes.ok) {
      const user = await userRes.json();
      const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
      
      document.getElementById('sidebarAvatar').textContent = initial;
      document.getElementById('sidebarName').textContent = user.full_name;
      document.getElementById('sidebarEmail').textContent = user.email;
      document.getElementById('sidebarRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      document.getElementById('topGreeting').textContent = `Good morning, ${user.full_name.split(' ')[0]}`;
      
      document.getElementById('modalAvatar').textContent = initial;
      document.getElementById('modalName').textContent = user.full_name;
      document.getElementById('modalEmail').textContent = user.email;
      document.getElementById('modalRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
  } catch (err) {
    console.error('Error loading user profile:', err);
  }

  // 2. Fetch User Medicines
  try {
    const medRes = await fetch('http://localhost:8000/medicines/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (medRes.ok) {
      const data = await medRes.json();
      
      myMedicines = data.map((med) => ({
        id: med.id,
        name: med.name,
        category: med.disease || 'General',
        freq: `${med.daily_frequency} time(s)/day`,
        stock: med.total_quantity,
        color: categoryColors[med.disease] || '#8A8578',
        times: med.times || [],
      }));

      // Generate today's doses timeline dynamically from user's medicines
      todayDoses = [];
      myMedicines.forEach((med) => {
        if (med.times && med.times.length > 0) {
          med.times.forEach((t, idx) => {
            todayDoses.push({
              id: `dose_${med.id}_${idx}`,
              time: t,
              name: `${med.name}`,
              status: 'pending'
            });
          });
        } else {
          todayDoses.push({
            id: `dose_${med.id}_0`,
            time: '09:00 AM',
            name: `${med.name}`,
            status: 'pending'
          });
        }
      });
    }
  } catch (err) {
    console.error('Error loading medicines:', err);
  }

  renderAll();
}

function renderAll() {
  renderAdherenceRing();
  renderAlertBanner();
  renderWeekStrip();
  renderTimeline();
  renderFilterChips();
  renderMedicineList();
}

function renderAdherenceRing() {
  const taken = todayDoses.filter((d) => d.status === 'taken').length;
  const total = todayDoses.length || 1;
  const percent = Math.round((taken / total) * 100);
  const circumference = 213.6;
  const offset = circumference - (percent / 100) * circumference;
  document.getElementById('ringFg').style.strokeDashoffset = offset;
  document.getElementById('ringText').textContent = percent + '%';
}

function renderAlertBanner() {
  const lowStockMeds = myMedicines.filter((m) => m.stock <= 5);
  const banner = document.getElementById('alertBanner');
  if (lowStockMeds.length === 0) {
    banner.style.display = 'none';
    return;
  }
  const names = lowStockMeds.map((m) => `${m.name} (${m.stock} left)`).join(', ');
  banner.textContent = `⚠ Refill needed soon: ${names}`;
  banner.style.display = 'block';
}

function renderWeekStrip() {
  const strip = document.getElementById('weekStrip');
  strip.innerHTML = '';
  weekData.forEach((d) => {
    const box = document.createElement('div');
    box.className = 'day-box day-' + d.status;
    box.innerHTML = `<span class="day-label">${d.day}</span>`;
    strip.appendChild(box);
  });
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  if (todayDoses.length === 0) {
    timeline.innerHTML = `<p style="font-size: 14px; color: #8A8578; padding: 12px 0;">No medicine doses scheduled for today yet. Add a medicine to get started!</p>`;
    return;
  }

  todayDoses.forEach((dose) => {
    const chip = document.createElement('div');
    chip.className = 'dose-chip' + (dose.status !== 'pending' ? ' status-' + dose.status : '');
    chip.innerHTML = `
      <div class="time">${dose.time}</div>
      <div class="med-name">${dose.name}</div>
      <div class="actions">
        <button class="btn-taken" onclick="markDose('${dose.id}', 'taken')">Taken</button>
        <button class="btn-missed" onclick="markDose('${dose.id}', 'missed')">Missed</button>
      </div>
    `;
    timeline.appendChild(chip);
  });
}

function renderFilterChips() {
  const categories = ['All', ...new Set(myMedicines.map((m) => m.category))];
  const chipsContainer = document.getElementById('filterChips');
  chipsContainer.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategory = cat;
      renderFilterChips();
      renderMedicineList();
    };
    chipsContainer.appendChild(chip);
  });
}

function renderMedicineList() {
  const list = document.getElementById('medicineList');
  list.innerHTML = '';

  if (myMedicines.length === 0) {
    list.innerHTML = `<p style="font-size: 14px; color: #8A8578; padding: 12px 0;">No medicines found in your profile. Click "+ Add medicine" to add one!</p>`;
    return;
  }

  const filtered =
    activeCategory === 'All'
      ? myMedicines
      : myMedicines.filter((m) => m.category === activeCategory);

  filtered.forEach((med) => {
    const row = document.createElement('div');
    row.className = 'medicine-row';
    const stockLow = med.stock <= 5;
    const stockClass = stockLow ? 'stock-low' : 'stock-ok';
    const stockText = stockLow ? `Only ${med.stock} left` : `${med.stock} in stock`;
    row.innerHTML = `
      <div class="category-dot" style="background:${med.color}"></div>
      <div class="medicine-info">
        <div class="m-name">${med.name}</div>
        <div class="m-detail">${med.category} · ${med.freq}</div>
      </div>
      <div class="stock-tag ${stockClass}">${stockText}</div>
    `;
    list.appendChild(row);
  });
}

// Initial load
loadDashboardData();
