import React, { useState } from 'react';
import { Search, Users, Plus, Trash2 } from 'lucide-react';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Start with empty users directory - NO PRE-POPULATED HARDCODED DATA
  const [users, setUsers] = useState([]);

  // Manual User Creation Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Patient');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setUsers([...users, {
      id: Date.now(),
      name,
      email,
      role,
      status: 'Active'
    }]);
    setName('');
    setEmail('');
    setShowForm(false);
  };

  const toggleStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Blocked' : 'Active' } : u));
  };

  const handleDelete = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            👥 Platform User Management & Permissions
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Register, view, block, or delete system user accounts</span>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> {showForm ? 'Close Form' : 'Register User Manually'}
        </button>
      </div>

      {/* Manual Add User Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#334155' }}>Register User</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
              required 
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
              required 
            />
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="Patient">Patient</option>
              <option value="Caregiver">Caregiver</option>
              <option value="Admin">Admin</option>
            </select>
            <button type="submit" style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              [ Save User ]
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search platform users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', borderRadius: '12px', border: '2px dashed #FFD6DC' }}>
            <Users size={40} color="#334155" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>No User Accounts Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>Click "Register User Manually" above to add new users to the system.</p>
            <button onClick={() => setShowForm(true)} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              + Register User
            </button>
          </div>
        ) : (
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
              {filtered.map(u => (
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
                        onClick={() => toggleStatus(u.id)}
                        style={{ border: '1px solid #cbd5e1', background: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: u.status === 'Active' ? '#dc2626' : '#16a34a' }}
                      >
                        {u.status === 'Active' ? 'Block' : 'Unblock'}
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
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
        )}
      </div>
    </div>
  );
}
