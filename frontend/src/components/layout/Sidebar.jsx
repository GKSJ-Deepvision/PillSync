import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Pill, Calendar, FileText, BarChart3, RefreshCw, History, Bell, 
  User, Settings, LogOut, Users, UserCheck, Link, ShieldAlert
} from 'lucide-react';

export default function Sidebar({ currentRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  const patientNav = [
    { path: '/patient', label: 'Dashboard', icon: Home },
    { 
      id: 'medicines-group', 
      label: 'My Medicines', 
      icon: Pill,
      children: [
        { path: '/medicines', label: 'All Medicines' },
        { path: '/add-medicine', label: 'Add Medicine' },
        { path: '/categories', label: 'Categories' }
      ]
    },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/adherence', label: 'Adherence', icon: BarChart3 },
    { path: '/refills', label: 'Refills', icon: RefreshCw },
    { path: '/history', label: 'History', icon: History },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const caregiverNav = [
    { path: '/caregiver', label: 'Dashboard', icon: Home },
    { path: '/caregiver/patients', label: 'My Patients', icon: Users },
    { path: '/caregiver/patients', label: 'Patient Medicines', icon: Pill },
    { path: '/notifications', label: 'Alerts', icon: Bell },
    { path: '/adherence', label: 'Adherence Reports', icon: BarChart3 },
    { path: '/refills', label: 'Refill Alerts', icon: RefreshCw },
    { path: '/history', label: 'Medication History', icon: History },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminNav = [
    { path: '/admin', label: 'Dashboard', icon: Home },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/users', label: 'Caregivers', icon: UserCheck },
    { path: '/admin/users', label: 'Assignments', icon: Link },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/adherence', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  // Determine active role from current URL path
  const activeRole = location.pathname.startsWith('/caregiver') ? 'caregiver' : location.pathname.startsWith('/admin') ? 'admin' : 'patient';
  const items = activeRole === 'caregiver' ? caregiverNav : activeRole === 'admin' ? adminNav : patientNav;

  return (
    <aside style={{
      width: '250px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #fee2e2',
      height: 'calc(100vh - 65px)',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto'
    }}>
      <div>
        <div style={{ padding: '0 12px 10px', fontSize: '0.75rem', fontWeight: 700, color: '#DC143C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {activeRole === 'admin' ? 'PillSync Admin' : activeRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Navigation'}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isDirectActive = item.path && location.pathname === item.path;
            const isParentActive = item.children && item.children.some(c => location.pathname === c.path);

            return (
              <div key={idx}>
                <button
                  onClick={() => {
                    if (item.children) {
                      navigate(item.children[0].path);
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (isDirectActive || isParentActive) ? '#fff1f2' : 'transparent',
                    color: (isDirectActive || isParentActive) ? '#DC143C' : '#475569',
                    fontWeight: (isDirectActive || isParentActive) ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={18} color={(isDirectActive || isParentActive) ? '#DC143C' : '#64748b'} />
                  {item.label}
                </button>

                {item.children && (
                  <div style={{ marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {item.children.map((child, cIdx) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <button
                          key={cIdx}
                          onClick={() => navigate(child.path)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isChildActive ? '#fecdd3' : 'transparent',
                            color: isChildActive ? '#9f1239' : '#64748b',
                            fontWeight: isChildActive ? 700 : 500,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          • {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div style={{ borderTop: '1px solid #fee2e2', paddingTop: '12px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <LogOut size={18} />
          Exit to Home
        </button>
      </div>
    </aside>
  );
}
