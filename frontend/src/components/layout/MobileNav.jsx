import { useAuth } from '../../context/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Pill, Calendar, Bell, Users, BarChart3, Settings } from 'lucide-react';
import './MobileNav.css';

const MOBILE_NAVIGATION = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
    roles: ['patient', 'caregiver', 'admin'],
  },
  { label: 'Prescriptions', href: '/medications', icon: Pill, roles: ['patient'] },
  { label: 'Reminders', href: '/reminders', icon: Calendar, roles: ['patient', 'caregiver'] },
  { label: 'Patients', href: '/patients', icon: Users, roles: ['caregiver'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['patient', 'caregiver'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNav = MOBILE_NAVIGATION.filter((item) =>
    item.roles.includes(user?.role || 'patient')
  );

  return (
    <nav className="mobile-nav-bar">
      <div className="mobile-nav-grid">
        {filteredNav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`mobile-nav-link ${
                isActive ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive'
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
