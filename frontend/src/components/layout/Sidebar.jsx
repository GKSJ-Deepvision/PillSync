import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

import { selectRole } from '../../store/authSlice.js';

/** Navigation is filtered by role, mirroring what the API will actually allow. */
const LINKS = [
  { to: '/', label: 'Dashboard', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'], end: true },
  { to: '/profile', label: 'My profile', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'] },
  { to: '/family', label: 'Family profiles', roles: ['PATIENT', 'ADMIN'] },
  { to: '/caregivers', label: 'Caregivers', roles: ['PATIENT'] },
  { to: '/patients', label: 'My patients', roles: ['CAREGIVER'] },
  { to: '/medicines', label: 'Medicine catalogue', roles: ['PATIENT', 'CAREGIVER', 'ADMIN'] },
  { to: '/admin/users', label: 'User management', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const role = useSelector(selectRole);
  const visible = LINKS.filter((link) => !role || link.roles.includes(role));

  return (
    <nav aria-label="Main" className="hidden w-56 shrink-0 md:block">
      <ul className="space-y-1">
        {visible.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-100 text-brand-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
