import { describe, expect, it } from 'vitest';

import { confidenceLabel, daysLabel, needsAttention, statusInfo } from './status.js';

describe('refill status helpers', () => {
  it('treats low, critical and out as needing attention', () => {
    expect(['OUT', 'CRITICAL', 'LOW'].every(needsAttention)).toBe(true);
    expect(['OK', 'COVERED', 'UNKNOWN'].some(needsAttention)).toBe(false);
  });

  it('gives out of stock the strongest tone', () => {
    expect(statusInfo('OUT').tone).toBe('danger');
    expect(statusInfo('OUT').rank).toBeGreaterThan(statusInfo('LOW').rank);
  });

  it('survives a status it has never seen', () => {
    expect(statusInfo('FUTURE').label).toBe('FUTURE');
  });

  it('phrases days naturally', () => {
    expect(daysLabel(3.4)).toBe('3 days');
    expect(daysLabel(1)).toBe('1 day');
    expect(daysLabel(0.2)).toBe('today');
    expect(daysLabel(null)).toBeNull();
  });

  it('is honest that an unproven forecast rests on the schedule', () => {
    expect(confidenceLabel(0.5)).toMatch(/schedule only/i);
    expect(confidenceLabel(0.95)).toMatch(/high/i);
  });
});
