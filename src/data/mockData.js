export const MOCK_USERS = [
  {
    id: 'usr_1',
    name: 'John Doe',
    email: 'patient@pillsync.com',
    phone: '+1 (555) 123-4567',
    role: 'patient',
    dob: '1985-06-15',
    address: '123 Health Ave, San Francisco, CA 94102',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'usr_2',
    name: 'Sarah Smith',
    email: 'caregiver@pillsync.com',
    phone: '+1 (555) 987-6543',
    role: 'caregiver',
    dob: '1978-04-12',
    address: '456 Caring St, Oakland, CA 94612',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'usr_3',
    name: 'Admin User',
    email: 'admin@pillsync.com',
    phone: '+1 (555) 555-5555',
    role: 'admin',
    dob: '1990-01-01',
    address: '789 Admin Blvd, Silicon Valley, CA 94025',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
  }
];

export const MOCK_PATIENTS = [
  {
    id: 'pat_1',
    name: 'John Doe',
    email: 'patient@pillsync.com',
    phone: '+1 (555) 123-4567',
    dob: '1985-06-15',
    age: 41,
    address: '123 Health Ave, San Francisco, CA 94102',
    status: 'On Track',
    lastActivity: 'Took Metformin 10m ago',
    medications: [
      { id: 'med_1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: '8:00 AM, 8:00 PM', compliance: 95 },
      { id: 'med_2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', time: '8:00 AM', compliance: 90 },
      { id: 'med_3', name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily (Night)', time: '9:00 PM', compliance: 85 }
    ],
    schedule: [
      { time: '08:00 AM', name: 'Metformin', dosage: '500mg', status: 'Taken' },
      { time: '08:00 AM', name: 'Lisinopril', dosage: '10mg', status: 'Taken' },
      { time: '08:00 PM', name: 'Metformin', dosage: '500mg', status: 'Pending' },
      { time: '09:00 PM', name: 'Atorvastatin', dosage: '20mg', status: 'Pending' }
    ],
    adherence: {
      weekly: [85, 90, 95, 100, 90, 85, 95],
      monthly: 92
    }
  },
  {
    id: 'pat_2',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '+1 (555) 234-5678',
    dob: '1952-11-22',
    age: 73,
    address: '456 Oak Lane, Oakland, CA 94612',
    status: 'Needs Attention',
    lastActivity: 'Missed Albuterol Inhaler 2h ago',
    medications: [
      { id: 'med_4', name: 'Albuterol Inhaler', dosage: '2 puffs', frequency: 'As needed', time: 'Every 6 hours', compliance: 65 },
      { id: 'med_5', name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', time: '9:00 AM', compliance: 80 }
    ],
    schedule: [
      { time: '09:00 AM', name: 'Amlodipine', dosage: '5mg', status: 'Taken' },
      { time: '12:00 PM', name: 'Albuterol Inhaler', dosage: '2 puffs', status: 'Missed' },
      { time: '06:00 PM', name: 'Albuterol Inhaler', dosage: '2 puffs', status: 'Pending' }
    ],
    adherence: {
      weekly: [70, 75, 65, 80, 60, 65, 72],
      monthly: 72
    }
  },
  {
    id: 'pat_3',
    name: 'Robert Chen',
    email: 'robert.chen@example.com',
    phone: '+1 (555) 345-6789',
    dob: '1968-03-30',
    age: 58,
    address: '789 Pine Rd, San Jose, CA 95112',
    status: 'On Track',
    lastActivity: 'Took Levothyroxine 4h ago',
    medications: [
      { id: 'med_6', name: 'Levothyroxine', dosage: '100mcg', frequency: 'Once daily', time: '7:00 AM', compliance: 98 }
    ],
    schedule: [
      { time: '07:00 AM', name: 'Levothyroxine', dosage: '100mcg', status: 'Taken' }
    ],
    adherence: {
      weekly: [100, 100, 95, 100, 100, 100, 98],
      monthly: 99
    }
  }
];

export const MOCK_ALERTS = [
  { id: 'alt_1', patientId: 'pat_2', patientName: 'Alice Johnson', type: 'Missed Dose', medication: 'Albuterol Inhaler (2 puffs)', time: '12:00 PM Today', severity: 'high' },
  { id: 'alt_2', patientId: 'pat_1', patientName: 'John Doe', type: 'Upcoming Refill', medication: 'Metformin 500mg (5 days left)', time: 'Tomorrow 9:00 AM', severity: 'medium' },
  { id: 'alt_3', patientId: 'pat_2', patientName: 'Alice Johnson', type: 'Adherence Drop', medication: 'Weekly Adherence < 70%', time: 'Yesterday', severity: 'high' }
];

export const MOCK_NOTIFICATIONS = [
  { id: 'not_1', title: 'Medication Logged', message: 'You logged Metformin 500mg successfully.', time: '10 minutes ago', read: false },
  { id: 'not_2', title: 'Refill Warning', message: 'Lisinopril is running low. 7 days remaining.', time: '2 hours ago', read: false },
  { id: 'not_3', title: 'Caregiver Update', message: 'Sarah Smith viewed your adherence report.', time: 'Yesterday', read: true }
];

export const MOCK_ACTIVITY_LOGS = [
  { id: 'act_1', user: 'Sarah Smith', role: 'caregiver', action: 'Viewed John Doe dashboard', time: '2026-08-31T18:45:00Z', status: 'Success' },
  { id: 'act_2', user: 'John Doe', role: 'patient', action: 'Logged Metformin (Morning dose)', time: '2026-08-31T18:00:00Z', status: 'Success' },
  { id: 'act_3', user: 'Admin User', role: 'admin', action: 'Disabled inactive user test@example.com', time: '2026-08-31T17:15:00Z', status: 'Success' },
  { id: 'act_4', user: 'Jane Smith', role: 'caregiver', action: 'Registered new account', time: '2026-08-31T16:30:00Z', status: 'Success' },
  { id: 'act_5', user: 'Robert Chen', role: 'patient', action: 'Failed login attempt', time: '2026-08-31T15:20:00Z', status: 'Failed' }
];

export const MOCK_SYSTEM_STATS = {
  totalUsers: 145,
  totalPatients: 92,
  totalCaregivers: 45,
  totalAdmins: 8,
  activePatients: 78,
  complianceRate: '88.4%',
  systemUptime: '99.98%'
};
