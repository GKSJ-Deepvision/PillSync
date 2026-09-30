import { describe, expect, it } from 'vitest';

import {
  areaPath,
  countAxis,
  labelIndices,
  linePath,
  linear,
  niceMax,
  shortDate,
  ticks,
} from './scale.js';

describe('niceMax', () => {
  it('rounds up to a tidy axis end', () => {
    expect(niceMax(7)).toBe(10);
    expect(niceMax(43)).toBe(50);
    expect(niceMax(1.2)).toBe(2);
    expect(niceMax(180)).toBe(200);
  });

  it('never returns zero, so an all-zero series still has an axis', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-5)).toBe(1);
    expect(niceMax(NaN)).toBe(1);
  });

  it('is always at least the value', () => {
    for (const v of [0.3, 1, 2.4, 9, 11, 99, 101, 1234]) {
      expect(niceMax(v)).toBeGreaterThanOrEqual(v);
    }
  });
});

describe('linear', () => {
  it('maps a domain onto a range', () => {
    const scale = linear([0, 10], [100, 200]);
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(150);
    expect(scale(10)).toBe(200);
  });

  it('supports an inverted range, as SVG y axes need', () => {
    expect(linear([0, 10], [100, 0])(2.5)).toBe(75);
  });

  it('does not divide by zero on a flat domain', () => {
    expect(linear([3, 3], [0, 50])(3)).toBe(0);
  });
});

describe('ticks', () => {
  it('includes both ends', () => {
    expect(ticks(100, 4)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('labelIndices', () => {
  it('labels everything when there is room', () => {
    expect(labelIndices(4)).toEqual([0, 1, 2, 3]);
  });

  it('thins a long axis but keeps both ends', () => {
    const picked = labelIndices(30, 6);
    expect(picked).toHaveLength(6);
    expect(picked[0]).toBe(0);
    expect(picked.at(-1)).toBe(29);
  });

  it('copes with nothing', () => {
    expect(labelIndices(0)).toEqual([]);
  });
});

describe('shortDate', () => {
  it('does not shift the day across time zones', () => {
    expect(shortDate('2026-03-05')).toMatch(/5/);
    expect(shortDate('2026-03-05T23:59:59Z')).toMatch(/5/);
  });

  it('returns empty for junk', () => {
    expect(shortDate('')).toBe('');
    expect(shortDate('not a date')).toBe('');
  });
});

describe('paths', () => {
  it('draws a polyline', () => {
    expect(
      linePath([
        [0, 10],
        [5, 20],
      ])
    ).toBe('M0.0,10.0 L5.0,20.0');
  });

  it('closes an area down to the baseline', () => {
    const path = areaPath(
      [
        [0, 10],
        [5, 20],
      ],
      50
    );
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('L5.0,50');
    expect(path).toContain('L0.0,50');
  });

  it('draws nothing for no points', () => {
    expect(areaPath([], 50)).toBe('');
  });
});

describe('countAxis', () => {
  it('uses one tick per unit on a small axis, so every tick is a whole number', () => {
    expect(countAxis(3)).toEqual({ max: 3, count: 3 });
    expect(countAxis(4)).toEqual({ max: 4, count: 4 });
  });

  it('picks a tidy step on a larger axis', () => {
    expect(countAxis(5)).toEqual({ max: 5, count: 5 });
    expect(countAxis(12)).toEqual({ max: 15, count: 3 });
    expect(countAxis(47)).toEqual({ max: 50, count: 5 });
  });

  it('always yields whole-number ticks that cover the value', () => {
    for (const v of [0, 0.4, 1, 2, 6, 7, 9, 13, 24, 99, 130, 1200]) {
      const { max, count } = countAxis(v);
      expect(max).toBeGreaterThanOrEqual(Math.ceil(v));
      expect(Number.isInteger(max / count)).toBe(true);
    }
  });

  it('survives junk', () => {
    expect(countAxis(NaN).max).toBe(1);
  });
});
