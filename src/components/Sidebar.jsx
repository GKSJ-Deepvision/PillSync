import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  User,
  Pill,
  Calendar,
  Activity,
  Bell,
  Settings,
  Users,
  History,
  AlertTriangle,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'patient';

  const navigationConfig = {
    patient: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'Medicines', path: '/medicines', icon: Pill },
      { name: 'Schedule', path: '/schedule', icon: Calendar },
      { name: 'Adherence', path: '/adherence', icon: Activity },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Settings', path: '/settings', icon: Settings }
    ],
    caregiver: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'My Patients', path: '/patients', icon: Users },
      { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
      { name: 'Settings', path: '/settings', icon: Settings }
    ],
    admin: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'User Management', path: '/users', icon: Users },
      { name: 'Activity Log', path: '/activity-log', icon: History },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  };

  const navLinks = navigationConfig[role.toLowerCase()] || [];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-100 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:top-16 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar-container"
      >
        {/* Mobile Header toggle */}
        <div className="flex items-center justify-between h-16 px-4 lg:hidden border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800 tracking-tight">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Link Lists */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            // Check if active (match dashboard exactly, or partial match other subroutes)
            const isPathActive = 
              location.pathname === link.path || 
              (link.path !== '/dashboard' && link.path !== '/settings' && link.path !== '/profile' && location.pathname.startsWith(link.path));

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isPathActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Version Badge Footer */}
        <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          PillSync Milestone 1 v1.0.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
