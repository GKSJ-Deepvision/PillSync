// Notifications Service

export const getStoredNotifications = () => {
  return [
    {
      id: 1,
      title: '⚠️ Low Stock Warning: Blood Pressure Med',
      desc: 'Your BP medicine is expected to finish in 4 days. Please arrange a refill.',
      time: '10:30 AM',
      type: 'refill'
    },
    {
      id: 2,
      title: '🔔 Missed Dose Alert Sent to Caregiver',
      desc: 'Lisopril dose for Arthur Smith was marked missed at 09:00 AM.',
      time: '09:05 AM',
      type: 'caregiver'
    }
  ];
};
