import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Plus } from 'lucide-react';

export default function AdherencePage({ doses = [] }) {
  const navigate = useNavigate();

  const takenCount = doses.filter(s => s.status === 'TAKEN' || s.status === 'Taken').length;
  const missedCount = doses.filter(s => s.status === 'MISSED' || s.status === 'Missed').length;
  const totalCount = doses.length;
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        📊 Medication Adherence & Analytics
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Overall Adherence Rate</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#DC143C', margin: '4px 0' }}>
            {adherencePct}%
          </div>
          <span style={{ fontSize: '0.8rem', color: totalCount > 0 ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
            {totalCount > 0 ? `${takenCount}/${totalCount} Completed` : 'No data recorded'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Doses Taken</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>
            {takenCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Successful intake logs</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Doses Missed</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>
            {missedCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Missed intake logs</span>
        </div>
      </div>

      {/* Empty State Banner when no dose data exists */}
      {totalCount === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <BarChart3 size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Adherence Records Yet
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            Add medicines to your schedule and log dose intake (Taken/Missed) to generate compliance metrics and weekly consistency charts.
          </p>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Medicine to Start Tracking
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Intake Compliance Summary
          </h3>
          <div style={{ fontSize: '0.9rem', color: '#475569' }}>
            Total Dose Logs Recorded: <strong>{totalCount}</strong> | Taken Rate: <strong>{adherencePct}%</strong>
          </div>
        </div>
      )}
    </div>
  );
}
