import React from 'react';

export default function BreakdownBarsChart({ categories = [
  { name: 'Blood Pressure', percentage: 95, color: '#DC143C' },
  { name: 'Diabetes', percentage: 88, color: '#3b82f6' },
  { name: 'Vitamins', percentage: 76, color: '#10b981' },
  { name: 'Heart Medications', percentage: 100, color: '#f59e0b' },
] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {categories.map((cat, idx) => (
        <div key={idx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '3px', color: '#334155' }}>
            <span>{cat.name}</span>
            <span style={{ color: cat.color, fontWeight: 700 }}>{cat.percentage}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${cat.percentage}%`,
                height: '100%',
                backgroundColor: cat.color,
                borderRadius: '4px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
