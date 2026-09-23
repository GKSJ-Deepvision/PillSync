import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PillIcon, BellIcon, ChartIcon, UserIcon } from "./icons";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: PillIcon },
  { to: "/medications", label: "Medicines", icon: PillIcon },
  { to: "/reminders", label: "Reminders", icon: BellIcon },
  { to: "/history", label: "History", icon: ChartIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export default function AppLayout({ children }) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const visibleNav = role === "patient" ? NAV_ITEMS : NAV_ITEMS.slice(-2);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Left sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-slate-900 h-screen fixed left-0 top-0">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center shrink-0">
            <PillIcon className="w-4 h-4" />
          </div>
          <span className="heading font-bold text-white text-lg">PillSync</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-500/20 text-teal-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-sm text-slate-200 truncate">{profile?.full_name || "Account"}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-slate-400 hover:text-white px-3 py-2"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar (shown only when sidebar is hidden) */}
      <header className="md:hidden fixed top-0 inset-x-0 bg-white/90 backdrop-blur border-b border-gray-100 h-14 flex items-center justify-between px-4 z-20">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center">
            <PillIcon className="w-3.5 h-3.5" />
          </div>
          <span className="heading font-bold text-gray-900">PillSync</span>
        </Link>
        <button onClick={handleSignOut} className="text-xs text-gray-500">
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-16 md:pb-0 md:ml-60">{children}</main>

      {/* Bottom tab bar for mobile */}
      {role === "patient" && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex justify-around py-2 z-20">
          <Link to="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1 text-teal-600">
            <PillIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/reminders" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
            <BellIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reminders</span>
          </Link>
          <Link to="/history" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
            <ChartIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
}