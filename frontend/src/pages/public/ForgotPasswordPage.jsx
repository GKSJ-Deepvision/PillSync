import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage({ setActiveTab }) {
  const [sent, setSent] = useState(false);

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto 0' }} className="glass-card">
      <div style={{ padding: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800, color: '#DC143C', textAlign: 'center' }}>
          Forgot Password?
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
          Enter your registered email address below and we'll send you a password reset link.
        </p>

        {sent ? (
          <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', textAlign: 'center' }}>
            Password reset link sent! Check your inbox.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address</label>
              <input type="email" placeholder="user@example.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} required />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Send size={16} /> Send Reset Link
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => setActiveTab('login')} 
            style={{ background: 'none', border: 'none', color: '#DC143C', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
