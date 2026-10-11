import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ShieldCheck } from 'lucide-react';
import FamilyProfileSelector from '../../features/profile/FamilyProfileSelector';
import PillSyncLogo from '../common/PillSyncLogo';

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
        style={{ cursor: 'pointer' }}
      >
        <PillSyncLogo size="md" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!isPublic && (
          <FamilyProfileSelector />
        )}

        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}
        >
          Home / Role Selector
        </button>

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
