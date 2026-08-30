import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Calendar, Plus } from 'lucide-react';

export default function MedicineSchedulePage() {
  const navigate = useNavigate();

  // Start with empty schedule state - NO PRE-POPULATED DATA
  const [schedule, setSchedule] = useState([]);

  const setStatus = (id, newStatus) => {
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          📅 Today's Medicine Schedule
        </h2>
        <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {schedule.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <Calendar size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Scheduled Doses for Today</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>
            Add medicines to your schedule to view your morning, afternoon & night intake routine.
          </p>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px' }}>
            + Add Medicine Schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {schedule.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={18} /> {item.time}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>💊 {item.med}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.dosage} • {item.slot} Routine</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.status === 'Taken' ? (
                  <span className="badge-taken"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Taken</span>
                ) : item.status === 'Snoozed' ? (
                  <span className="badge-snoozed">Snoozed (15m)</span>
                ) : item.status === 'Missed' ? (
                  <span className="badge-missed">Missed</span>
                ) : (
                  <>
                    <button onClick={() => setStatus(item.id, 'Taken')} className="btn-primary" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                      Taken
                    </button>
                    <button onClick={() => setStatus(item.id, 'Missed')} style={{ border: '1px solid #dc2626', color: '#dc2626', background: '#fef2f2', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                      Missed
                    </button>
                    <button onClick={() => setStatus(item.id, 'Snoozed')} style={{ border: '1px solid #d97706', color: '#d97706', background: '#fffbeb', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                      Snooze
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
