import React, { useState } from 'react';

export default function RegisterPage({ setActiveTab, setRole }) {
  const [selectedRole, setSelectedRole] = useState('patient');

  const handleSubmit = (e) => {
    e.preventDefault();
    setRole(selectedRole);
    setActiveTab('dashboard');
  };

  return (
    <div style={{ maxWidth: '460px', margin: '20px auto 0' }} className="glass-card">
      <div style={{ padding: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, color: '#DC143C', textAlign: 'center' }}>
          Create PillSync Account
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Join the intelligent medication tracking platform.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name</label>
            <input type="text" placeholder="John Doe" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input type="email" placeholder="john@example.com" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Phone Number</label>
            <input type="tel" placeholder="+1 (555) 000-0000" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Password</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Confirm Password</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Select Account Role</label>
            <div style={{ display: 'flex', gap: '16px', backgroundColor: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#881337', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="patient" 
                  checked={selectedRole === 'patient'} 
                  onChange={() => setSelectedRole('patient')} 
                /> Patient
              </label>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#881337', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="caregiver" 
                  checked={selectedRole === 'caregiver'} 
                  onChange={() => setSelectedRole('caregiver')} 
                /> Caregiver
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem', marginTop: '8px' }}>
            Create Account
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Already have an account?{' '}
          <button 
            onClick={() => setActiveTab('login')}
            style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
