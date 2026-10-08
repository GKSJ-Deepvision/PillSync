import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithApi } = useAuth();
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
      let loggedRole = role;
      if (loginWithApi) {
        const res = await loginWithApi(email, password, role);
        if (res && res.user && res.user.role) {
          loggedRole = res.user.role;
        }
      } else {
        login({
          id: `usr-${Date.now()}`,
          name: email.split("@")[0] || "User",
          email: email,
          role: role,
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        });
      }

      if (loggedRole === "caregiver") {
        navigate("/caregiver");
      } else if (loggedRole === "admin") {
        navigate("/analytics");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.warn("Login failed:", err.message);
      setErrorMsg(
        err.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Controls: Theme Switcher */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
          className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer ${
            isDarkMode
              ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800"
              : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
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
        className={`w-full max-w-md rounded-3xl p-8 shadow-xl relative z-10 border transition-all ${
          isDarkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20 mb-3">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            PillSync Login
          </h2>
          <p
            className={`text-xs sm:text-sm mt-1 font-medium ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Intelligent Medicine Reminder & Medication Tracking Platform
          </p>
        </div>

        {/* Error notification banner */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="name@example.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-500/30"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-500/30"
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
                  ? "bg-slate-800 border-slate-700 text-white focus:border-brand-400 focus:ring-brand-500/30"
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
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 font-bold text-sm text-white shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <span className="capitalize">Sign In as {role}</span>
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
          Need an account?{" "}
          <Link
            to="/register"
            className={`font-bold underline transition-colors ${
              isDarkMode
                ? "text-brand-400 hover:text-brand-300"
                : "text-brand-600 hover:text-brand-700"
            }`}
          >
            Create Account
          </Link>
        </p>

        <div
          className={`mt-6 pt-4 border-t text-center text-xs flex items-center justify-center gap-1.5 font-medium ${
            isDarkMode
              ? "border-slate-800 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Secured with HIPAA-Compliant 256-Bit Encryption</span>
        </div>
      </div>
    </div>

  );
}
