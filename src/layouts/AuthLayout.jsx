import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Decorative branding sidebar (visible only on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-primary-700 text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PillSync</span>
        </div>

        <div className="my-auto max-w-md space-y-6 z-10">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Intelligent Medication Management Made Simple
          </h1>
          <p className="text-brand-100 text-base leading-relaxed">
            PillSync links patients, caregivers, and administrators in a unified network to improve adherence, track dosage schedules, and coordinate care.
          </p>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
            <div className="text-2xl font-bold">98%</div>
            <div className="text-xs text-brand-100 font-medium">
              Average user compliance rate reported in healthcare synchronization trials.
            </div>
          </div>
        </div>

        <div className="text-xs text-brand-200 z-10 font-medium">
          © {new Date().getFullYear()} PillSync Systems. All rights reserved.
        </div>
      </div>

      {/* Interactive Forms Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <Pill className="h-6 w-6 text-brand-600" />
          <span className="text-base font-bold text-slate-800 tracking-tight">PillSync</span>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
