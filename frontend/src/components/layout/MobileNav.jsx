import { useAuth } from '../../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { Pill, Clock, TrendingUp, BarChart3, Users } from 'lucide-react';

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
  { label: 'Patients', href: '/admin/patients', icon: Users, roles: ['admin', 'caregiver'] },
];

export function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNav = MOBILE_NAVIGATION.filter((item) => item.roles.includes(user?.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {filteredNav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium transition-all
                ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-800'}
              `}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
