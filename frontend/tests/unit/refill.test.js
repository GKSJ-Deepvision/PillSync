import { describe, it, expect } from "vitest";
import {
  urgency,
  stockBarPercent,
  basisNote,
  daysLeftText,
  shortDate,
  URGENCY_STYLES,
} from "../../src/lib/refill";

describe("urgency", () => {
  it("returns unknown when there is no estimate", () => {
    expect(urgency(null)).toBe("unknown");
    expect(urgency(undefined)).toBe("unknown");
  });

  it("classifies days left into empty, low, soon and ok", () => {
    expect(urgency(0)).toBe("empty");
    expect(urgency(-2)).toBe("empty");
    expect(urgency(5)).toBe("low");
    expect(urgency(6)).toBe("soon");
    expect(urgency(10)).toBe("soon");
    expect(urgency(11)).toBe("ok");
  });

  it("has a style entry for every urgency level", () => {
    for (const level of ["empty", "low", "soon", "ok", "unknown"]) {
      expect(URGENCY_STYLES[level].label).toBeTruthy();
    }
  });
});

describe("stockBarPercent", () => {
  it("is 0 for missing, zero or negative stock", () => {
    expect(stockBarPercent(null)).toBe(0);
    expect(stockBarPercent(0)).toBe(0);
    expect(stockBarPercent(-3)).toBe(0);
  });

  it("scales against 30 days and caps at 100", () => {
    expect(stockBarPercent(15)).toBe(50);
    expect(stockBarPercent(30)).toBe(100);
    expect(stockBarPercent(90)).toBe(100);
  });

  it("accepts a custom full-bar length", () => {
    expect(stockBarPercent(5, 10)).toBe(50);
  });
});

describe("daysLeftText", () => {
  it("handles unknown and under one day", () => {
    expect(daysLeftText(null)).toBe("Can't estimate yet");
    expect(daysLeftText(0.5)).toBe("Less than a day left");
  });

  it("rounds down and pluralises", () => {
    expect(daysLeftText(1)).toBe("About 1 day left");
    expect(daysLeftText(15.7)).toBe("About 15 days left");
  });
});

describe("basisNote and shortDate", () => {
  it("explains whether the forecast is observed or scheduled", () => {
    expect(basisNote({ basis: "observed" })).toMatch(/actually took/);
    expect(basisNote({ basis: "schedule" })).toMatch(/schedule/);
  });

  it("returns an empty string for a missing date", () => {
    expect(shortDate("")).toBe("");
    expect(shortDate(null)).toBe("");
  });

  it("formats an ISO date without shifting the day", () => {
    expect(shortDate("2026-10-05")).toMatch(/5/);
  });
});