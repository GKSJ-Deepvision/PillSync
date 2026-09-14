const defaultMedicines = [
  { id: "med1", name: "Metformin 500mg", category: "Diabetes", freq: "2 times/day", stock: 12, color: "#7FA98E", times: ["08:00", "20:00"] },
  { id: "med2", name: "Amlodipine 5mg", category: "Blood Pressure", freq: "1 time/day", stock: 4, color: "#D97B5B", times: ["13:00"] },
  { id: "med3", name: "Vitamin D3", category: "Vitamins", freq: "1 time/day", stock: 20, color: "#C9A96E", times: ["21:00"] }
];

// Give any saved medicines an id too, if they don't already have one
let savedMedicines = JSON.parse(localStorage.getItem("pillsync_medicines") || "[]");
savedMedicines = savedMedicines.map((m, i) => ({ id: m.id || "saved" + i, ...m }));

let allMedicines = [...defaultMedicines, ...savedMedicines];

let activeCategory = "All";
let searchTerm = "";

function renderFilterChips() {
  const categories = ["All", ...new Set(allMedicines.map(m => m.category))];
  const chipsContainer = document.getElementById("filterChips");
  chipsContainer.innerHTML = "";

  categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = "chip" + (cat === activeCategory ? " active" : "");
    chip.textContent = cat;
    chip.onclick = () => {
      activeCategory = cat;
      renderFilterChips();
      renderList();
    };
    chipsContainer.appendChild(chip);
  });
}

function deleteMedicine(id) {
  if (!confirm("Remove this medicine from your list?")) return;

  allMedicines = allMedicines.filter(m => m.id !== id);

  // Update localStorage (only the saved/custom ones, defaults stay hardcoded)
  const updatedSaved = allMedicines.filter(m => m.id.startsWith("saved") || !m.id.startsWith("med"));
  localStorage.setItem("pillsync_medicines", JSON.stringify(updatedSaved));

  renderFilterChips();
  renderList();
}

function renderList() {
  const list = document.getElementById("fullMedicineList");
  list.innerHTML = "";

  let filtered = activeCategory === "All"
    ? allMedicines
    : allMedicines.filter(m => m.category === activeCategory);

  if (searchTerm) {
    filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">No medicines found.</div>`;
    return;
  }

  filtered.forEach(med => {
    const stockLow = med.stock <= 5;
    const stockClass = stockLow ? "stock-low" : "stock-ok";
    const stockText = stockLow ? `Only ${med.stock} left` : `${med.stock} in stock`;
    const timesText = med.times ? med.times.join(", ") : "";

    const card = document.createElement("div");
    card.className = "full-med-card";
    card.innerHTML = `
      <div class="category-dot" style="background:${med.color}"></div>
      <div class="full-med-info">
        <div class="m-name">${med.name}</div>
        <div class="m-meta">${med.category} · ${med.freq}</div>
        ${timesText ? `<div class="m-times">⏰ ${timesText}</div>` : ""}
      </div>
      <div class="full-med-actions">
        <span class="stock-tag ${stockClass}">${stockText}</span>
        <button class="icon-btn delete" onclick="deleteMedicine('${med.id}')">Delete</button>
      </div>
    `;

    list.appendChild(card);
  });
}

document.getElementById("searchBar").addEventListener("input", function () {
  searchTerm = this.value;
  renderList();
});

renderFilterChips();
renderList();