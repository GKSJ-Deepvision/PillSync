import DoseRing from "../common/DoseRing";

const QUOTES = [
  { time: "06:40", text: "Morning metformin, logged before coffee." },
  { time: "13:15", text: "Afternoon dose — caregiver notified automatically." },
  { time: "21:00", text: "Night reminder sent. Streak: 34 days." },
];

export default function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-porcelain">
      {/* Brand panel — hidden on small screens, the Dose Ring signature lives here */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-porcelain lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-rose/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-porcelain/10 font-display text-sm font-bold">
            P
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">PillSync</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 py-10">
          <DoseRing size={260} ambient className="text-porcelain drop-shadow-[0_0_40px_rgba(91,95,239,0.25)]" />
          <p className="max-w-xs text-center font-body text-sm leading-relaxed text-porcelain/60">
            One ring, four windows, every day. PillSync tracks morning, afternoon,
            evening and night doses so nothing quietly gets missed.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {QUOTES.map((q) => (
            <div key={q.time} className="flex items-start gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
              <span className="mt-0.5 font-mono text-[11px] text-mint">{q.time}</span>
              <span className="font-body text-[13px] text-porcelain/70">{q.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-[56%] lg:px-20">
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm font-bold text-porcelain">
              P
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">PillSync</span>
          </div>

          {eyebrow && (
            <span className="badge mb-4 bg-indigo-soft text-indigo-deep">{eyebrow}</span>
          )}
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-2 font-body text-[15px] text-ink-fog">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
