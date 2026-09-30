const SIZE = 120;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Green from 85%, amber from 70%, red below - the same bands the caregiver view uses. */
export function toneFor(value) {
  if (value == null) return 'stroke-slate-300';
  if (value >= 85) return 'stroke-emerald-500';
  if (value >= 70) return 'stroke-amber-500';
  return 'stroke-rose-500';
}

/**
 * A percentage as a ring. `value` of null means "no data yet" and is drawn as an
 * empty ring with a dash - never as 0%, which would read as a failure.
 */
export default function RingGauge({ value, label, caption }) {
  const known = value != null && Number.isFinite(value);
  const clamped = known ? Math.min(100, Math.max(0, value)) : 0;
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={known ? `${label}: ${Math.round(clamped)} percent` : `${label}: no data yet`}
        className="h-28 w-28"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-100"
        />
        {known && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className={toneFor(clamped)}
          />
        )}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-900 text-2xl font-semibold"
        >
          {known ? `${Math.round(clamped)}%` : '—'}
        </text>
      </svg>
      <figcaption className="mt-1 text-center">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {caption && <span className="block text-xs text-slate-500">{caption}</span>}
      </figcaption>
    </figure>
  );
}
