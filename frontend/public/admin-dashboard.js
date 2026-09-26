// Sample data — later fetched from backend's Users table
const users = [
  { name: "Isha Sharma", email: "isha@gmail.com", role: "patient", status: "active", joined: "Aug 12, 2026" },
  { name: "Pari Verma", email: "pari@gmail.com", role: "caregiver", status: "active", joined: "Aug 14, 2026" },
  { name: "Rajesh Kumar", email: "rajesh@gmail.com", role: "patient", status: "active", joined: "Aug 18, 2026" },
  { name: "Meena Iyer", email: "meena@gmail.com", role: "patient", status: "inactive", joined: "Aug 20, 2026" },
  { name: "Admin User", email: "admin@pillsync.com", role: "admin", status: "active", joined: "Aug 1, 2026" }
];

const activityLog = [
  { text: "Isha Sharma added a new medicine: Metformin 500mg", time: "2 hours ago" },
  { text: "Rajesh Kumar missed a dose (Levothyroxine)", time: "5 hours ago" },
  { text: "Pari Verma linked to patient Isha Sharma", time: "Yesterday" },
  { text: "New signup: Meena Iyer (Patient)", time: "2 days ago" }
];

let activeRoleFilter = "All";
let searchTerm = "";

function renderStats() {
  const totalUsers = users.length;
  const totalPatients = users.filter(u => u.role === "patient").length;
  const totalCaregivers = users.filter(u => u.role === "caregiver").length;
  const activeUsers = users.filter(u => u.status === "active").length;

  const statGrid = document.getElementById("statGrid");
  statGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${totalUsers}</div>
      <div class="stat-label">Total users</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🧑‍⚕️</div>
      <div class="stat-value">${totalPatients}</div>
      <div class="stat-label">Patients</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🤝</div>
      <div class="stat-value">${totalCaregivers}</div>
      <div class="stat-label">Caregivers</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${activeUsers}</div>
      <div class="stat-label">Active accounts</div>
    </div>
  `;
}

function renderRoleFilterChips() {
  const roles = ["All", "patient", "caregiver", "admin"];
  const container = document.getElementById("roleFilterChips");
  container.innerHTML = "";

  roles.forEach(role => {
    const chip = document.createElement("button");
    chip.className = "chip" + (role === activeRoleFilter ? " active" : "");
    chip.textContent = role === "All" ? "All" : role.charAt(0).toUpperCase() + role.slice(1);
    chip.onclick = () => {
      activeRoleFilter = role;
      renderRoleFilterChips();
      renderUserTable();
    };
    container.appendChild(chip);
  });
}

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  let filtered = activeRoleFilter === "All"
    ? users
    : users.filter(u => u.role === activeRoleFilter);

  if (searchTerm) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filtered.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="role-pill role-${user.role}">${user.role}</span></td>
      <td><span class="status-dot ${user.status === "inactive" ? "inactive" : ""}">${user.status}</span></td>
      <td>${user.joined}</td>
      <td><button class="table-action" onclick="toggleUserStatus('${user.email}')">${user.status === "active" ? "Deactivate" : "Activate"}</button></td>
    `;
    tbody.appendChild(row);
  });
}

function toggleUserStatus(email) {
  const user = users.find(u => u.email === email);
  if (user) {
    user.status = user.status === "active" ? "inactive" : "active";
    renderStats();
    renderUserTable();
  }
}

function renderActivity() {
  const list = document.getElementById("activityList");
  list.innerHTML = "";

  activityLog.forEach(entry => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<span>${entry.text}</span><span class="activity-time">${entry.time}</span>`;
    list.appendChild(item);
  });
}

document.getElementById("userSearch").addEventListener("input", function () {
  searchTerm = this.value;
  renderUserTable();
});
function renderRoleChart() {
    const roleColors = {
    patient: "#00C2A8",
    caregiver: "#FF6B6B",
    admin: "#7C6AF5"
  };

  const roleCounts = { patient: 0, caregiver: 0, admin: 0 };
  users.forEach(u => roleCounts[u.role]++);

  const total = users.length;
  let cumulativePercent = 0;
  const gradientStops = [];

  Object.keys(roleCounts).forEach(role => {
    const count = roleCounts[role];
    if (count === 0) return;
    const percent = (count / total) * 100;
    const start = cumulativePercent;
    const end = cumulativePercent + percent;
    gradientStops.push(`${roleColors[role]} ${start}% ${end}%`);
    cumulativePercent = end;
  });

  const donut = document.getElementById("donutChart");
  donut.style.background = `conic-gradient(${gradientStops.join(", ")})`;
  donut.innerHTML = `
    <div class="donut-center-text">
      <span class="donut-total">${total}</span>
      <span class="donut-label">users</span>
    </div>
  `;

  const legend = document.getElementById("donutLegend");
  legend.innerHTML = Object.keys(roleCounts).map(role => {
    const count = roleCounts[role];
    const percent = Math.round((count / total) * 100);
    const label = role.charAt(0).toUpperCase() + role.slice(1) + "s";
    return `
      <div class="legend-row">
        <div class="legend-dot" style="background:${roleColors[role]}"></div>
        <span class="legend-label">${label}</span>
        <span class="legend-count">${count}</span>
        <span class="legend-percent">(${percent}%)</span>
      </div>
    `;
  }).join("");
}

renderStats();
renderRoleFilterChips();
renderUserTable();
renderActivity();
renderRoleChart();