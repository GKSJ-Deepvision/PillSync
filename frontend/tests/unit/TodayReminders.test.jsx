import { describe, it, expect } from "vitest";
import {
  formatDoseTime,
  isDoseActionWindowOpen,
} from "../../src/components/dashboard/TodayReminders";

describe("isDoseActionWindowOpen", () => {
  it("allows taken actions only during the scheduled dose window", () => {
    const scheduled = "2026-01-02T08:00:00Z";

    expect(isDoseActionWindowOpen({ scheduled_for: scheduled, status: "pending" }, new Date("2026-01-02T08:30:00Z").getTime())).toBe(true);
    expect(isDoseActionWindowOpen({ scheduled_for: scheduled, status: "pending" }, new Date("2026-01-02T09:30:00Z").getTime())).toBe(false);
    expect(isDoseActionWindowOpen({ scheduled_for: scheduled, status: "taken" }, new Date("2026-01-02T08:15:00Z").getTime())).toBe(false);
  });

  it("formats dose times in Indian Standard Time with AM/PM", () => {
    expect(formatDoseTime("2026-01-02T08:05:00Z")).toBe("1:35 pm IST");
  });
});
