const sampleMedicines = [
  { id: 1, name: "Amlodipine 5mg", dosage: "5mg", disease: "BLOOD_PRESSURE", diseaseLabel: "Blood Pressure", total_quantity: 15, daily_frequency: 1, fullSupply: 30 },
  { id: 2, name: "Losartan 50mg", dosage: "50mg", disease: "BLOOD_PRESSURE", diseaseLabel: "Blood Pressure", total_quantity: 24, daily_frequency: 1, fullSupply: 30 },
  { id: 3, name: "Metformin 500mg", dosage: "500mg", disease: "DIABETES", diseaseLabel: "Diabetes", total_quantity: 30, daily_frequency: 1, fullSupply: 30 },
  { id: 4, name: "Vitamin D3", dosage: "1000 IU", disease: "VITAMINS", diseaseLabel: "Vitamins", total_quantity: 20, daily_frequency: 1, fullSupply: 30 },
  { id: 5, name: "Vitamin B12", dosage: "500mcg", disease: "VITAMINS", diseaseLabel: "Vitamins", total_quantity: 8, daily_frequency: 1, fullSupply: 30 },
  { id: 6, name: "Azithromycin 500mg", dosage: "500mg", disease: "ANTIBIOTICS", diseaseLabel: "Antibiotics", total_quantity: 6, daily_frequency: 1, fullSupply: 30 },
  { id: 7, name: "Levothyroxine 50mcg", dosage: "50mcg", disease: "THYROID", diseaseLabel: "Thyroid", total_quantity: 27, daily_frequency: 1, fullSupply: 30 },
];

const categoryMeta = {
  "Blood Pressure": { icon: "❤️", color: "#FDF1EC" },
  "Diabetes": { icon: "🩸", color: "#F1F7F3" },
  "Vitamins": { icon: "☀️", color: "#FFF9E6" },
  "Antibiotics": { icon: "💊", color: "#F0ECFA" },
  "Thyroid": { icon: "🦋", color: "#E6F7F4" },
};

const requestedRefills = new Set();
let activeStatus = "All";
let searchTerm = "";

const statusLabels = {
  All: "All",
  urgent: "Need refill now",
  upcoming: "Coming up soon",
  ok: "Well stocked",
};

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function estimateDaysLeft(med) {
  if (!med.daily_frequency || med.daily_frequency <= 0) return null;
  return Math.floor(med.total_quantity / med.daily_frequency);
}

function estimateRefillDate(daysLeft) {
  const d = new Date();
  d.setDate(d.getDate() + daysLeft);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatus(daysLeft) {
  if (daysLeft <= 5) return "urgent";
  if (daysLeft <= 14) return "upcoming";
  return "ok";
}

function showRefillToast(text) {
  const toast = document.getElementById("refillToast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
}

function requestRefill(medId, medName, btn) {
  requestedRefills.add(medId);
  btn.textContent = "✓ Requested";
  btn.classList.add("requested");
  btn.disabled = true;
  showRefillToast(`✓ Refill requested for ${medName}. Your pharmacy will be notified.`);
}

function checkForAlerts() {
  const urgent = sampleMedicines
    .map((m) => ({ ...m, daysLeft: estimateDaysLeft(m) }))
    .filter((m) => m.daysLeft !== null && m.daysLeft <= 5)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (urgent.length === 0) {
    showRefillToast("✓ All medicines are well stocked. No alerts right now.");
    return;
  }
  const mostUrgent = urgent[0];
  showRefillToast(`⚠ Alert: ${mostUrgent.name} has only ${mostUrgent.daysLeft} day(s) left!`);
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("PillSync Refill Alert", {
      body: `${mostUrgent.name} is running low — ${mostUrgent.daysLeft} day(s) left.`,
    });
  }
}

function renderFilterChips() {
  const statuses = ["All", "urgent", "upcoming", "ok"];
  const container = document.getElementById("filterChips");
  container.innerHTML = "";
  statuses.forEach((status) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (status === activeStatus ? " active" : "");
    chip.textContent = statusLabels[status];
    chip.onclick = () => {
      activeStatus = status;
      renderFilterChips();
      renderAll();
    };
    container.appendChild(chip);
  });
}

function renderSummaryStrip(all) {
  const urgent = all.filter((m) => getStatus(m.daysLeft) === "urgent");
  const upcoming = all.filter((m) => getStatus(m.daysLeft) === "upcoming");
  const ok = all.filter((m) => getStatus(m.daysLeft) === "ok");

  document.getElementById("summaryStrip").innerHTML = `
    <div class="summary-box summary-urgent">
      <div class="s-icon">⚠</div>
      <div class="s-num">${urgent.length}</div>
      <div class="s-lbl">Need refill now</div>
    </div>
    <div class="summary-box summary-upcoming">
      <div class="s-icon">⏳</div>
      <div class="s-num">${upcoming.length}</div>
      <div class="s-lbl">Coming up soon</div>
    </div>
    <div class="summary-box summary-ok">
      <div class="s-icon">✓</div>
      <div class="s-num">${ok.length}</div>
      <div class="s-lbl">Well stocked</div>
    </div>
  `;
}

function renderAll() {
  let filtered = sampleMedicines;
  if (searchTerm) {
    filtered = filtered.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  let enriched = filtered.map((med) => {
    const daysLeft = estimateDaysLeft(med);
    return { ...med, daysLeft, eta: estimateRefillDate(daysLeft), status: getStatus(daysLeft) };
  });

  if (activeStatus !== "All") {
    enriched = enriched.filter((m) => m.status === activeStatus);
  }

  renderSummaryStrip(enriched);

  // Group by category
  const grouped = {};
  enriched.forEach((med) => {
    if (!grouped[med.diseaseLabel]) grouped[med.diseaseLabel] = [];
    grouped[med.diseaseLabel].push(med);
  });

  const container = document.getElementById("categorySections");

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:#8A8578;">No medicines found.</p>`;
    return;
  }

  container.innerHTML = Object.entries(grouped)
    .map(([category, meds]) => {
      const meta = categoryMeta[category] || { icon: "💊", color: "#F5F5F0" };
      const cards = meds
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((med) => {
          const alreadyRequested = requestedRefills.has(med.id);
          const badgeClass = `badge-${med.status}`;
          const badgeText = med.status === "urgent" ? "Urgent" : med.status === "upcoming" ? "Soon" : "Well stocked";
          return `
          <div class="med-card status-${med.status}">
            <span class="status-badge ${badgeClass}">${badgeText}</span>
            <div class="r-name">${med.name}</div>
            <div class="r-detail">${med.dosage} · ${med.total_quantity} tablets left</div>
            <div class="stock-bar-track"><div class="stock-bar-fill" style="width:${Math.min(100, Math.round((med.total_quantity / med.fullSupply) * 100))}%; background:${med.status === 'urgent' ? '#FF6B6B' : med.status === 'upcoming' ? '#E9C46A' : '#00C2A8'};"></div></div>
            <div class="r-days-line">${med.daysLeft} day${med.daysLeft === 1 ? '' : 's'} left · refill by ${med.eta}</div>
            ${
              med.status !== 'ok'
                ? `<button class="request-btn ${alreadyRequested ? 'requested' : ''}"
                    ${alreadyRequested ? 'disabled' : ''}
                    onclick="requestRefill(${med.id}, '${med.name}', this)">
                    ${alreadyRequested ? '✓ Requested' : 'Request Refill'}
                  </button>`
                : ''
            }
          </div>
        `;
        })
        .join('');

      return `
        <div class="category-block">
          <div class="category-header">
            <div class="category-icon" style="background:${meta.color}">${meta.icon}</div>
            <div class="category-title">${category}</div>
            <div class="category-count">${meds.length} medicine${meds.length === 1 ? '' : 's'}</div>
          </div>
          <div class="med-grid">${cards}</div>
        </div>
      `;
    })
    .join('');
}

document.getElementById("searchBar").addEventListener("input", function () {
  searchTerm = this.value;
  renderAll();
});

renderFilterChips();
renderAll();