import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, Shield, User, HeartPulse, LogOut, Menu, ChevronDown } from 'lucide-react';

export default function Navbar({ toggleMobileSidebar }) {
  const { user, logout, switchRole } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'Refill Warning: Metformin finishes in 4 days!', time: '10m ago', unread: true },
    { id: 2, text: 'Dose Taken: Atorvastatin marked as taken at 08:00 AM', time: '1h ago', unread: false },
    { id: 3, text: 'Caregiver Alert: Missed dose logged for Morning Schedule', time: 'Yesterday', unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-glow text-white font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400 bg-clip-text text-transparent dark:from-brand-300 dark:to-brand-500">
                PillSync
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50">
                AI Platform
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Role Selector, Notifications, Theme Toggle & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Role Switcher Pill (Great for demonstrating Patient / Caregiver / Admin view) */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => switchRole('patient')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                user?.role === 'patient'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => switchRole('caregiver')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                user?.role === 'caregiver'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Caregiver
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                user?.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-card shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Smart Alerts</h4>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold cursor-pointer">Mark all as read</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{n.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/30"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] capitalize text-slate-500 dark:text-slate-400 font-medium">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    <Shield className="w-3 h-3" />
                    Role: <span className="capitalize">{user?.role}</span>
                  </div>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
