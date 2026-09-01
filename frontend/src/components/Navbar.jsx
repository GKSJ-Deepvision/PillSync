import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Pill, Bell } from 'lucide-react';
import RoleBadge from './RoleBadge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-100 h-16 fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* PillSync Logo branding */}
        <Link to="/dashboard" className="flex items-center gap-2 select-none">
          <div className="bg-brand-50 p-2 rounded-lg">
            <Pill className="h-5 w-5 text-brand-600" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">PillSync</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications indicator shortcut */}
        <Link
          to={user?.role === 'patient' ? '/notifications' : user?.role === 'caregiver' ? '/alerts' : '#'}
          className={`p-2 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors relative ${user?.role === 'admin' ? 'pointer-events-none opacity-40' : ''}`}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {user?.role !== 'admin' && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </Link>

        {/* User Account Settings Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none text-left"
            data-testid="navbar-profile-btn"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              alt={user?.name}
              className="h-8 w-8 rounded-full border border-slate-200 object-cover"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.name}</p>
              <RoleBadge role={user?.role} className="mt-0.5 !py-0 !px-1.5 text-[10px]" />
            </div>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay Backdrop to click-close */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-xl py-1 z-20 animate-fade-in" data-testid="navbar-profile-dropdown">
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="text-xs font-semibold text-slate-700">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-650 hover:bg-red-50 text-left transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
