import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Plus } from 'lucide-react';
import AdherenceTrendsChart from '../../features/analytics/AdherenceTrendsChart';
import HistoryTable from '../../features/adherence/HistoryTable';

export default function AdherencePage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} color="#DC143C" /> Medication Adherence Tracking & Analytics
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Daily history logs, adherence percentage calculations, weekly consistency trends, and missed dosage analysis.
          </p>
        </div>

        <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Medicine Schedule
        </button>
      </div>

      {/* Adherence Trends Visual Chart Component */}
      <AdherenceTrendsChart />

      {/* Daily Medication History & Intake Logs Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
          📜 Daily History & Intake Log Audit
        </h3>
        <HistoryTable />
      </div>

    </div>
  );
}
