import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";

const NAV_BY_ROLE = {
  patient: [
    { to: "/dashboard", label: "Today", icon: "ring" },
    { to: "/medications", label: "Medicines", icon: "pill" },
    { to: "/prescriptions", label: "Prescriptions", icon: "history" },
    { to: "/ocr", label: "OCR Reader", icon: "scan" },
    { to: "/history", label: "History", icon: "history" },
    { to: "/refills", label: "Refills", icon: "refill" },
    { to: "/adherence", label: "Adherence", icon: "chart" },
    { to: "/diet-planner", label: "Diet Planner", icon: "leaf" },
    { to: "/progress", label: "Progress", icon: "flame" },
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

/** Bottom tab bar on mobile only shows the top few items so it never
 * overflows a narrow screen; the rest stay reachable from the full sidebar
 * once the viewport is wide enough to show it. */
const MOBILE_NAV_LIMIT = 5;

const ROLE_LABEL = {
  patient: "Patient",
  caregiver: "Caregiver",
  admin: "Administrator",
};

const ICON_PATHS = {
  scan: (
    <>
      <path
        d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3.5v4M20.5 12h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  pill: (
    <>
      <rect
        x="4"
        y="10.5"
        width="16"
        height="7"
        rx="3.5"
        transform="rotate(-35 12 14)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9.5 15.5 14.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  refill: (
    <>
      <path
        d="M6 4h12M6 4v5.5a3 3 0 0 0 1.2 2.4L9 13v4a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3v-4l1.8-1.1A3 3 0 0 0 18 9.5V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  chart: (
    <>
      <path
        d="M5 19V10M12 19V5M19 19v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  leaf: (
    <>
      <path
        d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 19c0-4 2-7 5-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  dumbbell: (
    <>
      <path
        d="M4 10v4M7 8v8M17 8v8M20 10v4M7 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  flame: (
    <>
      <path
        d="M12 21c4 0 6.5-2.5 6.5-6 0-3-2-4.5-3-7-1 1.5-2 2.5-2 2.5S12 7 11 4c-3 3-5.5 6-5.5 9.5C5.5 17 7 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {ICON_PATHS[name] ?? ICON_PATHS.ring}
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
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            PillSync
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-[14px] font-medium transition-colors ${
                  isActive ? "" : "text-ink-fog hover:bg-porcelain-dim hover:text-ink"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }
                  : undefined
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-fog">Theme</span>
          <ThemeSwitcher />
        </div>

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
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-fog">
                {eyebrow}
              </span>
            )}
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher className="sm:hidden" />
            <button
              type="button"
              onClick={handleSignOut}
              className="font-body text-[13px] font-medium text-ink-fog hover:text-rose sm:hidden"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 sm:px-10 sm:py-8 sm:pb-8">{children}</main>
      </div>

      {/* Mobile bottom tab bar — the sidebar is hidden below the `sm` breakpoint,
          so this is the only nav on phones. */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-ink/5 bg-white/95 px-2 pt-2 backdrop-blur sm:hidden">
        {items.slice(0, MOBILE_NAV_LIMIT).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 font-body text-[10px] font-medium text-ink-fog"
            style={({ isActive }) => (isActive ? { color: "var(--brand-deep)" } : undefined)}
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
