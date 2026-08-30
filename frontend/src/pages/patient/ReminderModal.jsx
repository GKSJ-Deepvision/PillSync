import React from 'react';
import { Pill, CheckCircle, XCircle, Clock, BellRing } from 'lucide-react';

export default function ReminderModal({ isOpen, onClose, medicineName = 'Metformin', dosage = '500 mg', time = '08:00 AM' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="glass-card" style={{ width: '380px', padding: '28px', textAlign: 'center', boxShadow: '0 20px 40px rgba(220, 20, 60, 0.2)' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ED4264 0%, #DC143C 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 14px rgba(220, 20, 60, 0.4)'
        }}>
          <BellRing size={28} />
        </div>

        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Medication Reminder</h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 16px' }}>It's time to take your scheduled dose</p>

        <div style={{ backgroundColor: '#fff1f2', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC143C' }}>💊 {medicineName}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{dosage}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Clock size={14} /> Scheduled at {time}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> ✓ Medicine Taken
          </button>
          <button onClick={onClose} style={{ border: '1px solid #dc2626', color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <XCircle size={18} /> ✕ Medicine Missed
          </button>
          <button onClick={onClose} style={{ border: '1px solid #d97706', color: '#d97706', background: '#fffbeb', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            ⏰ Snooze (15 Mins)
          </button>
        </div>
      </div>
    </div>
  );
}
