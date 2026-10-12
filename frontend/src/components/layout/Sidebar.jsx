import { useAuth } from '../../context/useAuth';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Calendar,
  Users,
  Bell,
  BarChart2,
  Settings,
  Pill,
  Shield,
  User,
  LogOut,
  ScanLine,
  RefreshCw,
  X,
} from 'lucide-react';
import { PillSyncIcon } from '../common';
import './Sidebar.css';

const NAVIGATION_BY_ROLE = {
  patient: [
    { label: 'Patient Portal', href: '/patient/portal', icon: LayoutGrid },
    { label: 'Prescriptions', href: '/medications', icon: Pill },
    { label: 'Dose Reminders', href: '/reminders', icon: Calendar },
    { label: 'Adherence Report', href: '/adherence', icon: BarChart2 },
    { label: 'AI Refill Forecast', href: '/refills', icon: RefreshCw },
    { label: 'OCR Prescription Scan', href: '/ocr', icon: ScanLine },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Profile & Health', href: '/profile', icon: User },
  ],
  caregiver: [
    { label: 'Caregiver Portal', href: '/caregiver/portal', icon: LayoutGrid },
    { label: 'Assigned Patients', href: '/patients', icon: Users },
    { label: 'Prescriptions', href: '/medications', icon: Pill },
    { label: 'Dose Logs & Alerts', href: '/reminders', icon: Calendar },
    { label: 'Adherence Reports', href: '/adherence', icon: BarChart2 },
    { label: 'AI Refill Monitor', href: '/refills', icon: RefreshCw },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Practitioner Profile', href: '/profile', icon: User },
  ],
  admin: [
    { label: 'Admin Console', href: '/admin/portal', icon: LayoutGrid },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Prescriptions', href: '/medications', icon: Pill },
    { label: 'System Analytics', href: '/analytics', icon: BarChart2 },
    { label: 'AI Refill Monitor', href: '/refills', icon: RefreshCw },
    { label: 'OCR Processing', href: '/ocr', icon: ScanLine },
    { label: 'Platform Settings', href: '/settings', icon: Settings },
    { label: 'Admin Profile', href: '/profile', icon: User },
  ],
};

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onCloseMobile?.();
    await logout();
    navigate('/login');
  };

  const userRole = (user?.role || 'patient').toLowerCase();
  const navItems = NAVIGATION_BY_ROLE[userRole] || NAVIGATION_BY_ROLE.patient;
  const homePortalPath =
    userRole === 'caregiver'
      ? '/caregiver/portal'
      : userRole === 'admin'
        ? '/admin/portal'
        : '/patient/portal';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside className={`sidebar-container ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div>
          {/* Brand Header */}
          <div className="sidebar-brand-header">
            <Link to={homePortalPath} className="sidebar-brand-link" onClick={onCloseMobile}>
              <div className="sidebar-logo-icon-box">
                <PillSyncIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="sidebar-brand-title">PillSync</h2>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={`sidebar-nav-item group ${
                    isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-teal-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          {/* Active Role Card — Strictly Locked to User Persona */}
          <div className="sidebar-role-card">
            <div className="sidebar-role-header">
              <span className="sidebar-role-title">Portal Access</span>
              <div className="flex items-center gap-1.5">
                <span className="sidebar-active-role-pill">
                  <Shield className="h-3 w-3" />
                  {userRole}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium m-0 mt-1">
              {userRole === 'patient' && 'Patient Portal · Prescription Care'}
              {userRole === 'caregiver' && 'Clinical Oversight · Patient Caregiver'}
              {userRole === 'admin' && 'Platform Administration · HIPAA Operations'}
            </p>
          </div>

          {/* User Card & Sign Out Button */}
          <div className="sidebar-user-footer">
            <Link
              to="/profile"
              className="sidebar-user-card"
              title="Manage Profile"
              onClick={onCloseMobile}
            >
              <div className="sidebar-user-avatar flex items-center justify-center font-bold text-xs bg-slate-900 text-teal-400">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PS'}
              </div>
              <div className="sidebar-user-meta">
                <p className="sidebar-user-name truncate">{user?.name || 'User Profile'}</p>
                <span className="sidebar-user-email truncate">
                  {user?.email || 'Active Session'}
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Sign out of PillSync"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
