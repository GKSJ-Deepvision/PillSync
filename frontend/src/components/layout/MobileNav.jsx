import { useAuth } from '../../context/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Pill, Calendar, Users, BarChart2, ScanLine, Menu } from 'lucide-react';
import './MobileNav.css';

const ROLE_QUICK_NAV = {
  patient: [
    { label: 'Portal', href: '/patient/portal', icon: LayoutGrid },
    { label: 'Meds', href: '/medications', icon: Pill },
    { label: 'Reminders', href: '/reminders', icon: Calendar },
    { label: 'Scan Rx', href: '/ocr', icon: ScanLine },
  ],
  caregiver: [
    { label: 'Portal', href: '/caregiver/portal', icon: LayoutGrid },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Meds', href: '/medications', icon: Pill },
    { label: 'Alerts', href: '/reminders', icon: Calendar },
  ],
  admin: [
    { label: 'Console', href: '/admin/portal', icon: LayoutGrid },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Meds', href: '/medications', icon: Pill },
    { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  ],
};

export function MobileNav({ onOpenMenu }) {
  const { user } = useAuth();
  const location = useLocation();

  const userRole = (user?.role || 'patient').toLowerCase();
  const quickItems = ROLE_QUICK_NAV[userRole] || ROLE_QUICK_NAV.patient;

  return (
    <nav className="mobile-nav-bar" aria-label="Mobile Navigation">
      <div className="mobile-nav-grid">
        {quickItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`mobile-nav-link ${
                isActive ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* 5th Button: Opens Full Sidebar Drawer */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="mobile-nav-link mobile-nav-link-inactive"
          aria-label="Open full navigation menu"
        >
          <Menu className="h-4 w-4 shrink-0 mb-0.5" />
          <span className="truncate">More</span>
        </button>
      </div>
    </nav>
  );
}
