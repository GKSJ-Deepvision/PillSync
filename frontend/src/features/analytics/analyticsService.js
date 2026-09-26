// Adherence Analytics Service

export const getAdherenceTrendsData = () => {
  return {
    overallPercentage: 92,
    weeklyConsistency: 95,
    monthlyCompliance: 88,
    dailyTrends: [
      { day: 'Mon', taken: 4, missed: 0, percentage: 100 },
      { day: 'Tue', taken: 3, missed: 1, percentage: 75 },
      { day: 'Wed', taken: 4, missed: 0, percentage: 100 },
      { day: 'Thu', taken: 4, missed: 0, percentage: 100 },
      { day: 'Fri', taken: 3, missed: 0, percentage: 100 },
      { day: 'Sat', taken: 4, missed: 0, percentage: 100 },
      { day: 'Sun', taken: 4, missed: 0, percentage: 100 }
    ],
    categoryBreakdown: [
      { category: 'Diabetes', rate: '96%', status: 'Excellent' },
      { category: 'Blood Pressure', rate: '90%', status: 'Good' },
      { category: 'Thyroid', rate: '100%', status: 'Optimal' },
      { category: 'Vitamins', rate: '85%', status: 'Needs Nudge' }
    ]
  };
};
