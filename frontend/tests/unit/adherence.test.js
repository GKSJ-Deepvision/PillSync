import { describe, it, expect } from "vitest";
import {
  toISODate,
  mondayOf,
  weekRange,
  summarize,
  currentStreak,
  compareWeeks,
  pctColor,
  insights,
} from "../../src/lib/adherence";

describe("dates and weeks", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("finds the Monday of a week for any weekday, including Sunday", () => {
    expect(toISODate(mondayOf(new Date(2026, 9, 8)))).toBe("2026-10-05"); // Thursday
    expect(toISODate(mondayOf(new Date(2026, 9, 5)))).toBe("2026-10-05"); // Monday
    expect(toISODate(mondayOf(new Date(2026, 9, 11)))).toBe("2026-10-05"); // Sunday
  });

  it("builds this week and previous week ranges", () => {
    const ref = new Date(2026, 9, 8);
    expect(weekRange(0, ref)).toMatchObject({ from: "2026-10-05", to: "2026-10-11" });
    expect(weekRange(-1, ref)).toMatchObject({ from: "2026-09-28", to: "2026-10-04" });
  });
});

describe("summarize", () => {
  it("totals taken and missed and rounds the percentage", () => {
    const rows = [
      { taken: 3, missed: 1 },
      { taken: 2, missed: 0 },
    ];
    expect(summarize(rows)).toEqual({ taken: 5, missed: 1, pct: 83 });
  });

  it("returns a null percentage when nothing was resolved", () => {
    expect(summarize([])).toEqual({ taken: 0, missed: 0, pct: null });
    expect(summarize([{ taken: 0, missed: 0 }]).pct).toBeNull();
  });
});

describe("currentStreak", () => {
  it("counts perfect days back from the latest row", () => {
    expect(currentStreak([{ pct: 100 }, { pct: 100 }, { pct: 100 }])).toBe(3);
  });

  it("stops at the first imperfect day", () => {
    expect(currentStreak([{ pct: 50 }, { pct: 100 }, { pct: 100 }])).toBe(2);
  });

  it("skips days with no doses without breaking the streak", () => {
    expect(currentStreak([{ pct: 100 }, { pct: null }, { pct: 100 }])).toBe(2);
  });

  it("is 0 for empty data or a bad latest day", () => {
    expect(currentStreak([])).toBe(0);
    expect(currentStreak([{ pct: 100 }, { pct: 80 }])).toBe(0);
  });
});

describe("compareWeeks and pctColor", () => {
  it("reports direction and difference", () => {
    expect(compareWeeks(80, 70)).toEqual({ delta: 10, direction: "up" });
    expect(compareWeeks(60, 70)).toEqual({ delta: -10, direction: "down" });
    expect(compareWeeks(70, 70)).toEqual({ delta: 0, direction: "same" });
    expect(compareWeeks(null, 70)).toEqual({ delta: null, direction: "none" });
  });

  it("colours by threshold", () => {
    expect(pctColor(95)).toBe("#10b981");
    expect(pctColor(90)).toBe("#10b981");
    expect(pctColor(75)).toBe("#f59e0b");
    expect(pctColor(40)).toBe("#ef4444");
    expect(pctColor(null)).toBe("#d1d5db");
  });
});

describe("insights", () => {
  it("handles a week with no resolved doses", () => {
    expect(insights({ weekPct: null })).toEqual(["No completed doses in this week yet."]);
  });

  it("gives an encouraging message for high adherence", () => {
    expect(insights({ weekPct: 95 })[0]).toMatch(/Excellent/);
  });

  it("warns about low adherence", () => {
    expect(insights({ weekPct: 50 })[0]).toMatch(/missed/);
  });

  it("names the worst time of day and the worst medicine", () => {
    const result = insights({
      weekPct: 75,
      bySlot: [
        { slot: "morning", pct: 90, taken: 9, missed: 1 },
        { slot: "night", pct: 50, taken: 3, missed: 3 },
      ],
      byMed: [
        { name: "Atenolol", pct: 95, taken: 19, missed: 1 },
        { name: "Amoxicillin", pct: 60, taken: 3, missed: 2 },
      ],
    });
    expect(result).toContain("Most missed doses are in the night (50% taken).");
    expect(result).toContain("Amoxicillin is the medicine you miss most (60% taken).");
  });

  it("ignores slots and medicines with too little data", () => {
    const result = insights({
      weekPct: 75,
      bySlot: [
        { slot: "morning", pct: 90, taken: 9, missed: 1 },
        { slot: "night", pct: 0, taken: 0, missed: 1 },
      ],
    });
    expect(result).toHaveLength(1);
  });
});