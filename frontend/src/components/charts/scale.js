/**
 * Chart geometry, kept out of the components so it can be tested without a DOM.
 *
 * The charts are hand-drawn SVG rather than a charting library: PillSync needs
 * four simple chart types, and a library would add far more code to the bundle
 * than these forty lines of arithmetic.
 */

/** Round a maximum up to a tidy axis end: 7 -> 8, 43 -> 50, 0 -> 1. */
export function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;
  const step = [1, 2, 2.5, 5, 10].find((s) => fraction <= s) ?? 10;
  return step * base;
}

/** A function mapping a value in [d0, d1] onto [r0, r1]. Degenerate domains map to r0. */
export function linear([d0, d1], [r0, r1]) {
  const span = d1 - d0;
  return (value) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
}

/** `count` evenly spaced tick values from 0 to max, inclusive. */
export function ticks(max, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** Indices to label on an axis of `length` points without crowding: at most `max`. */
export function labelIndices(length, max = 6) {
  if (length <= 0) return [];
  if (length <= max) return Array.from({ length }, (_, i) => i);
  const step = (length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => Math.round(i * step));
}

/** "2026-03-05" -> "5 Mar", parsed as a local date so it never shifts a day. */
export function shortDate(iso) {
  if (!iso) return '';
  const [year, month, day] = String(iso).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

/** SVG path through points, as a straight polyline. */
export function linePath(points) {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}

/** The same path closed down to a baseline, for a filled area. */
export function areaPath(points, baselineY) {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${last[0].toFixed(1)},${baselineY} L${first[0].toFixed(1)},${baselineY} Z`;
}

/**
 * Axis for whole-number counts: the end and the tick count are chosen together
 * so every tick is an integer (a dose axis reading 1.3, 2.5, 3.8 is nonsense).
 * Returns `{ max, count }` for use with `ticks(max, count)`.
 */
export function countAxis(value) {
  const top = Math.max(1, Math.ceil(Number.isFinite(value) ? value : 1));
  if (top <= 4) return { max: top, count: top };
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => top / s <= 5) ?? top;
  const count = Math.ceil(top / step);
  return { max: step * count, count };
}
