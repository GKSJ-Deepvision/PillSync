import { beforeEach, describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  fieldError,
  normaliseError,
  tokenStorage,
} from './client.js';

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear());

  it('stores and reads both tokens', () => {
    tokenStorage.set({ access: 'a-token', refresh: 'r-token' });
    expect(tokenStorage.getAccess()).toBe('a-token');
    expect(tokenStorage.getRefresh()).toBe('r-token');
  });

  it('leaves the other token alone when only one is given', () => {
    tokenStorage.set({ access: 'first', refresh: 'refresh' });
    tokenStorage.set({ access: 'second' });
    expect(tokenStorage.getAccess()).toBe('second');
    expect(tokenStorage.getRefresh()).toBe('refresh');
  });

  it('clears both tokens on sign out', () => {
    tokenStorage.set({ access: 'a', refresh: 'r' });
    tokenStorage.clear();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('returns null rather than throwing when there is nothing stored', () => {
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });
});

describe('normaliseError', () => {
  it('unwraps the API error envelope', () => {
    const result = normaliseError({
      response: {
        status: 400,
        data: {
          error: {
            code: 'validation_error',
            message: 'The request could not be processed.',
            details: { email: ['Already registered.'] },
          },
        },
      },
    });

    expect(result).toEqual({
      code: 'validation_error',
      message: 'The request could not be processed.',
      details: { email: ['Already registered.'] },
      status: 400,
    });
  });

  it('falls back to detail when the envelope is missing', () => {
    const result = normaliseError({
      response: { status: 404, data: { detail: 'Not found.' } },
    });
    expect(result.message).toBe('Not found.');
    expect(result.status).toBe(404);
  });

  it('reports an offline server as a network error', () => {
    const result = normaliseError({ request: {}, message: 'Network Error' });
    expect(result.code).toBe('network_error');
    expect(result.status).toBe(0);
    expect(result.message).toMatch(/could not reach the server/i);
  });
});

describe('fieldError', () => {
  const error = { details: { email: ['Already registered.'], role: 'Not allowed.' } };

  it('returns the first message for a field', () => {
    expect(fieldError(error, 'email')).toBe('Already registered.');
  });

  it('handles a plain string detail', () => {
    expect(fieldError(error, 'role')).toBe('Not allowed.');
  });

  it('returns null for a field with no error', () => {
    expect(fieldError(error, 'password')).toBeNull();
    expect(fieldError(null, 'password')).toBeNull();
  });
});
