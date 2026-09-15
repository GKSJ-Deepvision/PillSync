/**
 * Everything needed to render an animated stick-figure demo of an exercise:
 * age-group color themes (fixed regardless of the app's own ThemeContext,
 * so "old age" always reads the same warm amber palette, "young" always
 * reads the same energetic indigo/teal palette — a stable visual language),
 * gender silhouette tweaks, and small helpers for building the SMIL
 * `values=` strings the <ExerciseFigure> component feeds to <animateTransform>.
 *
 * Why SMIL (<animateTransform>) instead of CSS @keyframes: CSS transform-origin
 * on raw SVG shapes is inconsistent across browsers once you nest rotated
 * groups (shoulder -> elbow, hip -> knee). SMIL's `rotate(angle, cx, cy)`
 * pivots exactly on the joint coordinate every time, which is what makes a
 * hip/knee/shoulder joint actually look like it's hinging.
 */

export const AGE_GROUPS = [
  { key: "young", label: "Young adult", hint: "18–35" },
  { key: "middle", label: "Middle age", hint: "36–59" },
  { key: "old", label: "Older adult", hint: "60+" },
];

export const GENDERS = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
];

/** Fixed per-age color themes — intentionally independent of the app's
 * ThemeContext so an age group always looks the same way. */
export const AGE_THEME = {
  young: {
    key: "young",
    stroke: "#5B5FEF",
    joint: "#4144C4",
    fill: "#E7E7FD",
    ground: "#C7C9F7",
    speed: 1, // 1x = base duration
  },
  middle: {
    key: "middle",
    stroke: "#0EA5B7",
    joint: "#0B7C8A",
    fill: "#D7F5F8",
    ground: "#AEE3E9",
    speed: 1.25, // slightly slower / more controlled tempo
  },
  old: {
    key: "old",
    stroke: "#C2551A",
    joint: "#96410F",
    fill: "#FDE7D8",
    ground: "#F3C79E",
    speed: 1.7, // gentle, unhurried tempo for senior-friendly reps
    stoop: 6, // small permanent forward lean, degrees
  },
};

export const GENDER_SHAPE = {
  male: {
    shoulderHalfWidth: 17,
    hipHalfWidth: 10,
    strokeWidth: 6,
    hasHair: false,
  },
  female: {
    shoulderHalfWidth: 13,
    hipHalfWidth: 13,
    strokeWidth: 5,
    hasHair: true,
  },
};

/** Builds the SMIL `values` attribute for a rotation channel around a fixed
 * pivot point, e.g. buildRotateValues([0, -35, 0], 100, 140) ->
 * "0 100 140;-35 100 140;0 100 140" */
export function buildRotateValues(degreesArray, pivotX, pivotY) {
  return degreesArray.map((deg) => `${deg} ${pivotX} ${pivotY}`).join(";");
}

/** Builds the SMIL `values` attribute for a translate channel,
 * e.g. buildTranslateValues([[0,0],[0,-10],[0,0]]) -> "0 0;0 -10;0 0" */
export function buildTranslateValues(pairs) {
  return pairs.map(([x, y]) => `${x} ${y}`).join(";");
}

/** Evenly spaced keyTimes for N values, e.g. evenKeyTimes(3) -> "0;0.5;1" */
export function evenKeyTimes(count) {
  if (count < 2) return "0";
  const step = 1 / (count - 1);
  return Array.from({ length: count }, (_, i) => (i * step).toFixed(3)).join(";");
}

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cubic ease-in-out, used to interpolate between pose keyframes smoothly
 * (mirrors the `calcMode="spline"` easing used by the 2D SVG animation). */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Samples a rotation channel ({ values, dur } | { static } | undefined) at
 * the given elapsed time (seconds) and returns the current angle in degrees.
 * `speedMultiplier` is the per-age-group tempo scale (AGE_THEME[x].speed). */
export function sampleAngle(channel, elapsedSeconds, speedMultiplier = 1, animate = true) {
  if (!channel) return 0;
  if (channel.static !== undefined || !animate || !channel.values) {
    return channel.static ?? channel.values?.[0] ?? 0;
  }
  const dur = (channel.dur || 1) * speedMultiplier;
  const values = channel.values;
  const segCount = values.length - 1;
  if (segCount <= 0) return values[0] ?? 0;
  const t = (((elapsedSeconds % dur) + dur) % dur) / dur;
  const segT = t * segCount;
  const segIndex = Math.min(Math.floor(segT), segCount - 1);
  const localT = segT - segIndex;
  return lerp(values[segIndex], values[segIndex + 1], easeInOutCubic(localT));
}

/** Same as sampleAngle but for a translate channel ({ values: [[x,y],...], dur }). */
export function sampleTranslate(channel, elapsedSeconds, speedMultiplier = 1, animate = true) {
  if (!channel) return [0, 0];
  if (!animate) return channel.values?.[0] ?? [0, 0];
  const dur = (channel.dur || 1) * speedMultiplier;
  const values = channel.values;
  const segCount = values.length - 1;
  if (segCount <= 0) return values[0] ?? [0, 0];
  const t = (((elapsedSeconds % dur) + dur) % dur) / dur;
  const segT = t * segCount;
  const segIndex = Math.min(Math.floor(segT), segCount - 1);
  const localT = segT - segIndex;
  const [x0, y0] = values[segIndex];
  const [x1, y1] = values[segIndex + 1];
  return [lerp(x0, x1, easeInOutCubic(localT)), lerp(y0, y1, easeInOutCubic(localT))];
}
