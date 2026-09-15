import { describe, it, expect } from "vitest";
import { dailyDoseTotal, predictRefill } from "../../src/lib/refillPrediction";

describe("refillPrediction", () => {
  it("matches the spec's worked example: 60 tablets at 2/day is 30 days", () => {
    const schedules = [{ dose_quantity: 2, days_of_week: [0, 1, 2, 3, 4, 5, 6] }];
    const today = new Date("2026-01-01T00:00:00");

    expect(dailyDoseTotal(schedules)).toBe(2);

    const result = predictRefill({ stockQuantity: 60, schedules, today });
    expect(result.daysRemaining).toBe(30);
    expect(result.status).toBe("ok");
    expect(result.depletionDate.toISOString().slice(0, 10)).toBe("2026-01-31");
  });

  it("averages partial-week schedules", () => {
    const schedules = [{ dose_quantity: 1, days_of_week: [1, 3, 5] }];
    expect(dailyDoseTotal(schedules)).toBeCloseTo(3 / 7, 4);
  });

  it("flags low stock inside the refill lead time", () => {
    const schedules = [{ dose_quantity: 2, days_of_week: [0, 1, 2, 3, 4, 5, 6] }];
    const result = predictRefill({ stockQuantity: 6, schedules, refillLeadDays: 5, today: new Date("2026-01-01") });
    expect(result.daysRemaining).toBe(3);
    expect(result.status).toBe("low");
  });

  it("flags empty stock", () => {
    const schedules = [{ dose_quantity: 2, days_of_week: [0, 1, 2, 3, 4, 5, 6] }];
    const result = predictRefill({ stockQuantity: 0, schedules, today: new Date("2026-01-01") });
    expect(result.status).toBe("empty");
  });

  it("returns no-schedule status with no active schedules", () => {
    const result = predictRefill({ stockQuantity: 10, schedules: [] });
    expect(result.status).toBe("no-schedule");
    expect(result.daysRemaining).toBeNull();
  });
});
