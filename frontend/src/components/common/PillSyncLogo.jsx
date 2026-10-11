import React from 'react';

export default function PillSyncLogo({ size = 'md', showText = true, textColor = '#2B181D' }) {
  const dimensions = {
    sm: { icon: 28, text: '1rem', subtext: '0.65rem' },
    md: { icon: 38, text: '1.25rem', subtext: '0.72rem' },
    lg: { icon: 48, text: '1.5rem', subtext: '0.8rem' },
    xl: { icon: 60, text: '1.85rem', subtext: '0.9rem' },
  }[size] || { icon: 38, text: '1.25rem', subtext: '0.72rem' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 3px 8px rgba(220, 20, 60, 0.25))' }}
      >
        <defs>
          <linearGradient id="pillsync-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF416C" />
            <stop offset="50%" stopColor="#ED4264" />
            <stop offset="100%" stopColor="#DC143C" />
          </linearGradient>
          <linearGradient id="pillsync-capsule-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFE4E8" />
          </linearGradient>
        </defs>

        {/* Outer Squircle Container */}
        <rect x="5" y="5" width="90" height="90" rx="26" fill="url(#pillsync-grad)" />

        {/* Dynamic Sync Orbit Ring */}
        <path
          d="M 50 16 A 34 34 0 0 1 84 50"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.6"
        />
        <path
          d="M 50 84 A 34 34 0 0 1 16 50"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.6"
        />

        {/* Rotated Pill Capsule */}
        <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
          {/* Top Half of Capsule */}
          <path
            d="M 36 50 L 36 34 A 14 14 0 0 1 64 34 L 64 50 Z"
            fill="url(#pillsync-capsule-light)"
          />
          {/* Bottom Half of Capsule */}
          <path
            d="M 36 50 L 36 66 A 14 14 0 0 0 64 66 L 64 50 Z"
            fill="#B91C1C"
          />
          {/* Center Dividing Line */}
          <line x1="34" y1="50" x2="66" y2="50" stroke="#DC143C" strokeWidth="2.5" />
        </g>

        {/* Medical Cross Symbol */}
        <rect x="47" y="38" width="6" height="24" rx="2" fill="#FFFFFF" />
        <rect x="38" y="47" width="24" height="6" rx="2" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: dimensions.text, fontWeight: 900, color: '#DC143C', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Pill
            </span>
            <span style={{ fontSize: dimensions.text, fontWeight: 900, color: textColor, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Sync
            </span>
          </div>
          <span style={{ fontSize: dimensions.subtext, color: '#7E646A', fontWeight: 600, letterSpacing: '0.02em' }}>
            Medication Platform
          </span>
        </div>
      )}
    </div>
  );
}
