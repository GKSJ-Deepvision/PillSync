import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, registerWithApi } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (registerWithApi) {
        await registerWithApi(name, email, password, role);
        navigate("/");
      } else {
        login({
          id: `usr-${Date.now()}`,
          name: name || "New User",
          email: email,
          role: role,
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        });
        navigate("/");
      }
    } catch (err) {
      console.warn("API error during registration:", err.message);
      setErrorMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode
          ? "bg-slate-950 text-white"
          : "bg-gradient-to-br from-slate-100 via-brand-50/50 to-indigo-50/50 text-slate-900"
      }`}
    >
      {/* Background ambient lighting */}
      {isDarkMode ? (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      {/* Theme Switcher Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
          className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shadow-md cursor-pointer ${
            isDarkMode
              ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800"
              : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" /> Light Theme
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" /> Dark Theme
            </>
          )}
        </button>
      </div>

      <div
        className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border transition-all ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white"
            : "bg-white/95 border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-2">
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Create PillSync Account
          </h2>
          <p
            className={`text-xs sm:text-sm mt-1 font-medium ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Register as Patient, Caregiver, or Admin
          </p>
        </div>

        {errorMsg && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              isDarkMode
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Full Name
            </label>
            <div className="relative">
              <User
                className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                  isDarkMode ? "text-brand-400" : "text-brand-600"
                }`}
              />
              <input
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-brand-500/20"
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                  isDarkMode ? "text-brand-400" : "text-brand-600"
                }`}
              />
              <input
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-brand-500/20"
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                  isDarkMode ? "text-brand-400" : "text-brand-600"
                }`}
              />
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-brand-500/20"
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1.5 uppercase tracking-wide ${
                isDarkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? "bg-slate-800/90 border-slate-700 text-white focus:border-brand-400 focus:ring-brand-500/30"
                  : "bg-slate-50 border-slate-300 text-slate-900 focus:border-brand-600 focus:ring-brand-500/20"
              }`}
            >
              <option
                value="patient"
                className={isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
              >
                Patient Profile
              </option>
              <option
                value="caregiver"
                className={isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
              >
                Caregiver Profile
              </option>
              <option
                value="admin"
                className={isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
              >
                Administrator Profile
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p
          className={`mt-5 text-center text-xs font-medium ${
            isDarkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className={`font-bold underline transition-colors ${
              isDarkMode
                ? "text-brand-400 hover:text-brand-300"
                : "text-brand-600 hover:text-brand-700"
            }`}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
