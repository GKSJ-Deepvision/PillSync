/**
 * Deliberately dependency-free: this project has no charting library
 * installed, and a 7–30 point daily-adherence bar chart doesn't need one.
 * `days` is an array of `{ label, percentage }` (percentage 0-100 or null
 * for days with nothing scheduled).
 */
export default function AdherenceBarChart({ days, height = 140 }) {
  const barWidth = 18;
  const gap = 10;
  const width = Math.max(days.length * (barWidth + gap), 240);

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 28}`}
      width="100%"
      height={height + 28}
      role="img"
      aria-label="Daily adherence percentage"
    >
      <defs>
        <linearGradient id="adherence-bar-good" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7C6BFF" />
          <stop offset="100%" stopColor="#4CC9A8" />
        </linearGradient>
        <linearGradient id="adherence-bar-medium" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F6B352" />
          <stop offset="100%" stopColor="#F78FA7" />
        </linearGradient>
        <linearGradient id="adherence-bar-low" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FF7A7A" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>

      {[0, 50, 100].map((line) => (
        <line
          key={line}
          x1="0"
          x2={width}
          y1={height - (line / 100) * height}
          y2={height - (line / 100) * height}
          stroke="currentColor"
          strokeOpacity="0.08"
        />
      ))}

      {days.map((d, i) => {
        const x = i * (barWidth + gap);
        const pct = d.percentage ?? 0;
        const barHeight = (pct / 100) * height;
        const color =
          d.percentage === null
            ? "#E9EEF7"
            : pct >= 80
              ? "url(#adherence-bar-good)"
              : pct >= 50
                ? "url(#adherence-bar-medium)"
                : "url(#adherence-bar-low)";

        return (
          <g key={`${d.label}-${i}`}>
            <rect
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={Math.max(barHeight, d.percentage === null ? 4 : 2)}
              rx="6"
              fill={color}
            >
              <title>{`${d.label}: ${d.percentage === null ? "no doses" : `${d.percentage}%`}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height + 16}
              textAnchor="middle"
              fontSize="9"
              fill="currentColor"
              opacity="0.6"
              fontFamily="'IBM Plex Mono', monospace"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
