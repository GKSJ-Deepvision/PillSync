import { describe, expect, it } from 'vitest';

import {
  collectErrors,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from './validation.js';

describe('validateEmail', () => {
  it.each(['asha@example.com', 'a.b+tag@sub.example.co.in'])('accepts %s', (value) => {
    expect(validateEmail(value)).toBeNull();
  });

  it.each(['', 'no-at-sign', 'missing@domain', 'spaces @example.com'])('rejects %s', (value) => {
    expect(validateEmail(value)).toBeTruthy();
  });
});

describe('validatePassword', () => {
  it('accepts a long passphrase', () => {
    expect(validatePassword('correct-horse-battery-42')).toBeNull();
  });

  it('rejects a short one, naming the minimum', () => {
    expect(validatePassword('short')).toMatch(/at least 10/i);
  });

  it('rejects an all-numeric password, matching the backend rule', () => {
    expect(validatePassword('1234567890')).toMatch(/only numbers/i);
  });
});

describe('validatePasswordConfirmation', () => {
  it('accepts a match', () => {
    expect(validatePasswordConfirmation('a-passphrase', 'a-passphrase')).toBeNull();
  });

  it('rejects a mismatch', () => {
    expect(validatePasswordConfirmation('a-passphrase', 'b-passphrase')).toMatch(/do not match/i);
  });

  it('asks for the repeat when it is empty', () => {
    expect(validatePasswordConfirmation('a-passphrase', '')).toMatch(/repeat/i);
  });
});

describe('validateRequired', () => {
  it('accepts real input', () => {
    expect(validateRequired('Asha', 'Full name')).toBeNull();
  });

  it('rejects whitespace only', () => {
    expect(validateRequired('   ', 'Full name')).toBe('Full name is required.');
  });
});

describe('collectErrors', () => {
  it('keeps only the failing fields', () => {
    expect(collectErrors({ a: null, b: 'Broken', c: undefined })).toEqual({ b: 'Broken' });
  });

  it('returns an empty object when everything passes', () => {
    expect(collectErrors({ a: null, b: null })).toEqual({});
  });
});
