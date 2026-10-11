import React from 'react';

export default function DailyDosesChart({ days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], taken = [3, 4, 3, 4, 3, 2, 4], missed = [0, 0, 1, 0, 0, 1, 0] }) {
  const height = 150;
  const width = 340;
  const padding = 24;
  const barWidth = 14;

  const maxVal = 5;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Baseline */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

        {days.map((day, idx) => {
          const x = padding + (idx * ((width - 2 * padding) / days.length)) + 12;
          const tVal = taken[idx] || 0;
          const mVal = missed[idx] || 0;

          const tHeight = (tVal / maxVal) * (height - 2 * padding - 10);
          const mHeight = (mVal / maxVal) * (height - 2 * padding - 10);

          const tY = height - padding - tHeight;
          const mY = height - padding - mHeight;

          return (
            <g key={day}>
              {/* Taken Bar */}
              <rect
                x={x}
                y={tY}
                width={barWidth}
                height={tHeight}
                rx="3"
                fill="#10b981"
              />
              {/* Missed Bar */}
              {mVal > 0 && (
                <rect
                  x={x + barWidth + 3}
                  y={mY}
                  width={barWidth}
                  height={mHeight}
                  rx="3"
                  fill="#ef4444"
                />
              )}
              {/* Day Label */}
              <text x={x + barWidth / 2} y={height - 6} fontSize="10" textAnchor="middle" fill="#64748b" fontWeight="600">
                {day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
