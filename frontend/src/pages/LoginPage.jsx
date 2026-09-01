import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithApi } = useAuth();
  const [email, setEmail] = useState('alex.patient@pillsync.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (loginWithApi) {
        await loginWithApi(email, password);
        navigate('/');
      } else {
        login({
          id: 'usr-101',
          name: selectedRole === 'caregiver' ? 'Dr. Sarah Jenkins' : selectedRole === 'admin' ? 'System Administrator' : 'Alex Morgan',
          email: email,
          role: selectedRole,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
        navigate('/');
      }
    } catch (err) {
      console.warn('API error, executing demo login fallback:', err.message);
      // If API fails or backend error, display error message to user
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 text-white relative overflow-hidden">
      
      {/* Subtle background glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md rounded-3xl glass-card border border-white/10 p-8 shadow-2xl relative z-10">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow mb-3">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
            PillSync Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent Medicine Reminder & Medication Tracking Platform
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Quick Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            Select Role Demo Accounts
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-white/10 text-xs">
            {[
              { role: 'patient', email: 'alex.patient@pillsync.com' },
              { role: 'caregiver', email: 'sarah.caregiver@pillsync.com' },
              { role: 'admin', email: 'admin@pillsync.com' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  setSelectedRole(item.role);
                  setEmail(item.email);
                  setPassword('password123');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-xl capitalize font-semibold transition-all ${
                  selectedRole === item.role
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.role}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign In as {selectedRole}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Need an account? <Link to="/register" className="text-brand-400 font-bold underline">Create Account</Link>
        </p>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured with Django REST Framework & JWT</span>
        </div>

      </div>
    </div>
  );
}
