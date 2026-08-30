import React, { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';

export default function CaregiverRegisterPage({ setActiveTab, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      name: name || 'Caregiver User',
      email: email || 'caregiver@pillsync.org',
      role: 'caregiver'
    });
  };

  return (
    <div style={{ maxWidth: '440px', margin: '20px auto 0' }} className="glass-card">
      <div style={{ padding: '28px' }}>
        <button 
          onClick={() => setActiveTab('landing')} 
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}
        >
          <ArrowLeft size={14} /> Back to Role Selector
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#d97706', textAlign: 'center' }}>
          Caregiver Registration
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Register as a caregiver to monitor family members or assigned patients.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Eleanor Vance" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Caregiver Email Address</label>
            <input 
              type="email" 
              placeholder="eleanor@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Phone Number (For Missed Dose Alerts)</label>
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

          <button type="submit" style={{ padding: '12px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '6px' }}>
            Create Caregiver Account
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Already have a caregiver account?{' '}
          <button 
            onClick={() => setActiveTab('caregiver-login')}
            style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
