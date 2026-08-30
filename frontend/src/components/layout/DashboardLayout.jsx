import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_BY_ROLE = {
  patient: [
    { to: "/dashboard", label: "Today", icon: "ring" },
    { to: "/profile", label: "My Profile", icon: "user" },
  ],
  caregiver: [
    { to: "/dashboard", label: "My Patients", icon: "ring" },
    { to: "/profile", label: "My Profile", icon: "user" },
  ],
  admin: [
    { to: "/dashboard", label: "Overview", icon: "ring" },
    { to: "/profile", label: "My Profile", icon: "user" },
  ],
};

const ROLE_LABEL = {
  patient: "Patient",
  caregiver: "Caregiver",
  admin: "Administrator",
};

function Icon({ name }) {
  if (name === "ring") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3.5v4M20.5 12h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardLayout({ title, eyebrow, children }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.patient;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-porcelain">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink/5 bg-white px-5 py-6 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm font-bold text-porcelain">
            P
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">PillSync</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-soft text-indigo-deep"
                    : "text-ink-fog hover:bg-porcelain-dim hover:text-ink"
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 rounded-xl border border-ink/5 px-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-xs font-semibold text-porcelain">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-[13px] font-semibold text-ink">
              {profile?.full_name || "—"}
            </p>
            <p className="truncate font-mono text-[11px] uppercase tracking-wide text-ink-fog">
              {ROLE_LABEL[role] || "—"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 font-body text-[13px] font-medium text-ink-fog transition-colors hover:text-rose"
        >
          Sign out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink/5 bg-white/70 px-6 py-4 backdrop-blur sm:px-10">
          <div>
            {eyebrow && (
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-fog">{eyebrow}</span>
            )}
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-body text-[13px] font-medium text-ink-fog hover:text-rose sm:hidden"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
