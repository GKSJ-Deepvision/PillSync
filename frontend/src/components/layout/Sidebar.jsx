import { useAuth } from '../../context/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Pill, Clock, TrendingUp, Settings, BarChart3, Users, Inbox } from 'lucide-react';

const NAVIGATION = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: TrendingUp,
    roles: ['patient', 'caregiver', 'admin'],
  },
  {
    label: 'Medications',
    href: '/medications',
    icon: Pill,
    roles: ['patient', 'caregiver', 'admin'],
  },
  { label: 'Reminders', href: '/reminders', icon: Clock, roles: ['patient', 'caregiver'] },
  { label: 'Adherence', href: '/adherence', icon: TrendingUp, roles: ['patient', 'caregiver'] },
  { label: 'Patients', href: '/admin/patients', icon: Users, roles: ['admin', 'caregiver'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'caregiver'] },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Inbox,
    roles: ['patient', 'caregiver', 'admin'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['patient', 'caregiver', 'admin'],
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNav = NAVIGATION.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl md:flex">
      <div className="border-b border-slate-200/80 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-primary-600 text-lg font-black text-white shadow-lg shadow-primary-500/20">
            P
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-900">PillSync</p>
            <p className="text-xs text-slate-500">Smart care dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-1.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-3 text-white">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">Current role</p>
          <p className="mt-2 text-base font-semibold capitalize">{user?.role || 'Patient'}</p>
        </div>
      </div>
    </aside>
  );
}
