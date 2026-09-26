import React from 'react';
import { TrendingUp, BarChart3, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getAdherenceTrendsData } from './analyticsService';

export default function AdherenceTrendsChart() {
  const data = getAdherenceTrendsData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 7-Day Consistency Trend Bar Chart */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#DC143C" /> 7-Day Medication Adherence Trend
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Daily dose intake consistency breakdown over the current week.
            </p>
          </div>
          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> 95% Weekly Consistency Score
          </span>
        </div>

        {/* Visual Bar Chart Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', alignItems: 'end', height: '160px', padding: '16px 0', borderBottom: '2px solid #fee2e2' }}>
          {data.dailyTrends.map((t, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: t.percentage === 100 ? '#10b981' : '#f59e0b' }}>
                {t.percentage}%
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${t.percentage}%`,
                  backgroundColor: t.percentage === 100 ? '#10b981' : '#f59e0b',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease'
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>{t.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disease Category Compliance Breakdown */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#DC143C', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} /> Adherence Rate by Disease Category
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {data.categoryBreakdown.map((item, idx) => (
            <div key={idx} style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FFF0F3', border: '1px solid #FFD6DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{item.category}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.status}</span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#DC143C' }}>
                {item.rate}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
