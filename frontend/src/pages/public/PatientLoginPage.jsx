import React, { useState } from 'react';
import { User, Lock, ArrowLeft } from 'lucide-react';

export default function PatientLoginPage({ setActiveTab, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameFromEmail = email ? email.split('@')[0] : 'Patient User';
    onLoginSuccess({
      name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      email: email || 'patient@pillsync.org',
      role: 'patient'
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

        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fff1f2', color: '#DC143C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <User size={24} />
        </div>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#DC143C', textAlign: 'center' }}>
          Patient Portal Login
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Sign in to manage your medication schedule & dosage tracking.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Patient Email Address</label>
            <input 
              type="email" 
              placeholder="patient@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              required 
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
              style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 600, cursor: 'pointer' }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px' }}>
            Login as Patient
          </button>
        </form>

        <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>OR</span>
        </div>

        <button 
          onClick={() => onLoginSuccess({ name: 'Google Patient User', email: 'google.patient@example.com', role: 'patient' })}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span style={{ color: '#ea4335', fontWeight: 700 }}>G</span> Continue with Google (OAuth2)
        </button>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Don't have a patient account?{' '}
          <button 
            onClick={() => setActiveTab('patient-register')}
            style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 700, cursor: 'pointer' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
