/** How each forecast status is shown. One table, so every screen agrees. */
export const STATUS = {
  OUT: { label: 'Out of stock', tone: 'danger', rank: 5 },
  CRITICAL: { label: 'Almost out', tone: 'danger', rank: 4 },
  LOW: { label: 'Running low', tone: 'warning', rank: 3 },
  OK: { label: 'Enough stock', tone: 'success', rank: 1 },
  COVERED: { label: 'Covers the course', tone: 'success', rank: 1 },
  UNKNOWN: { label: 'No schedule', tone: 'neutral', rank: 2 },
};

export function statusInfo(code) {
  return STATUS[code] ?? { label: code ?? 'Unknown', tone: 'neutral', rank: 0 };
}

export const needsAttention = (code) => ['OUT', 'CRITICAL', 'LOW'].includes(code);

/** "3 days", "1 day", "today", or null when unknown. */
export function daysLabel(days) {
  if (days == null) return null;
  const whole = Math.floor(Number(days));
  if (whole <= 0) return 'today';
  return `${whole} day${whole === 1 ? '' : 's'}`;
}

/** Confidence as a plain word - "how much should I trust this date". */
export function confidenceLabel(confidence) {
  if (confidence == null) return '';
  if (confidence >= 0.85) return 'High confidence';
  if (confidence >= 0.65) return 'Medium confidence';
  return 'Based on the schedule only';
}
