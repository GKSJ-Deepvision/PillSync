import { describe, it, expect } from "vitest";
import {
  todaysScheduledDoses,
  doseWindowStatus,
  adherencePercentage,
} from "../../src/lib/scheduling";

describe("todaysScheduledDoses", () => {
  it("converts HH:MM strings into sorted Date objects for the reference day", () => {
    const ref = new Date(2026, 0, 15, 12, 0, 0);
    const doses = todaysScheduledDoses(["20:00", "08:00"], ref);
    expect(doses).toHaveLength(2);
    expect(doses[0].getHours()).toBe(8);
    expect(doses[1].getHours()).toBe(20);
  });

  it("returns an empty array when no reminder times are given", () => {
    expect(todaysScheduledDoses([], new Date())).toEqual([]);
  });
});

describe("doseWindowStatus", () => {
  it("classifies a future dose as upcoming", () => {
    const now = new Date(2026, 0, 15, 8, 0, 0);
    const scheduled = new Date(2026, 0, 15, 9, 0, 0);
    expect(doseWindowStatus(scheduled, now)).toBe("upcoming");
  });

  it("classifies a dose within the grace window as due", () => {
    const now = new Date(2026, 0, 15, 8, 10, 0);
    const scheduled = new Date(2026, 0, 15, 8, 0, 0);
    expect(doseWindowStatus(scheduled, now, 30)).toBe("due");
  });

  it("classifies a dose past the grace window as overdue", () => {
    const now = new Date(2026, 0, 15, 9, 0, 0);
    const scheduled = new Date(2026, 0, 15, 8, 0, 0);
    expect(doseWindowStatus(scheduled, now, 30)).toBe("overdue");
  });
});

describe("adherencePercentage", () => {
  it("calculates the percentage of taken vs missed doses", () => {
    expect(adherencePercentage(["taken", "taken", "missed", "taken"])).toBe(75);
  });

  it("ignores pending and snoozed doses in the calculation", () => {
    expect(adherencePercentage(["taken", "pending", "missed", "snoozed"])).toBe(50);
  });

  it("returns null when there is nothing to calculate", () => {
    expect(adherencePercentage([])).toBeNull();
    expect(adherencePercentage(["pending", "snoozed"])).toBeNull();
  });
});
