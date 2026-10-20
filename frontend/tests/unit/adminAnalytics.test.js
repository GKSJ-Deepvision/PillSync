import { describe, it, expect } from "vitest";
import {
  adherencePct,
  countBy,
  sortedEntries,
  weeklySignups,
} from "../../src/lib/adminAnalytics";

describe("countBy", () => {
  it("counts rows and groups blank keys under the fallback", () => {
    const rows = [{ c: "Heart" }, { c: "Heart" }, { c: "Diabetes" }, { c: "" }, {}];
    expect(countBy(rows, (r) => r.c)).toEqual({ Heart: 2, Diabetes: 1, Uncategorised: 2 });
  });

  it("accepts a custom fallback and handles no rows", () => {
    expect(countBy([{}], (r) => r.role, "Unknown")).toEqual({ Unknown: 1 });
    expect(countBy([], (r) => r.role)).toEqual({});
  });
});

describe("sortedEntries", () => {
  it("sorts by count, then alphabetically", () => {
    expect(sortedEntries({ a: 1, c: 3, b: 3 })).toEqual([["b", 3], ["c", 3], ["a", 1]]);
  });
});

describe("weeklySignups", () => {
  it("puts sign-ups into weekly buckets, oldest first", () => {
    const now = new Date(2026, 9, 8, 12, 0, 0); // Thursday 8 Oct 2026
    const rows = [
      { created_at: "2026-09-22T10:00:00" },
      { created_at: "2026-09-30T10:00:00" },
      { created_at: "2026-10-06T10:00:00" },
      { created_at: "2026-09-01T10:00:00" }, // before the window
      { created_at: "2026-10-20T10:00:00" }, // in the future
      { created_at: "not a date" },
    ];
    const result = weeklySignups(rows, 3, now);
    expect(result.map((b) => b.label)).toEqual(["09-21", "09-28", "10-05"]);
    expect(result.map((b) => b.count)).toEqual([1, 1, 1]);
  });

  it("returns empty buckets when there are no sign-ups", () => {
    const result = weeklySignups([], 4, new Date(2026, 9, 8));
    expect(result).toHaveLength(4);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });
});

describe("adherencePct", () => {
  it("rounds the percentage and returns null for no data", () => {
    expect(adherencePct(8, 2)).toBe(80);
    expect(adherencePct(1, 2)).toBe(33);
    expect(adherencePct(0, 0)).toBeNull();
  });
});