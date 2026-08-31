import { useAuth } from '../../context/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Pill, Clock, TrendingUp, BarChart3, Users } from 'lucide-react';
import './MobileNav.css';

const MOBILE_NAVIGATION = [
  {
    label: 'Medications',
    href: '/medications',
    icon: Pill,
    roles: ['patient', 'caregiver', 'admin'],
  },
  { label: 'Reminders', href: '/reminders', icon: Clock, roles: ['patient', 'caregiver'] },
  { label: 'Adherence', href: '/adherence', icon: TrendingUp, roles: ['patient', 'caregiver'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'caregiver'] },
  { label: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'caregiver'] },
];

export function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNav = MOBILE_NAVIGATION.filter((item) => item.roles.includes(user?.role || 'patient'));

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
