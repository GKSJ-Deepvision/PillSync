import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Pill, Search, Shield, ChevronDown, Bell, LogOut, X, Menu } from 'lucide-react';
import './Navbar.css';

export function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/medications')) return 'Prescriptions & Medications';
    if (pathname.startsWith('/reminders')) return 'Appointments & Doses';
    if (pathname.startsWith('/adherence')) return 'Adherence Report';
    if (pathname.startsWith('/patients')) return 'Assigned Patients';
    if (pathname.startsWith('/analytics')) return 'Clinical Analytics';
    if (pathname.startsWith('/admin/users')) return 'User Access Management';
    if (pathname.startsWith('/notifications')) return 'Messages & Alerts';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const userRole = user?.role || 'patient';

  return (
    <nav className="navbar-wrapper">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Mobile Brand (visible only on mobile) */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Pill className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Pill<span className="text-indigo-600">Sync</span>
            </span>
          </div>

          {/* Desktop Left: Page Title Breadcrumb */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="navbar-page-title">{getPageTitle(location.pathname)}</span>
          </div>

          {/* Center Search Bar */}
          <div className="navbar-search-wrapper">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, prescriptions, doses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar-search-input"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Live Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer border shadow-2xs ${
                  userRole === 'admin'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : userRole === 'caregiver'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Switch active role persona"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="capitalize">{userRole} Persona</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Role
                  </p>
                  {[
                    { id: 'patient', label: 'Patient View', desc: 'Ibrahim Kadri' },
                    { id: 'caregiver', label: 'Caregiver View', desc: 'Dr. Oliver Mitchell' },
                    { id: 'admin', label: 'Admin Director View', desc: 'Sarah Jenkins' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        switchRole?.(item.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left rounded-xl px-2.5 py-2 text-xs transition cursor-pointer flex flex-col ${
                        userRole === item.id
                          ? 'bg-indigo-50 text-indigo-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <Link to="/notifications" className="navbar-icon-btn" title="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
            </Link>

            {/* User Profile Pill */}
            <div className="navbar-profile-pill">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt="Profile"
                className="navbar-profile-avatar"
              />
              <div className="text-left">
                <p className="navbar-profile-name">{user?.name || 'Dr. Oliver Mitchell'}</p>
                <span className="navbar-profile-role capitalize">
                  {userRole === 'admin'
                    ? 'Clinical Director (Admin)'
                    : userRole === 'caregiver'
                      ? 'Lead Caregiver'
                      : 'Registered Patient'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="navbar-icon-btn hover:text-rose-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {showMobileMenu && (
          <div className="space-y-3 border-t border-slate-200 py-4 md:hidden">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 capitalize">{userRole} role</p>
              </div>
              <div className="flex items-center gap-1">
                {['patient', 'caregiver', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => switchRole?.(role)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold capitalize ${
                      userRole === role ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
