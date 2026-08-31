import { useAuth } from '../../context/useAuth';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Calendar,
  Users,
  MessageSquare,
  BarChart2,
  Settings,
  Pill,
  Shield,
  Activity,
  UserCheck,
} from 'lucide-react';
import './Sidebar.css';

const NAVIGATION_BY_ROLE = {
  patient: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { label: 'Prescriptions', href: '/medications', icon: Pill },
    { label: 'Dose Reminders', href: '/reminders', icon: Calendar },
    { label: 'Adherence Report', href: '/adherence', icon: BarChart2 },
    { label: 'Care Messages', href: '/notifications', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  caregiver: [
    { label: 'Caregiver Dashboard', href: '/dashboard', icon: LayoutGrid },
    { label: 'Assigned Patients', href: '/patients', icon: Users },
    { label: 'Medications Oversight', href: '/medications', icon: Pill },
    { label: 'Dose Logs & Alerts', href: '/reminders', icon: Calendar },
    { label: 'Clinical Analytics', href: '/analytics', icon: Activity },
    { label: 'Care Messages', href: '/notifications', icon: MessageSquare },
  ],
  admin: [
    { label: 'Platform Overview', href: '/dashboard', icon: LayoutGrid },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Patient Cohorts', href: '/patients', icon: UserCheck },
    { label: 'Prescriptions Master', href: '/medications', icon: Pill },
    { label: 'System Analytics', href: '/analytics', icon: BarChart2 },
    { label: 'Platform Settings', href: '/settings', icon: Settings },
  ],
};

export function Sidebar() {
  const { user, switchRole } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'patient';
  const navItems = NAVIGATION_BY_ROLE[userRole] || NAVIGATION_BY_ROLE.patient;

  return (
    <aside className="sidebar-container">
      <div>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <Link to="/dashboard" className="flex items-center gap-3 text-decoration-none">
            <div className="sidebar-logo-icon-box">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="sidebar-brand-title">PillSync</h2>
              <p className="sidebar-brand-subtitle">Smart Medication SaaS</p>
            </div>
          </Link>
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
                className={`sidebar-nav-item ${
                  isActive
                    ? 'sidebar-nav-item-active'
                    : 'sidebar-nav-item-inactive'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Badge & Quick Switcher Card */}
      <div className="sidebar-role-card">
        <div className="sidebar-role-header">
          <span className="sidebar-role-title">Active Persona</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            <Shield className="h-3 w-3" />
            {userRole}
          </span>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="sidebar-role-pill-group">
          {['patient', 'caregiver', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => switchRole?.(role)}
              className={`sidebar-role-btn ${
                userRole === role ? 'sidebar-role-btn-active' : ''
              }`}
              title={`Switch view to ${role}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
