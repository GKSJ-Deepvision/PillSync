/**
 * The Dose Ring — PillSync's signature mark.
 *
 * A day is a circle with four real dosing windows on it: dawn, midday, dusk,
 * night. This component draws exactly that — four arcs, one per window —
 * instead of a decorative progress spinner. On auth screens it plays as
 * quiet ambient art (slow rotation, glow). On the dashboard the same
 * component is reused literally, with `taken` marking which windows the
 * signed-in patient has already logged today.
 */
const WINDOWS = [
  { key: "dawn", label: "Morning", color: "#FF5D73", start: 270, end: 340 },
  { key: "midday", label: "Afternoon", color: "#5B5FEF", start: 350, end: 60 },
  { key: "dusk", label: "Evening", color: "#22D3A6", start: 70, end: 140 },
  { key: "night", label: "Night", color: "#101A2E", start: 150, end: 260 },
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const end = endAngle < startAngle ? endAngle + 360 : endAngle;
  const start = polarToCartesian(cx, cy, r, startAngle);
  const stop = polarToCartesian(cx, cy, r, end);
  const largeArc = end - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${stop.x} ${stop.y}`;
}

export default function DoseRing({
  size = 220,
  taken = {},
  ambient = false,
  className = "",
}) {
  const cx = 110;
  const cy = 110;
  const r = 84;

  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Today's dosing windows"
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="14" />

      <g className={ambient ? "origin-center animate-ring-rotate" : ""}>
        {WINDOWS.map((w) => (
          <path
            key={w.key}
            d={arcPath(cx, cy, r, w.start, w.end)}
            fill="none"
            stroke={w.color}
            strokeWidth="14"
            strokeLinecap="round"
            opacity={ambient || taken[w.key] ? 1 : 0.28}
          />
        ))}
      </g>

      {!ambient && (
        <g fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="currentColor" opacity="0.55">
          <text x={cx} y={22} textAnchor="middle">
            06:00
          </text>
          <text x={198} y={cy + 3} textAnchor="middle">
            12:00
          </text>
          <text x={cx} y={204} textAnchor="middle">
            18:00
          </text>
          <text x={22} y={cy + 3} textAnchor="middle">
            00:00
          </text>
        </g>
      )}

      <circle cx={cx} cy={cy} r={34} fill="#101A2E" />
      <path
        d="M99 118 121 96a10.6 10.6 0 1 1 15 15L114 133a10.6 10.6 0 1 1-15-15Z"
        fill="none"
        stroke="#FF5D73"
        strokeWidth="4.4"
      />
      <path d="M104.5 112.5 111.5 105.5" stroke="#22D3A6" strokeWidth="4.4" strokeLinecap="round" />
    </svg>
  );
}

export { WINDOWS };
