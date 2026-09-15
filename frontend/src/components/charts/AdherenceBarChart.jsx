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
    <svg viewBox={`0 0 ${width} ${height + 24}`} width="100%" height={height + 24} role="img" aria-label="Daily adherence percentage">
      {[0, 50, 100].map((line) => (
        <line
          key={line}
          x1="0"
          x2={width}
          y1={height - (line / 100) * height}
          y2={height - (line / 100) * height}
          stroke="currentColor"
          strokeOpacity="0.06"
        />
      ))}
      {days.map((d, i) => {
        const x = i * (barWidth + gap);
        const pct = d.percentage ?? 0;
        const barHeight = (pct / 100) * height;
        const color = d.percentage === null ? "#EAEEF6" : pct >= 80 ? "var(--brand)" : pct >= 50 ? "var(--accent)" : "#E23F58";
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={Math.max(barHeight, d.percentage === null ? 4 : 2)}
              rx="4"
              fill={color}
            >
              <title>{`${d.label}: ${d.percentage === null ? "no doses" : `${d.percentage}%`}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55" fontFamily="'IBM Plex Mono', monospace">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
