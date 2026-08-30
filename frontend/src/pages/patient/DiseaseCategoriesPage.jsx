import React from 'react';
import { Heart, Activity, Bug, Pill, Sprout, ShieldAlert } from 'lucide-react';

export default function DiseaseCategoriesPage() {
  const categories = [
    { title: 'Blood Pressure', count: '2 Active Medicines', icon: Heart, color: '#dc2626', bg: '#fef2f2' },
    { title: 'Diabetes', count: '1 Active Medicine', icon: Activity, color: '#d97706', bg: '#fffbeb' },
    { title: 'Thyroid', count: '0 Medicines', icon: ShieldAlert, color: '#9333ea', bg: '#faf5ff' },
    { title: 'Antibiotics', count: '1 Active Medicine', icon: Bug, color: '#2563eb', bg: '#eff6ff' },
    { title: 'Vitamins', count: '3 Active Medicines', icon: Sprout, color: '#16a34a', bg: '#f0fdf4' },
    { title: 'Heart Medications', count: '1 Active Medicine', icon: Pill, color: '#DC143C', bg: '#fff1f2' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
        🏷️ Disease-Based Medicine Categories
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {categories.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: '20px', cursor: 'pointer' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={22} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{c.title}</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
