import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Server, ShieldCheck, Activity, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Start with empty users directory - NO PRE-POPULATED HARDCODED DATA
  const [users, setUsers] = useState([]);

  // Manual Add User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', role: 'Patient', status: 'Active'
  });

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const added = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status
    };
    setUsers([...users, added]);
    setNewUser({ name: '', email: '', role: 'Patient', status: 'Active' });
    setShowAddForm(false);
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Blocked' : 'Active' } : u));
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Dynamic calculations based ONLY on user-entered data
  const totalUsers = users.length;
  const patientCount = users.filter(u => u.role === 'Patient').length;
  const caregiverCount = users.filter(u => u.role === 'Caregiver').length;
  const adminCount = users.filter(u => u.role === 'Admin' || u.role === 'Administrator').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Admin Header Banner */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)', border: '1px solid #fecdd3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>
              <ShieldCheck size={16} /> Admin Operations Console
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Platform User Directory & System Metrics
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Manage system users, caregiver assignments, notification gateway settings, and platform operations.
            </p>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary" 
            style={{ fontSize: '0.88rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', background: '#334155' }}
          >
            <Plus size={16} /> {showAddForm ? 'Cancel Form' : 'Add New System User'}
          </button>
        </div>
      </div>

      {/* Manual Add User Form */}
      {showAddForm && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
            ➕ Manually Register System User
          </h3>
          <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Sarah Smith" 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="user@pillsync.org" 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>User Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option value="Patient">Patient</option>
                  <option value="Caregiver">Caregiver</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Account Status</label>
                <select 
                  value={newUser.status} 
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })} 
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>

            <button type="submit" style={{ padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', marginTop: '6px', cursor: 'pointer' }}>
              [ Save & Register User ]
            </button>
          </form>
        </div>
      )}

      {/* Dynamic System Metrics (Based ONLY on User Data) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total System Users</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#334155', margin: '4px 0' }}>{totalUsers}</div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>User accounts created</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Registered Patients</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#DC143C', margin: '4px 0' }}>{patientCount}</div>
          <span style={{ fontSize: '0.8rem', color: '#DC143C', fontWeight: 600 }}>Patient accounts</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Registered Caregivers</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706', margin: '4px 0' }}>{caregiverCount}</div>
          <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>Caregiver accounts</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Administrators</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>{adminCount}</div>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>Admin accounts</span>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          👥 Registered User Directory ({users.length})
        </h3>

        {users.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#FFF0F3',
            borderRadius: '16px',
            border: '2px dashed #FFD6DC'
          }}>
            <Users size={44} color="#334155" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
              No Registered System Users
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
              The admin directory is completely empty. Click <strong>"Add New System User"</strong> above to manually register a Patient, Caregiver, or Admin.
            </p>
            <button 
              onClick={() => setShowAddForm(true)} 
              style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add User Manually
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fee2e2', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>User Name</th>
                  <th style={{ padding: '10px' }}>Email Address</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: u.role === 'Admin' ? '#f1f5f9' : u.role === 'Caregiver' ? '#fffbeb' : '#fff1f2', color: u.role === 'Admin' ? '#334155' : u.role === 'Caregiver' ? '#d97706' : '#DC143C', fontWeight: 700, fontSize: '0.78rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={u.status === 'Active' ? 'badge-taken' : 'badge-missed'}>{u.status}</span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => toggleUserStatus(u.id)}
                          style={{ border: '1px solid #cbd5e1', background: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: u.status === 'Active' ? '#dc2626' : '#16a34a' }}
                        >
                          {u.status === 'Active' ? 'Block' : 'Unblock'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ border: '1px solid #fecdd3', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}
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

    </div>
  );
}
