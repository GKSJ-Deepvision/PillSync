import React from 'react';

export default function StockProjectionChart({ data = [], height = 180 }) {
  const chartData = data.length > 0 ? data : [
    { day: 'Day 1', stock: 60 },
    { day: 'Day 5', stock: 50 },
    { day: 'Day 10', stock: 40 },
    { day: 'Day 15', stock: 30 },
    { day: 'Day 20', stock: 20 },
    { day: 'Day 25', stock: 10 },
    { day: 'Day 30', stock: 0 },
  ];

  const maxStock = Math.max(...chartData.map((d) => d.stock), 60);
  const width = 360;
  const padding = 28;

  const points = chartData.map((pt, idx) => {
    const x = padding + (idx / (chartData.length - 1)) * (width - 2 * padding);
    const y = height - padding - (pt.stock / maxStock) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="stockLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC143C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DC143C" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="3 3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

        {/* Depletion Area & Polyline */}
        <polyline
          fill="none"
          stroke="#DC143C"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {chartData.map((pt, idx) => {
          const x = padding + (idx / (chartData.length - 1)) * (width - 2 * padding);
          const y = height - padding - (pt.stock / maxStock) * (height - 2 * padding);
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="4" fill="#DC143C" stroke="#ffffff" strokeWidth="2" />
              <text x={x} y={height - 8} fontSize="9" textAnchor="middle" fill="#64748b" fontWeight="600">
                {pt.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
