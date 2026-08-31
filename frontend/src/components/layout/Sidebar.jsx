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
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="sidebar-brand-logo">
              Mind<span className="sidebar-brand-accent">Care.</span>
            </span>
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
      <div className="sidebar-premium-container">
        <div className="sidebar-premium-card">
          <div className="sidebar-premium-icon">
            <Shield className="h-5 w-5 fill-amber-300 text-amber-300" />
          </div>

          <h4 className="sidebar-premium-title">
            {userRole === 'admin'
              ? 'Admin Director'
              : userRole === 'caregiver'
              ? 'Caregiver Portal'
              : 'Patient Care'}
          </h4>
          <p className="sidebar-premium-subtitle">
            Active Role: <span className="font-black uppercase tracking-wider text-amber-300">{userRole}</span>
          </p>

          {/* 1-Click Role Switcher */}
          <div className="mt-3 flex items-center justify-center gap-1">
            {['patient', 'caregiver', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => switchRole?.(role)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold capitalize transition cursor-pointer ${
                  userRole === role
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={`Switch persona to ${role}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
