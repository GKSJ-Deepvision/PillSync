import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  ScanLine, 
  Clock, 
  RefreshCw, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export default function Sidebar({ mobileOpen, closeMobileSidebar }) {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Medications', path: '/medications', icon: Pill },
    { name: 'OCR Prescription Scan', path: '/ocr-upload', icon: ScanLine, badge: 'AI' },
    { name: 'Smart Reminders', path: '/reminders', icon: Clock },
    { name: 'AI Refill Engine', path: '/refills', icon: RefreshCw, badge: 'Smart' },
    { name: 'Caregiver Portal', path: '/caregiver', icon: Users, roleLimit: ['caregiver', 'admin', 'patient'] },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 glass-card border-r border-slate-200/80 dark:border-slate-800/80 p-4 transition-transform duration-300 flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          
          {/* Mobile Close Header */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <button
              onClick={closeMobileSidebar}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Active Role Widget */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border border-brand-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Profile</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Logged in as <span className="font-semibold capitalize text-brand-700 dark:text-brand-300">{user?.role}</span>
          </p>
        </div>

      </aside>
    </>
  );
}
