import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pill, Bell, ShieldCheck } from 'lucide-react';

export default function Navbar({ currentUser, setRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isPublic = ['/', '/login', '/login/patient', '/login/caregiver', '/login/admin', '/register', '/register/patient', '/register/caregiver', '/forgot-password'].includes(location.pathname);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #fee2e2',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 10px rgba(237, 66, 100, 0.05)'
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => navigate('/')} 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #ED4264 0%, #DC143C 100%)',
          color: 'white',
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(220, 20, 60, 0.3)'
        }}>
          <Pill size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#DC143C', letterSpacing: '-0.02em' }}>PillSync</h1>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Intelligent Medicine Reminder & Tracking Platform</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}
        >
          Home / Role Selector
        </button>

        {/* Direct URL Navigation Shortcuts */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => { setRole('patient'); navigate('/patient'); }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecdd3', background: location.pathname.startsWith('/patient') ? '#DC143C' : '#fff1f2', color: location.pathname.startsWith('/patient') ? 'white' : '#DC143C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            /patient
          </button>
          <button 
            onClick={() => { setRole('caregiver'); navigate('/caregiver'); }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fde68a', background: location.pathname.startsWith('/caregiver') ? '#d97706' : '#fffbeb', color: location.pathname.startsWith('/caregiver') ? 'white' : '#d97706', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            /caregiver
          </button>
          <button 
            onClick={() => { setRole('admin'); navigate('/admin'); }}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: location.pathname.startsWith('/admin') ? '#334155' : '#f1f5f9', color: location.pathname.startsWith('/admin') ? 'white' : '#334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            /admin
          </button>
        </div>

        {!isPublic && (
          <>
            <button 
              onClick={() => navigate('/notifications')}
              title="Notifications"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={20} color="#475569" />
            </button>

            <div 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #f1f5f9', paddingLeft: '16px', cursor: 'pointer' }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #ED4264 0%, #DC143C 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                {currentUser?.name || 'Account'}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
