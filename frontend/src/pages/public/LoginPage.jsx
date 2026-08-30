import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage({ setActiveTab, setRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveTab('dashboard');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '30px auto 0' }} className="glass-card">
      <div style={{ padding: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, color: '#DC143C', textAlign: 'center' }}>
          PillSync Login
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Welcome back! Sign in to manage your medication schedule.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="user@example.com" 
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

          <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}>
            Login to Dashboard
          </button>
        </form>

        <div style={{ margin: '18px 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>OR</span>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span style={{ color: '#ea4335', fontWeight: 700 }}>G</span> Continue with Google (OAuth2)
        </button>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <button 
            onClick={() => setActiveTab('register')}
            style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 700, cursor: 'pointer' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
