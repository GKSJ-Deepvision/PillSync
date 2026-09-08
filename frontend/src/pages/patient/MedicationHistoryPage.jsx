import React from 'react';
import HistoryTable from '../../features/adherence/HistoryTable';

export default function MedicationHistoryPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          📜 Family Medication Intake History Tracking
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
          Comprehensive dosage intake logs, status badges, adherence percentage metrics, and profile filtering.
        </p>
      </div>

      <HistoryTable />
    </div>
  );
}
