import React, { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';

export default function PatientRegisterPage({ setActiveTab, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      name: name || 'Patient User',
      email: email || 'patient@pillsync.org',
      role: 'patient'
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

        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#DC143C', textAlign: 'center' }}>
          Patient Registration
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Create your account to manage your medicine routine & prescriptions.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }} 
              required 
            />
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

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}>
            Create Patient Account
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Already have a patient account?{' '}
          <button 
            onClick={() => setActiveTab('patient-login')}
            style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
