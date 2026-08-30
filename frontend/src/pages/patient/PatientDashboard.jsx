import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, RefreshCw, AlertTriangle, Pill, Plus, Calendar, FileText } from 'lucide-react';

export default function PatientDashboard({ currentUser }) {
  const navigate = useNavigate();

  // Start with empty schedule & doses state - NO PRE-POPULATED DATA
  const [doses, setDoses] = useState([]);

  const handleStatusChange = (id, newStatus) => {
    setDoses(doses.map(d => d.id === id ? {
      ...d, 
      status: newStatus, 
      loggedAt: newStatus === 'TAKEN' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
    } : d));
  };

  const takenCount = doses.filter(d => d.status === 'TAKEN').length;
  const totalCount = doses.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Adherence Rate Widget */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Today's Adherence Rate</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: totalCount > 0 ? '#DC143C' : '#94a3b8', backgroundColor: '#FFF0F3', padding: '2px 8px', borderRadius: '12px' }}>
              {totalCount > 0 ? `${takenCount}/${totalCount} Completed` : 'No Data'}
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#DC143C', margin: '8px 0' }}>
            {adherenceRate}%
          </div>
          <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${adherenceRate}%`, height: '100%', backgroundColor: '#DC143C', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
            {totalCount > 0 ? `${takenCount} of ${totalCount} scheduled doses completed today` : 'Add medicines to track daily adherence'}
          </span>
        </div>

        {/* Action Quick Bar */}
        <div className="glass-card" style={{ padding: '20px', backgroundColor: '#FFF0F3', border: '1px solid #FFD6DC' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#DC143C', textTransform: 'uppercase' }}>Quick Actions</span>
          <h3 style={{ margin: '4px 0 10px', fontSize: '1.05rem', fontWeight: 800, color: '#2B181D' }}>Add New Data Manually</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/add-medicine')} 
              className="btn-primary" 
              style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={15} /> Add Medicine
            </button>
            <button 
              onClick={() => navigate('/prescriptions')} 
              style={{ border: '1px solid #DC143C', color: '#DC143C', background: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={15} /> Upload Prescription
            </button>
          </div>
        </div>

      </div>

      {/* Daily Medication Schedule Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Good Morning, {currentUser?.name || 'User'} 👋
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Today's Dosage Schedule</span>
          </div>
          <button 
            onClick={() => navigate('/add-medicine')}
            className="btn-primary" 
            style={{ fontSize: '0.85rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Add Medicine
          </button>
        </div>

        {/* Clean Empty State - No Pre-populated Medicines */}
        {doses.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#FFF0F3',
            borderRadius: '16px',
            border: '2px dashed #FFD6DC'
          }}>
            <Pill size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
              No Medicines Added Yet
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#7E646A', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              Your schedule is completely empty. Click below to enter your medicine name, dosage, frequency, and time slots manually.
            </p>
            <button 
              onClick={() => navigate('/add-medicine')} 
              className="btn-primary" 
              style={{ fontSize: '0.9rem', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Medicine Schedule Manually
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {doses.map((dose) => (
              <div key={dose.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: dose.status === 'TAKEN' ? '#f0fdf4' : dose.status === 'SNOOZED' ? '#fffbeb' : '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: dose.status === 'TAKEN' ? '#dcfce7' : '#FFF0F3',
                    color: dose.status === 'TAKEN' ? '#166534' : '#DC143C'
                  }}>
                    <Pill size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{dose.name}</h3>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600 }}>
                        {dose.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{dose.instructions}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                      <Clock size={15} color="#64748b" />
                      {dose.time}
                    </div>
                    {dose.loggedAt && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Taken at {dose.loggedAt}</span>
                    )}
                  </div>

                  {dose.status === 'TAKEN' ? (
                    <span className="badge-taken">✓ TAKEN</span>
                  ) : dose.status === 'SNOOZED' ? (
                    <span className="badge-snoozed">SNOOZED (15m)</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleStatusChange(dose.id, 'TAKEN')} 
                        className="btn-primary" 
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        Taken
                      </button>
                      <button 
                        onClick={() => handleStatusChange(dose.id, 'SNOOZED')} 
                        style={{ border: '1px solid #d97706', color: '#d97706', backgroundColor: '#fffbeb', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Snooze 15m
                      </button>
                      <button 
                        onClick={() => handleStatusChange(dose.id, 'MISSED')} 
                        style={{ border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Missed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
