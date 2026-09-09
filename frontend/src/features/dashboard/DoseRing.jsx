/**
 * Circular progress ring showing today's dose completion.
 * `taken` / `total` drive the fill; falls back to the old label-list
 * behaviour when no counts are passed, so existing tests still pass.
 */
export default function DoseRing({
  windows = ["morning", "afternoon", "night"],
  taken,
  total,
}) {
  const hasProgress = typeof taken === "number" && typeof total === "number" && total > 0;
  const pct = hasProgress ? Math.round((taken / total) * 100) : null;

  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  const offset = hasProgress
    ? circumference - (pct / 100) * circumference
    : circumference;

  return (
    <div
      role="img"
      aria-label="today's dosing windows"
      className="flex items-center gap-5"
    >
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#CCFBF1" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#0D9488"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center heading font-bold text-brand-700">
          {hasProgress ? `${pct}%` : "—"}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="heading font-semibold text-slate-800">
          {hasProgress ? "Today's progress" : "No doses scheduled"}
        </p>
        {hasProgress && (
          <p className="text-sm text-slate-500">
            {taken} of {total} doses taken
          </p>
        )}
        {!hasProgress && (
          <div className="flex gap-2 pt-1">
            {windows.map((w) => (
              <span
                key={w}
                className="px-3 py-1 rounded-full border border-brand-200 text-xs capitalize text-brand-700"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
