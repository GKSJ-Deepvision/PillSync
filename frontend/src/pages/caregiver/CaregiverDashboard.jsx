import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldAlert, BellRing, PhoneCall, Plus, Trash2, Eye, RefreshCw, BarChart3, Pill } from 'lucide-react';

export default function CaregiverDashboard() {
  const navigate = useNavigate();

  // Start with empty patients roster - NO PRE-POPULATED DATA
  const [patients, setPatients] = useState([]);
  
  // Form State to Add Patient Manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '', age: '', condition: 'Hypertension', phone: ''
  });

  // Missed-Dose Alerts Stream & Refill Notifications - STARTS EMPTY
  const [alerts, setAlerts] = useState([]);
  const [refillAlerts, setRefillAlerts] = useState([]);

  const handleAddPatientSubmit = (e) => {
    e.preventDefault();
    if (!newPatient.name) return;
    const added = {
      id: Date.now(),
      name: newPatient.name,
      age: newPatient.age || 65,
      condition: newPatient.condition,
      phone: newPatient.phone || '+1 555-000-0000',
      status: 'All Doses Pending',
      adherence: 100,
      statusColor: 'badge-snoozed'
    };
    setPatients([...patients, added]);
    setNewPatient({ name: '', age: '', condition: 'Hypertension', phone: '' });
    setShowAddForm(false);
  };

  const handleDeletePatient = (id) => {
    setPatients(patients.filter(p => p.id !== id));
  };

  const handleSendNudge = (patientName) => {
    const newAlert = {
      id: Date.now(),
      type: 'nudge',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: '🟠 Manual Nudge Sent',
      desc: `Caregiver nudge notification dispatched to ${patientName}.`
    };
    setAlerts([newAlert, ...alerts]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Caregiver Portal Header Banner */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)', border: '1px solid #fecdd3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF0F3', color: '#DC143C', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>
              <Users size={16} /> Caregiver Monitoring Portal
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Monitored Patient Roster & Alert Hub
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Monitor assigned patients, receive missed-dose alerts, refill notifications, and adherence reports.
            </p>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary" 
            style={{ fontSize: '0.88rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> {showAddForm ? 'Cancel Form' : 'Assign New Patient'}
          </button>
        </div>
      </div>

      {/* Manual Patient Assignment Form */}
      {showAddForm && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#DC143C' }}>
            ➕ Assign New Patient Profile
          </h3>
          <form onSubmit={handleAddPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Patient Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Eleanor Vance" 
                  value={newPatient.name} 
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Patient Age</label>
                <input 
                  type="number" 
                  placeholder="72" 
                  value={newPatient.age} 
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Diagnosed Condition</label>
                <select 
                  value={newPatient.condition} 
                  onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option>Hypertension</option>
                  <option>Type 2 Diabetes</option>
                  <option>Asthma & Cardiac</option>
                  <option>Thyroid</option>
                  <option>General Monitoring</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Patient Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000" 
                  value={newPatient.phone} 
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '0.9rem', marginTop: '6px' }}>
              [ + Assign Patient to Caregiver Roster ]
            </button>
          </form>
        </div>
      )}

      {/* Patients Roster Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          👥 Monitored Patients List ({patients.length})
        </h3>

        {patients.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#FFF0F3',
            borderRadius: '16px',
            border: '2px dashed #FFD6DC'
          }}>
            <Users size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
              No Monitored Patients Assigned Yet
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
              Your caregiver roster is clean. Click <strong>"Assign New Patient"</strong> above to manually enter a patient's name, age, condition, and contact details.
            </p>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="btn-primary" 
              style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Assign Patient Manually
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>Patient Name</th>
                  <th style={{ padding: '10px' }}>Condition</th>
                  <th style={{ padding: '10px' }}>Adherence</th>
                  <th style={{ padding: '10px' }}>Today's Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Caregiver Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>
                      👤 {p.name} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>(Age {p.age})</span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{p.condition}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: p.adherence >= 80 ? '#16a34a' : '#dc2626' }}>
                      {p.adherence}%
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge-snoozed">{p.status}</span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => navigate('/caregiver/patients')} 
                          style={{ background: '#FFF0F3', border: '1px solid #FFD6DC', color: '#DC143C', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button 
                          onClick={() => handleSendNudge(p.name)} 
                          style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#DC143C', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <BellRing size={14} /> Nudge
                        </button>
                        <button 
                          onClick={() => handleDeletePatient(p.id)} 
                          style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missed-Dose Alerts & Refill Notifications Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Missed Dose Stream */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} /> Missed-Dose Alert Stream
          </h3>

          {alerts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No missed-dose alerts dispatches recorded. Alerts sent upon missed patient routines will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{ padding: '12px', backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>{alert.time} — {alert.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '2px' }}>{alert.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refill Notifications */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} /> Refill Notifications Feed
          </h3>

          {refillAlerts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No low-stock refill warnings dispatched yet. Refill alerts for assigned patients will populate here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {refillAlerts.map(r => (
                <div key={r.id} style={{ padding: '12px', backgroundColor: '#fffbeb', borderLeft: '4px solid #d97706', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 700 }}>{r.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
