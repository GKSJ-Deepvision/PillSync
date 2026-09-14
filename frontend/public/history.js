/* eslint-disable no-unused-vars, no-console */
// Sample historical data (in a real app, this would come from the backend database)
const historyLog = [
  {
    date: 'Mon, Aug 25',
    doses: [
      { med: 'Metformin 500mg', status: 'taken' },
      { med: 'Amlodipine 5mg', status: 'taken' },
      { med: 'Vitamin D3', status: 'taken' },
    ],
  },
  {
    date: 'Tue, Aug 26',
    doses: [
      { med: 'Metformin 500mg', status: 'taken' },
      { med: 'Amlodipine 5mg', status: 'taken' },
      { med: 'Vitamin D3', status: 'taken' },
    ],
  },
  {
    date: 'Wed, Aug 27',
    doses: [
      { med: 'Metformin 500mg', status: 'taken' },
      { med: 'Amlodipine 5mg', status: 'missed' },
      { med: 'Vitamin D3', status: 'taken' },
    ],
  },
  {
    date: 'Thu, Aug 28',
    doses: [
      { med: 'Metformin 500mg', status: 'missed' },
      { med: 'Amlodipine 5mg', status: 'missed' },
      { med: 'Vitamin D3', status: 'missed' },
    ],
  },
  {
    date: 'Fri, Aug 29',
    doses: [
      { med: 'Metformin 500mg', status: 'taken' },
      { med: 'Amlodipine 5mg', status: 'taken' },
      { med: 'Vitamin D3', status: 'taken' },
    ],
  },
];

// Pull in today's real data from the dashboard (localStorage)
const todayDoses = JSON.parse(localStorage.getItem('pillsync_today_doses')) || [];
if (todayDoses.length > 0) {
  historyLog.push({
    date: 'Today',
    doses: todayDoses.map((d) => ({
      med: d.name,
      status: d.status === 'pending' ? 'missed' : d.status, // treat pending as not-yet-taken for history view
    })),
  });
}

function renderSummary() {
  let totalDoses = 0;
  let totalTaken = 0;

  historyLog.forEach((day) => {
    day.doses.forEach((dose) => {
      totalDoses++;
      if (dose.status === 'taken') totalTaken++;
    });
  });

  const adherenceRate = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;
  const missedCount = totalDoses - totalTaken;

  const summaryRow = document.getElementById('summaryRow');
  summaryRow.innerHTML = `
    <div class="summary-card">
      <div class="stat-value">${adherenceRate}%</div>
      <div class="stat-label">Overall adherence</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${totalTaken}</div>
      <div class="stat-label">Doses taken</div>
    </div>
    <div class="summary-card">
      <div class="stat-value">${missedCount}</div>
      <div class="stat-label">Doses missed</div>
    </div>
  `;
}

function renderHistoryList() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  // Show most recent day first
  [...historyLog].reverse().forEach((day) => {
    const row = document.createElement('div');
    row.className = 'history-row';

    const doseEntries = day.doses
      .map(
        (dose) => `
      <div class="dose-entry">
        <span class="dose-med">${dose.med}</span>
        <span class="status-pill ${dose.status}">${dose.status === 'taken' ? 'Taken' : 'Missed'}</span>
      </div>
    `
      )
      .join('');

    row.innerHTML = `
      <div class="h-date">${day.date}</div>
      ${doseEntries}
    `;

    list.appendChild(row);
  });
}

renderSummary();
renderHistoryList();
