import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, AlertTriangle, CheckCircle, PhoneCall, ArrowLeft, Plus, BellRing } from 'lucide-react';

export default function CaregiverPatientDetail() {
  const navigate = useNavigate();

  // Selected Patient Details - Editable / Manual Entry State
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    condition: '',
    phone: '',
    adherence: 0
  });

  const [isEditing, setIsEditing] = useState(true); // Open edit form if empty

  // Patient's Today Checklist - STARTS EMPTY
  const [patientChecklist, setPatientChecklist] = useState([]);

  // New Dose Item Form State
  const [newDoseName, setNewDoseName] = useState('');
  const [newDoseTime, setNewDoseTime] = useState('08:00 AM');

  const handleAddDoseToChecklist = (e) => {
    e.preventDefault();
    if (!newDoseName) return;
    setPatientChecklist([
      ...patientChecklist,
      { id: Date.now(), med: newDoseName, time: newDoseTime, status: 'Pending' }
    ]);
    setNewDoseName('');
  };

  const toggleChecklistStatus = (id, status) => {
    setPatientChecklist(patientChecklist.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => navigate('/caregiver')} 
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC143C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={18} /> Back to Caregiver Dashboard
        </button>
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          style={{ border: '1px solid #DC143C', color: '#DC143C', background: 'white', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          {isEditing ? 'Save Details' : 'Edit Patient Info'}
        </button>
      </div>

      {/* Patient Profile Header Card */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)' }}>
        {isEditing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Patient Name</label>
              <input type="text" placeholder="e.g. Rahul Vance" value={patientData.name} onChange={(e) => setPatientData({ ...patientData, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Age</label>
              <input type="number" placeholder="75" value={patientData.age} onChange={(e) => setPatientData({ ...patientData, age: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Medical Condition</label>
              <input type="text" placeholder="e.g. Diabetes, Hypertension" value={patientData.condition} onChange={(e) => setPatientData({ ...patientData, condition: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Contact Phone</label>
              <input type="tel" placeholder="+1 555-000-0000" value={patientData.phone} onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #ED4264 0%, #DC143C 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
                {patientData.name ? patientData.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {patientData.name || 'Patient Profile'} {patientData.age && `(Age ${patientData.age})`}
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Condition: {patientData.condition || 'Not specified'} • Phone: {patientData.phone || 'Not specified'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => alert(`Dispatching emergency call to ${patientData.phone || 'Patient'}`)}
                style={{ border: '1px solid #dc2626', color: '#dc2626', background: '#fef2f2', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PhoneCall size={16} /> Emergency Call Patient
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Today's Medicines Checklist */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          📋 Monitored Today's Medicines Checklist
        </h3>

        {/* Add Dose Form */}
        <form onSubmit={handleAddDoseToChecklist} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="e.g. Lisinopril 10mg" 
            value={newDoseName} 
            onChange={(e) => setNewDoseName(e.target.value)} 
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
            required 
          />
          <input 
            type="text" 
            placeholder="08:00 AM" 
            value={newDoseTime} 
            onChange={(e) => setNewDoseTime(e.target.value)} 
            style={{ width: '110px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
          />
          <button type="submit" className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
            + Add Dose Checklist
          </button>
        </form>

        {patientChecklist.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', backgroundColor: '#FFF0F3', borderRadius: '10px', border: '1px dashed #FFD6DC' }}>
            No medicine checklist items added for this patient. Add a dose above to track intake status.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {patientChecklist.map(c => (
              <div key={c.id} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>💊 {c.med}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '10px' }}>⏰ Scheduled: {c.time}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {c.status === 'Taken' ? (
                    <span className="badge-taken">✓ Taken</span>
                  ) : c.status === 'Missed' ? (
                    <span className="badge-missed">✕ Missed</span>
                  ) : (
                    <>
                      <button onClick={() => toggleChecklistStatus(c.id, 'Taken')} className="btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                        Mark Taken
                      </button>
                      <button onClick={() => toggleChecklistStatus(c.id, 'Missed')} style={{ border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>
                        Mark Missed
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adherence & Refill Report Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Adherence Summary */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={18} color="#DC143C" /> Adherence Report Summary
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Total Tracked Doses: <strong>{patientChecklist.length}</strong> | Taken: <strong>{patientChecklist.filter(c => c.status === 'Taken').length}</strong>
          </p>
        </div>

        {/* Refill Alerts */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: '#78350f', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={18} color="#d97706" /> Patient Refill Status
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            No stock depletion alerts recorded for this patient.
          </p>
        </div>

      </div>

    </div>
  );
}
