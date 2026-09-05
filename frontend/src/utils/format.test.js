import { describe, expect, it } from 'vitest';

import { firstName, formatDate, initials, titleCase } from './format.js';

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2026-03-14')).toMatch(/2026/);
  });

  it('shows a dash for missing or unparseable values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Asha Patel')).toBe('AP');
    expect(initials('Vemula Purna Vijaya Sai')).toBe('VP');
  });

  it('handles a single name and a missing one', () => {
    expect(initials('Asha')).toBe('A');
    expect(initials('')).toBe('?');
  });
});

describe('firstName', () => {
  it('returns the given name', () => {
    expect(firstName('Asha Patel')).toBe('Asha');
    expect(firstName('')).toBe('');
  });
});

describe('titleCase', () => {
  it('turns an enum value into a label', () => {
    expect(titleCase('BLOOD_PRESSURE')).toBe('Blood Pressure');
    expect(titleCase('PATIENT')).toBe('Patient');
    expect(titleCase('')).toBe('');
  });
});
