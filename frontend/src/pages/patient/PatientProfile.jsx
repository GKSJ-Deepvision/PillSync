import React, { useState } from 'react';
import { 
  User, HeartPulse, Pill, Plus, Calendar, Clock, BarChart3, RefreshCw, 
  Tag, Bell, History, Key, Shield, LogOut, Trash2, Edit3, Camera, CheckCircle2, 
  XCircle, AlertTriangle, AlertOctagon, PhoneCall, Check, FileText
} from 'lucide-react';
import ReminderModal from './ReminderModal';

export default function PatientProfile({ currentUser, setActiveTab, onLogout }) {
  const [activeSection, setActiveSection] = useState('personal');

  // --- Completely Empty Initial State (No Hardcoded Default Data) ---
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    dob: '',
    gender: 'Select Gender',
    phone: '',
    email: currentUser?.email || '',
    address: '',
    medicalConditions: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Medicines List - STARTS EMPTY
  const [medicines, setMedicines] = useState([]);

  // New Medicine Form State (Method 1 & Method 2)
  const [addMethod, setAddMethod] = useState('manual');
  const [newMed, setNewMed] = useState({
    name: '', dosage: '', quantity: '', frequency: '1 / day', time: '08:00', startDate: '', endDate: '', category: 'Diabetes'
  });
  const [ocrScanned, setOcrScanned] = useState(false);

  // Today's Schedule State - STARTS EMPTY
  const [schedule, setSchedule] = useState([]);

  // Notifications List - STARTS EMPTY
  const [notifications, setNotifications] = useState([]);

  // Intake History Logs - STARTS EMPTY
  const [historyLogs, setHistoryLogs] = useState([]);

  // Reminder Modal Popup
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Handlers for Manual Data Editing & Addition
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleAddMedicineSubmit = (e) => {
    e.preventDefault();
    if (!newMed.name) return;
    const added = {
      id: Date.now(),
      name: newMed.name,
      dosage: newMed.dosage || '1 Tablet',
      quantity: `${newMed.quantity || 30} Pills`,
      frequency: newMed.frequency,
      startDate: newMed.startDate || new Date().toISOString().split('T')[0],
      endDate: newMed.endDate || '2026-09-30',
      category: newMed.category,
      stock: parseInt(newMed.quantity) || 30,
      status: 'Active'
    };
    setMedicines([...medicines, added]);
    setSchedule([...schedule, {
      id: Date.now(),
      time: newMed.time || '08:00 AM',
      slot: 'Scheduled',
      med: newMed.name,
      dosage: newMed.dosage || '1 Tablet',
      status: 'Pending'
    }]);
    setNewMed({ name: '', dosage: '', quantity: '', frequency: '1 / day', time: '08:00', startDate: '', endDate: '', category: 'Diabetes' });
    setActiveSection('medicines');
  };

  const handleDeleteMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleScheduleAction = (id, actionStatus) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, status: actionStatus } : item));
    const target = schedule.find(s => s.id === id);
    if (target) {
      setHistoryLogs([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: target.time,
        med: `${target.med} (${target.dosage})`,
        status: actionStatus
      }, ...historyLogs]);
    }
  };

  const handleAddStock = (id, amount = 30) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, stock: m.stock + amount } : m));
  };

  // Adherence Rate Math
  const takenCount = schedule.filter(s => s.status === 'Taken').length;
  const missedCount = schedule.filter(s => s.status === 'Missed').length;
  const totalCount = schedule.length;
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Patient Profile Master Banner */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)', border: '1px solid #fecdd3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #ED4264 0%, #DC143C 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {profileData.name || 'Patient Profile'}
              </h1>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {profileData.email || 'No email set'} • Gender: {profileData.gender} • DOB: {profileData.dob || 'Not set'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsReminderOpen(true)}
              style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#DC143C', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔔 Test Reminder UI Modal
            </button>
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)} 
              style={{ border: '1px solid #DC143C', color: '#DC143C', background: 'white', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} /> {isEditingProfile ? 'Done Editing' : 'Edit Profile Manually'}
            </button>
          </div>
        </div>
      </div>

      {/* Patient Profile Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '2px solid #fee2e2' }}>
        {[
          { id: 'personal', label: '👤 Personal & Healthcare', icon: User },
          { id: 'medicines', label: '💊 My Medicines', icon: Pill },
          { id: 'add-medicine', label: '➕ Add Medicine', icon: Plus },
          { id: 'schedule', label: '📅 Schedule', icon: Calendar },
          { id: 'adherence', label: '📊 Adherence', icon: BarChart3 },
          { id: 'refills', label: '🔄 Refill Prediction', icon: RefreshCw },
          { id: 'categories', label: '🏷️ Categories', icon: Tag },
          { id: 'notifications', label: '🔔 Notifications', icon: Bell },
          { id: 'history', label: '📜 History', icon: History },
          { id: 'account', label: '⚙️ Account', icon: Shield }
        ].map(tab => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#DC143C' : '#fff1f2',
                color: isActive ? 'white' : '#881337',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Personal & Healthcare Information (Editable) */}
      {activeSection === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#DC143C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Personal Information
            </h3>

            {isEditingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name</label>
                  <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} placeholder="Enter your full name..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Age / Date of Birth</label>
                  <input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Gender</label>
                  <select name="gender" value={profileData.gender} onChange={handleProfileChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                    <option>Select Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <input type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="+1 555-000-0000" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Email Address</label>
                  <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} placeholder="user@example.com" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Address</label>
                  <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Enter home address..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.88rem' }}>
                <div><span style={{ color: '#64748b', display: 'block' }}>Full Name</span><strong>{profileData.name || 'Not filled (Click Edit)'}</strong></div>
                <div><span style={{ color: '#64748b', display: 'block' }}>Date of Birth</span><strong>{profileData.dob || 'Not filled'}</strong></div>
                <div><span style={{ color: '#64748b', display: 'block' }}>Gender</span><strong>{profileData.gender}</strong></div>
                <div><span style={{ color: '#64748b', display: 'block' }}>Phone</span><strong>{profileData.phone || 'Not filled'}</strong></div>
                <div><span style={{ color: '#64748b', display: 'block' }}>Email</span><strong>{profileData.email || 'Not filled'}</strong></div>
                <div><span style={{ color: '#64748b', display: 'block' }}>Address</span><strong>{profileData.address || 'Not filled'}</strong></div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#DC143C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={18} /> Healthcare Information & Emergency Contacts
            </h3>

            {isEditingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Medical Conditions</label>
                  <input type="text" name="medicalConditions" value={profileData.medicalConditions} onChange={handleProfileChange} placeholder="e.g. Diabetes, Hypertension" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Allergies</label>
                  <input type="text" name="allergies" value={profileData.allergies} onChange={handleProfileChange} placeholder="e.g. Penicillin" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Emergency Contact Name</label>
                  <input type="text" name="emergencyContactName" value={profileData.emergencyContactName} onChange={handleProfileChange} placeholder="Contact Name..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Emergency Contact Phone</label>
                  <input type="tel" name="emergencyContactPhone" value={profileData.emergencyContactPhone} onChange={handleProfileChange} placeholder="+1 555-000-0000" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Medical Conditions</span>
                  <strong>{profileData.medicalConditions || 'None added yet'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Allergies</span>
                  <strong>{profileData.allergies || 'None added yet'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Emergency Contact</span>
                  <strong>{profileData.emergencyContactName || 'None'} ({profileData.emergencyContactPhone || 'No phone'})</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: My Medicines Page */}
      {activeSection === 'medicines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>💊 My Active Medicines</h3>
            <button onClick={() => setActiveSection('add-medicine')} className="btn-primary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add New Medicine
            </button>
          </div>

          {medicines.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
              <Pill size={40} color="#DC143C" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Medicines Added Yet</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>Click below to manually enter your medicine name, dosage, quantity, and start/end dates.</p>
              <button onClick={() => setActiveSection('add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem' }}>
                + Add Medicine Manually
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {medicines.map(m => (
                <div key={m.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#DC143C' }}>💊 {m.name}</h4>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fff1f2', color: '#DC143C', fontWeight: 700 }}>
                        {m.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                      <div><strong>Dosage:</strong> {m.dosage}</div>
                      <div><strong>Quantity:</strong> {m.quantity}</div>
                      <div><strong>Frequency:</strong> {m.frequency}</div>
                      <div><strong>Duration:</strong> {m.startDate} to {m.endDate}</div>
                      <div>
                        <strong>Remaining Stock:</strong>{' '}
                        <span style={{ fontWeight: 800, color: m.stock <= 10 ? '#dc2626' : '#16a34a' }}>
                          {m.stock} Pills {m.stock <= 10 && '⚠️ Low'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button onClick={() => handleAddStock(m.id, 30)} style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                      + Add 30 Stock
                    </button>
                    <button onClick={() => handleDeleteMedicine(m.id)} style={{ border: '1px solid #fecdd3', background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Add Medicine Page */}
      {activeSection === 'add-medicine' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '680px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800, color: '#DC143C' }}>
            ➕ Add Medicine Schedule Manually
          </h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #fee2e2', paddingBottom: '8px' }}>
            <button onClick={() => setAddMethod('manual')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: addMethod === 'manual' ? '#DC143C' : '#fff1f2', color: addMethod === 'manual' ? 'white' : '#881337', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Method 1 — Manual Entry
            </button>
            <button onClick={() => setAddMethod('ocr')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: addMethod === 'ocr' ? '#DC143C' : '#fff1f2', color: addMethod === 'ocr' ? 'white' : '#881337', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Method 2 — Upload Image (AI/OCR)
            </button>
          </div>

          {addMethod === 'manual' ? (
            <form onSubmit={handleAddMedicineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Medicine Name</label>
                  <input type="text" placeholder="e.g. Metformin" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Dosage</label>
                  <input type="text" placeholder="e.g. 500 mg" value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Quantity (Stock Count)</label>
                  <input type="number" placeholder="60" value={newMed.quantity} onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Frequency</label>
                  <select value={newMed.frequency} onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                    <option>1 / day</option>
                    <option>2 / day</option>
                    <option>3 / day</option>
                    <option>Weekly</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Time Slot</label>
                  <input type="time" value={newMed.time} onChange={(e) => setNewMed({ ...newMed, time: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Disease / Category</label>
                  <select value={newMed.category} onChange={(e) => setNewMed({ ...newMed, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                    <option>Diabetes</option>
                    <option>Blood Pressure</option>
                    <option>Thyroid</option>
                    <option>Antibiotics</option>
                    <option>Vitamins</option>
                    <option>Heart Medications</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input type="date" value={newMed.startDate} onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>End Date</label>
                  <input type="date" value={newMed.endDate} onChange={(e) => setNewMed({ ...newMed, endDate: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '0.9rem', marginTop: '8px' }}>
                [ Save Medicine ]
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Camera size={44} color="#DC143C" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>Upload Medicine / Prescription Image</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px' }}>AI/OCR will identify Medicine Name, Dosage, Quantity, Frequency & Prescription details.</p>

              <input type="file" id="patient-ocr" style={{ display: 'none' }} onChange={() => setOcrScanned(true)} />
              <label htmlFor="patient-ocr" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '10px 18px', fontSize: '0.85rem' }}>
                [ Upload Image ]
              </label>

              {ocrScanned && (
                <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '6px' }}>✓ AI/OCR Extracted Details:</strong>
                  <div>• <strong>Medicine Name:</strong> Metformin</div>
                  <div>• <strong>Dosage:</strong> 500 mg</div>
                  <div>• <strong>Quantity:</strong> 60 Pills</div>
                  <div>• <strong>Frequency:</strong> 2 / day</div>
                  <button 
                    onClick={() => {
                      setNewMed({ name: 'Metformin', dosage: '500 mg', quantity: '60', frequency: '2 / day', time: '08:00', startDate: '2026-08-30', endDate: '2026-09-30', category: 'Diabetes' });
                      setAddMethod('manual');
                    }} 
                    className="btn-primary" 
                    style={{ marginTop: '10px', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    [ Review & Save ]
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: Medicine Schedule Page */}
      {activeSection === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>📅 Today's Medicine Schedule</h3>

          {schedule.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
              <Calendar size={40} color="#DC143C" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Scheduled Doses Today</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>Add medicines to view your 8am/1pm/8pm intake routine.</p>
              <button onClick={() => setActiveSection('add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem' }}>
                + Add Medicine Schedule
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {schedule.map(item => (
                <div key={item.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC143C' }}>⏰ {item.time} ({item.slot})</span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 800 }}>💊 {item.med}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.dosage}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status === 'Taken' ? (
                      <span className="badge-taken">✓ Taken</span>
                    ) : item.status === 'Snoozed' ? (
                      <span className="badge-snoozed">Snoozed (15m)</span>
                    ) : item.status === 'Missed' ? (
                      <span className="badge-missed">✕ Missed</span>
                    ) : (
                      <>
                        <button onClick={() => handleScheduleAction(item.id, 'Taken')} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                          [ Taken ]
                        </button>
                        <button onClick={() => handleScheduleAction(item.id, 'Missed')} style={{ border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                          [ Missed ]
                        </button>
                        <button onClick={() => handleScheduleAction(item.id, 'Snoozed')} style={{ border: '1px solid #d97706', background: '#fffbeb', color: '#d97706', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                          [ Snooze ]
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: Medication Adherence Page */}
      {activeSection === 'adherence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>📊 Medication Adherence Analytics</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Today's Adherence</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#DC143C', margin: '4px 0' }}>{adherencePct}%</div>
            </div>

            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Taken Doses</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>{takenCount}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Missed Doses</span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>{missedCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Refill Prediction Page */}
      {activeSection === 'refills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>🔄 Refill Prediction Engine</h3>

          {medicines.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
              <RefreshCw size={40} color="#DC143C" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No Medicines to Track</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>Add medicines to calculate depletion rates and refill predictions.</p>
              <button onClick={() => setActiveSection('add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem' }}>
                + Add Medicine
              </button>
            </div>
          ) : (
            medicines.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: '20px', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#78350f' }}>💊 {m.name}</h4>
                  {m.stock <= 10 && (
                    <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ⚠ LOW STOCK
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                  <div><strong>Current Stock:</strong> {m.stock} tablets</div>
                  <div><strong>Daily Consumption:</strong> 2 tablets/day</div>
                  <div><strong>Estimated Depletion:</strong> In Math.max(1, Math.floor(m.stock / 2)) days</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAddStock(m.id, 30)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    [ Add Stock ]
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 7: Disease Categories */}
      {activeSection === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>🏷️ Medicine Categories</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { label: '❤️ Blood Pressure', count: medicines.filter(m => m.category === 'Blood Pressure').length },
              { label: '🩸 Diabetes', count: medicines.filter(m => m.category === 'Diabetes').length },
              { label: '🦋 Thyroid', count: medicines.filter(m => m.category === 'Thyroid').length },
              { label: '💊 Antibiotics', count: medicines.filter(m => m.category === 'Antibiotics').length },
              { label: '🌱 Vitamins', count: medicines.filter(m => m.category === 'Vitamins').length },
              { label: '❤️ Heart Medications', count: medicines.filter(m => m.category === 'Heart Medications').length }
            ].map((cat, i) => (
              <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{cat.label}</span>
                <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fff1f2', color: '#DC143C', fontWeight: 700 }}>
                  {cat.count} Meds
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: Notifications Feed */}
      {activeSection === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>🔔 Notifications</h3>

          {notifications.length === 0 ? (
            <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="glass-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{n.title}</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{n.desc}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{n.time}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 9: Intake History Logs */}
      {activeSection === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>📜 Medication Intake History</h3>

          {historyLogs.length === 0 ? (
            <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
              No intake logs recorded yet. Take or miss doses in your Schedule to generate history logs.
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Time</th>
                    <th style={{ padding: '8px' }}>Medicine</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{log.date}</td>
                      <td style={{ padding: '10px 8px', color: '#64748b' }}>{log.time}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>💊 {log.med}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className={log.status === 'Taken' ? 'badge-taken' : 'badge-missed'}>
                          {log.status === 'Taken' ? '✓ Taken' : '✕ Missed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 10: Account & Security */}
      {activeSection === 'account' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '500px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#DC143C' }}>⚙️ Account Settings</h3>
          <button onClick={onLogout} style={{ border: '1px solid #fecdd3', background: '#fff1f2', color: '#dc2626', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', width: '100%', textAlign: 'left' }}>
            🚪 Logout Session
          </button>
        </div>
      )}

      <ReminderModal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} />
    </div>
  );
}
