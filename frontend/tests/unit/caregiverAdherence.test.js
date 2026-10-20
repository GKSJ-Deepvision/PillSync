import { describe, it, expect } from "vitest";
import {
  adherenceStatus,
  changeInPoints,
  dailyAdherence,
  filterByRange,
  lastMissed,
  missedBySlot,
  periodRanges,
  summarizeLogs,
  timeSlot,
} from "../../src/lib/caregiverAdherence";

const log = (y, m, d, h, status) => ({
  scheduled_for: new Date(y, m, d, h, 0, 0).toISOString(),
  status,
});

describe("timeSlot", () => {
  it("groups hours into four parts of the day", () => {
    expect(timeSlot(new Date(2026, 9, 8, 6))).toBe("Morning");
    expect(timeSlot(new Date(2026, 9, 8, 12))).toBe("Afternoon");
    expect(timeSlot(new Date(2026, 9, 8, 18))).toBe("Evening");
    expect(timeSlot(new Date(2026, 9, 8, 23))).toBe("Night");
    expect(timeSlot(new Date(2026, 9, 8, 3))).toBe("Night");
  });
});

describe("summarizeLogs", () => {
  it("counts doses and treats snoozed as pending", () => {
    const logs = [
      { status: "taken" },
      { status: "taken" },
      { status: "taken" },
      { status: "missed" },
      { status: "pending" },
      { status: "snoozed" },
    ];
    expect(summarizeLogs(logs)).toEqual({
      taken: 3,
      missed: 1,
      pending: 2,
      total: 6,
      adherence: 75,
    });
  });

  it("has no percentage when nothing is resolved", () => {
    expect(summarizeLogs([]).adherence).toBeNull();
    expect(summarizeLogs([{ status: "pending" }]).adherence).toBeNull();
  });
});

describe("periodRanges", () => {
  it("returns the current and previous period at local midnight", () => {
    const { currentPeriod, previousPeriod } = periodRanges(7, new Date(2026, 9, 8, 15, 30));
    expect(currentPeriod.to).toEqual(new Date(2026, 9, 9));
    expect(currentPeriod.from).toEqual(new Date(2026, 9, 2));
    expect(previousPeriod.from).toEqual(new Date(2026, 8, 25));
    expect(previousPeriod.to).toEqual(currentPeriod.from);
  });
});

describe("filterByRange", () => {
  it("keeps logs inside the range only", () => {
    const logs = [log(2026, 9, 1, 9, "taken"), log(2026, 9, 5, 9, "taken"), log(2026, 9, 9, 9, "taken")];
    const kept = filterByRange(logs, new Date(2026, 9, 2), new Date(2026, 9, 9));
    expect(kept).toHaveLength(1);
  });
});

describe("dailyAdherence", () => {
  it("groups doses by the local calendar day, oldest first", () => {
    const now = new Date(2026, 9, 8, 22, 0);
    const logs = [
      log(2026, 9, 8, 1, "missed"), // 1 AM local on the 8th
      log(2026, 9, 8, 21, "taken"), // 9 PM local on the 8th
      log(2026, 9, 7, 9, "taken"),
    ];
    const days = dailyAdherence(logs, 7, now);
    expect(days).toHaveLength(7);
    expect(days[6].key).toBe("2026-10-08");
    expect(days[0].key).toBe("2026-10-02");
    expect(days[6].taken).toBe(1);
    expect(days[6].missed).toBe(1);
    expect(days[6].adherence).toBe(50);
    expect(days[5].adherence).toBe(100);
    expect(days[3].adherence).toBeNull();
  });
});

describe("missedBySlot", () => {
  it("counts missed doses by time of day", () => {
    const logs = [
      log(2026, 9, 8, 8, "missed"),
      log(2026, 9, 8, 22, "missed"),
      log(2026, 9, 7, 22, "missed"),
      log(2026, 9, 7, 22, "taken"),
    ];
    expect(missedBySlot(logs)).toEqual({ Morning: 1, Afternoon: 0, Evening: 0, Night: 2 });
  });
});

describe("changeInPoints and adherenceStatus", () => {
  it("compares periods and handles missing data", () => {
    expect(changeInPoints(80, 70)).toBe(10);
    expect(changeInPoints(60, 70)).toBe(-10);
    expect(changeInPoints(null, 70)).toBeNull();
    expect(changeInPoints(80, null)).toBeNull();
  });

  it("classifies adherence", () => {
    expect(adherenceStatus(95)).toBe("good");
    expect(adherenceStatus(80)).toBe("good");
    expect(adherenceStatus(79)).toBe("attention");
    expect(adherenceStatus(49)).toBe("critical");
    expect(adherenceStatus(null)).toBe("none");
  });
});

describe("lastMissed", () => {
  it("returns the most recent missed dose", () => {
    const older = log(2026, 9, 5, 9, "missed");
    const newer = log(2026, 9, 7, 9, "missed");
    expect(lastMissed([older, log(2026, 9, 8, 9, "taken"), newer])).toBe(newer);
    expect(lastMissed([log(2026, 9, 8, 9, "taken")])).toBeNull();
  });
});