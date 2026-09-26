const defaultDoses = [
  { id: "dose1", time: "8:00 AM", name: "Metformin 500mg", status: "taken" },
  { id: "dose2", time: "1:00 PM", name: "Amlodipine 5mg", status: "pending" },
  { id: "dose3", time: "9:00 PM", name: "Vitamin D3", status: "pending" }
];

let todayDoses = JSON.parse(localStorage.getItem("pillsync_today_doses")) || defaultDoses;

function saveTodayDoses() {
  localStorage.setItem("pillsync_today_doses", JSON.stringify(todayDoses));
}

function markDose(doseId, newStatus) {
  const dose = todayDoses.find(d => d.id === doseId);
  if (dose) {
    dose.status = newStatus;
    saveTodayDoses();
    renderTimeline();
    renderAdherenceRing();
  }
}
function openProfileModal() {
  document.getElementById("profileModal").style.display = "flex";
}

function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
}

const defaultMedicines = [
  { name: "Metformin 500mg", category: "Diabetes", freq: "2 times/day", stock: 12, color: "#7FA98E" },
  { name: "Amlodipine 5mg", category: "Blood Pressure", freq: "1 time/day", stock: 4, color: "#D97B5B" },
  { name: "Vitamin D3", category: "Vitamins", freq: "1 time/day", stock: 20, color: "#C9A96E" }
];

const savedMedicines = JSON.parse(localStorage.getItem("pillsync_medicines") || "[]");
const myMedicines = [...defaultMedicines, ...savedMedicines];

const weekData = [
  { day: "Mon", status: "full" },
  { day: "Tue", status: "full" },
  { day: "Wed", status: "partial" },
  { day: "Thu", status: "missed" },
  { day: "Fri", status: "full" },
  { day: "Sat", status: "future" },
  { day: "Sun", status: "future" }
];

let activeCategory = "All";

function renderAdherenceRing() {
  const taken = todayDoses.filter(d => d.status === "taken").length;
  const total = todayDoses.length;
  const percent = Math.round((taken / total) * 100);
  const circumference = 213.6;
  const offset = circumference - (percent / 100) * circumference;
  document.getElementById("ringFg").style.strokeDashoffset = offset;
  document.getElementById("ringText").textContent = percent + "%";
}

function renderAlertBanner() {
  const lowStockMeds = myMedicines.filter(m => m.stock <= 5);
  const banner = document.getElementById("alertBanner");
  if (lowStockMeds.length === 0) {
    banner.style.display = "none";
    return;
  }
  const names = lowStockMeds.map(m => `${m.name} (${m.stock} left)`).join(", ");
  banner.textContent = `⚠ Refill needed soon: ${names}`;
  banner.style.display = "block";
}

function renderWeekStrip() {
  const strip = document.getElementById("weekStrip");
  strip.innerHTML = "";
  weekData.forEach(d => {
    const box = document.createElement("div");
    box.className = "day-box day-" + d.status;
    box.innerHTML = `<span class="day-label">${d.day}</span>`;
    strip.appendChild(box);
  });
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  todayDoses.forEach(dose => {
    const chip = document.createElement("div");
    chip.className = "dose-chip" + (dose.status !== "pending" ? " status-" + dose.status : "");
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
  const categories = ["All", ...new Set(myMedicines.map(m => m.category))];
  const chipsContainer = document.getElementById("filterChips");
  chipsContainer.innerHTML = "";
  categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = "chip" + (cat === activeCategory ? " active" : "");
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
  const list = document.getElementById("medicineList");
  list.innerHTML = "";
  const filtered = activeCategory === "All"
    ? myMedicines
    : myMedicines.filter(m => m.category === activeCategory);
  filtered.forEach(med => {
    const row = document.createElement("div");
    row.className = "medicine-row";
    const stockLow = med.stock <= 5;
    const stockClass = stockLow ? "stock-low" : "stock-ok";
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
function renderRightPanel() {
  document.getElementById("statTotalMeds").textContent = myMedicines.length;
  document.getElementById("statDosesToday").textContent = todayDoses.length;

  const fullDays = weekData.filter(d => d.status === "full").length;
  const trackedDays = weekData.filter(d => d.status !== "future").length;
  const avgAdherence = trackedDays > 0 ? Math.round((fullDays / trackedDays) * 100) : 0;
  document.getElementById("statAvgAdherence").textContent = avgAdherence + "%";

  const refillsContainer = document.getElementById("upcomingRefills");
  const lowStock = myMedicines.filter(m => m.stock <= 10).sort((a, b) => a.stock - b.stock);

  if (lowStock.length === 0) {
    refillsContainer.innerHTML = `<p style="font-size:13px; color:#8A8578;">No refills needed soon.</p>`;
  } else {
    refillsContainer.innerHTML = lowStock.map(m => {
      const daysLeft = Math.round(m.stock / 2); // rough estimate
      return `
        <div class="refill-item">
          <span>${m.name}</span>
          <span class="refill-days">${daysLeft}d left</span>
        </div>
      `;
    }).join("");
  }
    // Streak calculation
  let streak = 0;
  for (let i = weekData.length - 1; i >= 0; i--) {
    if (weekData[i].status === "future") continue;
    if (weekData[i].status === "full") streak++;
    else break;
  }
  document.getElementById("streakNumber").textContent = streak;

  // Mini bar chart
  const chartColors = { full: "#7FA98E", partial: "#E9C46A", missed: "#D97B5B", future: "#E4E0D6" };
  const heights = { full: "100%", partial: "55%", missed: "25%", future: "10%" };
  const miniChart = document.getElementById("miniChart");
  miniChart.innerHTML = weekData.map(d => `
    <div class="mini-bar-wrap">
      <div class="mini-bar" style="height:${heights[d.status]}; background:${chartColors[d.status]}"></div>
      <div class="mini-bar-label">${d.day.charAt(0)}</div>
    </div>
  `).join("");

  const tips = [
    "Taking medicines at the same time daily helps build a habit and improves adherence.",
    "Store your medicines in a cool, dry place away from direct sunlight.",
    "Never skip a dose without consulting your doctor first.",
    "Set your reminder times around daily habits like meals for better consistency."
  ];
  document.getElementById("healthTip").textContent = tips[Math.floor(Math.random() * tips.length)];
}
  function messageCaregiver() {
  alert("This would open a message to your caregiver, Pari Verma, once messaging is connected to the backend.");
  }
// ===== NOTIFICATIONS =====

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function showToast(title, message) {
  const toast = document.getElementById("toast");
  toast.innerHTML = `<strong>${title}</strong>${message}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 5000);
}

function triggerReminder(dose) {
  showToast("💊 Time for your medicine", `${dose.name} — ${dose.time}`);

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("PillSync Reminder", {
      body: `Time to take ${dose.name} (${dose.time})`
    });
  }
}

function simulateReminder() {
  const pendingDose = todayDoses.find(d => d.status === "pending");
  if (pendingDose) {
    triggerReminder(pendingDose);
  } else {
    showToast("✅ All caught up", "No pending doses right now.");
  }
}
updateUnreadBadge("Pari Verma");
renderAdherenceRing();
renderAdherenceRing();
renderAlertBanner();
renderWeekStrip();
renderTimeline();
renderFilterChips();
renderMedicineList();