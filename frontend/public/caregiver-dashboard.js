// Sample data — in a real app, this comes from the CaregiverLinks table via backend
const patients = [
  {
    name: "Isha Sharma",
    condition: "Diabetes, Blood Pressure",
    adherence: 87,
    lowStock: ["Amlodipine 5mg"],
    missedToday: false
  },
  {
    name: "Rajesh Kumar",
    condition: "Thyroid",
    adherence: 54,
    lowStock: [],
    missedToday: true
  },
  {
    name: "Meena Iyer",
    condition: "Heart Medication",
    adherence: 96,
    lowStock: [],
    missedToday: false
  }
];

function renderAlerts() {
  const section = document.getElementById("alertsSection");
  section.innerHTML = "";

  patients.forEach(p => {
    if (p.missedToday) {
      const alert = document.createElement("div");
      alert.className = "alert-item";
      alert.textContent = `⚠ ${p.name} missed a dose today`;
      section.appendChild(alert);
    }
    if (p.lowStock.length > 0) {
      const alert = document.createElement("div");
      alert.className = "alert-item";
      alert.textContent = `⚠ ${p.name} is low on: ${p.lowStock.join(", ")}`;
      section.appendChild(alert);
    }
  });
}

function renderPatients() {
  const grid = document.getElementById("patientGrid");
  grid.innerHTML = "";

  patients.forEach(p => {
    const initial = p.name.charAt(0);
    const badgeClass = p.adherence >= 75 ? "badge-good" : "badge-warning";
    const badgeText = p.adherence >= 75 ? "On track" : "Needs attention";

    const card = document.createElement("div");
    card.className = "patient-card";
    card.innerHTML = `
      <div class="patient-card-top">
        <div class="patient-avatar">${initial}</div>
        <div>
          <div class="patient-name">${p.name}</div>
          <div class="patient-condition">${p.condition}</div>
        </div>
      </div>
      <div class="patient-stats">
        <div>
          <div class="patient-adherence">${p.adherence}%</div>
          <div class="patient-adherence-label">Adherence this week</div>
        </div>
        <span class="patient-status-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

renderAlerts();
renderPatients();