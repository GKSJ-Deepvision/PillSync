import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage({ setActiveTab, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameFromEmail = email ? email.split('@')[0] : 'System Admin';
    onLoginSuccess({
      name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      email: email || 'admin@pillsync.org',
      role: 'admin'
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

        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <ShieldCheck size={24} />
        </div>

        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#334155', textAlign: 'center' }}>
          Admin Console Login
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Authorized administrator login for system settings & user management.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Admin Email Address</label>
            <input 
              type="email" 
              placeholder="admin@pillsync.org" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Master Security Key / Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '6px' }}
          >
            Authenticate Admin Session
          </button>
        </form>
      </div>
    </div>
  );
}
