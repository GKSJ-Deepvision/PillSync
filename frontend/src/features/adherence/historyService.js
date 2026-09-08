// Medication Intake History Tracking Service

const HISTORY_STORAGE_KEY = 'pillsync_intake_history_logs';

const SEED_LOGS = [
  {
    id: 101,
    profileId: 1,
    profileName: 'Self (Primary)',
    date: '2026-09-07',
    time: '08:00 AM',
    med: 'Metformin (500mg)',
    status: 'Taken',
    notes: 'Dose taken on schedule after breakfast'
  },
  {
    id: 102,
    profileId: 1,
    profileName: 'Self (Primary)',
    date: '2026-09-06',
    time: '08:00 PM',
    med: 'Amlodipine (5mg)',
    status: 'Taken',
    notes: 'Evening dose taken'
  },
  {
    id: 103,
    profileId: 3,
    profileName: 'Arthur Smith (Elderly Parent)',
    date: '2026-09-07',
    time: '09:00 AM',
    med: 'Lisopril (10mg)',
    status: 'Missed',
    notes: 'Patient was resting during scheduled dose window'
  },
  {
    id: 104,
    profileId: 2,
    profileName: 'Eleanor Vance (Spouse)',
    date: '2026-09-07',
    time: '07:30 AM',
    med: 'Multivitamin (1 Tablet)',
    status: 'Taken',
    notes: 'Morning routine'
  }
];

export const getStoredHistoryLogs = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load history logs', err);
    return SEED_LOGS;
  }
};

export const recordIntakeLog = (logItem) => {
  const currentLogs = getStoredHistoryLogs();
  const newLog = {
    id: Date.now(),
    date: logItem.date || new Date().toISOString().split('T')[0],
    time: logItem.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    med: logItem.med || 'Medication',
    status: logItem.status || 'Taken',
    profileId: logItem.profileId || 1,
    profileName: logItem.profileName || 'Family Member',
    notes: logItem.notes || ''
  };

  const updated = [newLog, ...currentLogs];
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('pillsync_history_updated'));
  return newLog;
};

export const calculateAdherenceStats = (logs) => {
  const total = logs.length;
  const taken = logs.filter(l => l.status === 'Taken').length;
  const missed = logs.filter(l => l.status === 'Missed').length;
  const snoozed = logs.filter(l => l.status === 'Snoozed').length;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

  return { total, taken, missed, snoozed, percentage };
};
