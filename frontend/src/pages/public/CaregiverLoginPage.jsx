import React, { useState } from 'react';
import { Users, Lock, ArrowLeft } from 'lucide-react';

export default function CaregiverLoginPage({ setActiveTab, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [caregiverId, setCaregiverId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameFromEmail = email ? email.split('@')[0] : 'Caregiver User';
    onLoginSuccess({
      name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      email: email || 'caregiver@pillsync.org',
      role: 'caregiver'
    });
  };

  return (
    <div style={{ maxWidth: '420px', margin: '30px auto 0' }} className="glass-card">
      <div style={{ padding: '28px' }}>
        <button 
          onClick={() => setActiveTab('landing')} 
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}
        >
          <ArrowLeft size={14} /> Back to Role Selector
        </button>

        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Users size={24} />
        </div>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#d97706', textAlign: 'center' }}>
          Caregiver Portal Login
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Sign in to monitor assigned patient schedules & receive adherence alerts.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Caregiver Email Address</label>
            <input 
              type="email" 
              placeholder="caregiver@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Caregiver License / Access ID (Optional)</label>
            <input 
              type="text" 
              placeholder="CG-98421" 
              value={caregiverId}
              onChange={(e) => setCaregiverId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Remember me
            </label>
            <button 
              type="button"
              onClick={() => setActiveTab('forgot-password')} 
              style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 600, cursor: 'pointer' }}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '4px' }}
          >
            Login as Caregiver
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Don't have a caregiver account?{' '}
          <button 
            onClick={() => setActiveTab('caregiver-register')}
            style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
