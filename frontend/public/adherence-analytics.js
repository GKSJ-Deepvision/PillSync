function generateSampleTrend() {
  const days = [];
  let base = 75;
  for (let i = 29; i >= 0; i--) {
    base += Math.random() * 16 - 8;
    base = Math.max(40, Math.min(100, base));
    days.push(Math.round(base));
  }
  return days;
}

const trendData = generateSampleTrend();

const medicineAdherence = [
  { name: "Metformin 500mg", percent: 92, color: "#00C2A8" },
  { name: "Amlodipine 5mg", percent: 78, color: "#7C6AF5" },
  { name: "Vitamin D3", percent: 65, color: "#E9C46A" },
  { name: "Levothyroxine 50mcg", percent: 88, color: "#4ECDC4" },
];

const dayOfWeekAdherence = [
  { day: "Mon", percent: 90 },
  { day: "Tue", percent: 85 },
  { day: "Wed", percent: 70 },
  { day: "Thu", percent: 60 },
  { day: "Fri", percent: 80 },
  { day: "Sat", percent: 55 },
  { day: "Sun", percent: 50 },
];

function switchTab(tab) {
  document.getElementById("tabMedBtn").classList.toggle("active", tab === "medicine");
  document.getElementById("tabDayBtn").classList.toggle("active", tab === "day");
  document.getElementById("byMedList").style.display = tab === "medicine" ? "block" : "none";
  document.getElementById("byDayPanel").style.display = tab === "day" ? "block" : "none";
}

function renderHeroScore() {
  const avg = Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length);
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (avg / 100) * circumference;

  let label, color;
  if (avg >= 80) { label = "On track — keep it up"; color = "#00C2A8"; }
  else if (avg >= 60) { label = "Room for improvement"; color = "#E9C46A"; }
  else { label = "Needs attention"; color = "#FF6B6B"; }

  document.getElementById("scoreRingWrap").innerHTML = `
    <svg viewBox="0 0 140 140">
      <defs>
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00C2A8" />
          <stop offset="100%" stop-color="#7C6AF5" />
        </linearGradient>
      </defs>
      <circle class="score-ring-bg" cx="70" cy="70" r="58" />
      <circle class="score-ring-fg" cx="70" cy="70" r="58"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 70 70)" />
      <text class="score-ring-text" x="70" y="75">${avg}%</text>
      <text class="score-ring-sub" x="70" y="90">30-day avg</text>
    </svg>
  `;

  const caption = document.getElementById("scoreCaption");
  caption.textContent = label;
  caption.style.color = color;

  const last7 = trendData.slice(-7);
  document.getElementById("statLast7").textContent = Math.round(last7.reduce((a, b) => a + b, 0) / 7) + "%";
  document.getElementById("statBest").textContent = Math.max(...trendData) + "%";
  document.getElementById("statWorst").textContent = Math.min(...trendData) + "%";
}

function renderTrendChart() {
  const width = 600, height = 170, padding = 28;
  const chartHeight = height - padding * 2;
  const stepX = (width - padding * 2) / (trendData.length - 1);
  const yFor = (val) => height - padding - (val / 100) * chartHeight;

  const points = trendData.map((val, i) => ({ x: padding + i * stepX, y: yFor(val), val, i }));
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const goalY = yFor(80);
  const goalLine = `<line class="trend-goal-line" x1="${padding}" y1="${goalY}" x2="${width - padding}" y2="${goalY}" />
    <text class="trend-goal-label" x="${width - padding - 50}" y="${goalY - 4}">80% goal</text>`;

  const dots = points
    .filter((p, i) => i % 5 === 0 || i === points.length - 1)
    .map((p) => `<circle class="trend-dot" cx="${p.x}" cy="${p.y}" r="3"><title>Day ${p.i + 1}: ${p.val}%</title></circle>`)
    .join("");

  document.getElementById("trendChart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00C2A8" />
          <stop offset="100%" stop-color="#7C6AF5" />
        </linearGradient>
        <linearGradient id="trendAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#7C6AF5" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#7C6AF5" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${goalLine}
      <path class="trend-area" d="${areaPath}" />
      <path class="trend-line" d="${linePath}" />
      ${dots}
      <text class="trend-axis-label" x="${padding}" y="${height - 6}">30 days ago</text>
      <text class="trend-axis-label" x="${width - padding - 30}" y="${height - 6}">Today</text>
    </svg>
  `;
}

function renderByMedicine() {
  document.getElementById("byMedList").innerHTML = medicineAdherence
    .sort((a, b) => b.percent - a.percent)
    .map(
      (med) => `
      <div class="med-adherence-row">
        <div class="mar-top">
          <span class="mar-name">${med.name}</span>
          <span class="mar-percent" style="color:${med.color}">${med.percent}%</span>
        </div>
        <div class="mar-bar-track">
          <div class="mar-bar-fill" style="width:${med.percent}%; background:${med.color};"></div>
        </div>
      </div>
    `
    )
    .join("");
}

function renderHeatmap() {
  document.getElementById("heatmapGrid").innerHTML = dayOfWeekAdherence
    .map((d) => {
      let color = d.percent >= 80 ? "#00C2A8" : d.percent >= 60 ? "#E9C46A" : "#FF6B6B";
      return `
        <div class="heat-cell" style="background:${color}" title="${d.day}: ${d.percent}%">
          <div class="heat-day">${d.day}</div>
          <div>${d.percent}%</div>
        </div>
      `;
    })
    .join("");
}

function renderInsights() {
  const worstDay = dayOfWeekAdherence.reduce((min, d) => (d.percent < min.percent ? d : min));
  const worstMed = [...medicineAdherence].sort((a, b) => a.percent - b.percent)[0];
  const avg = Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length);
  const last7Avg = Math.round(trendData.slice(-7).reduce((a, b) => a + b, 0) / 7);
  const trendDirection = last7Avg > avg ? "improving" : last7Avg < avg ? "declining" : "stable";

  const insights = [
    {
      type: trendDirection === "improving" ? "positive" : trendDirection === "declining" ? "warning" : "",
      text: `Your adherence is ${trendDirection} — last 7 days averaged ${last7Avg}%, vs. your 30-day average of ${avg}%.`,
    },
    {
      type: "warning",
      text: `${worstDay.day}s tend to be your lowest adherence day (${worstDay.percent}%) — consider an extra reminder then.`,
    },
    {
      type: "warning",
      text: `${worstMed.name} has your lowest adherence at ${worstMed.percent}% — worth mentioning to your doctor if often missed.`,
    },
  ];

  document.getElementById("insightsList").innerHTML = insights
    .map((i) => `<div class="insight-item ${i.type}">${i.text}</div>`)
    .join("");
}

renderHeroScore();
renderTrendChart();
renderByMedicine();
renderHeatmap();
switchTab("medicine");
renderInsights();