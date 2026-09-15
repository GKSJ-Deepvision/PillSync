import { describe, it, expect } from "vitest";
import { computeAdherence, groupByDay, currentStreak, byMedication } from "../../src/lib/adherence";

const iso = (day, hour = 8) =>
  new Date(
    `2026-01-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`
  ).toISOString();

describe("computeAdherence", () => {
  it("only counts resolved (taken/missed) doses", () => {
    const logs = [
      { status: "taken" },
      { status: "taken" },
      { status: "missed" },
      { status: "pending" },
      { status: "snoozed" },
    ];
    const result = computeAdherence(logs);
    expect(result.taken).toBe(2);
    expect(result.missed).toBe(1);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67);
  });

  it("returns null percentage when nothing is resolved yet", () => {
    const result = computeAdherence([{ status: "pending" }]);
    expect(result.percentage).toBeNull();
  });
});

describe("groupByDay", () => {
  it("buckets logs by local calendar day", () => {
    const logs = [
      { scheduled_for: iso(1, 8), status: "taken" },
      { scheduled_for: iso(1, 20), status: "missed" },
      { scheduled_for: iso(2, 8), status: "pending" },
    ];
    const map = groupByDay(logs);
    expect(map["2026-01-01"]).toEqual({ taken: 1, missed: 1, pending: 0, total: 2 });
    expect(map["2026-01-02"]).toEqual({ taken: 0, missed: 0, pending: 1, total: 1 });
  });
});

describe("currentStreak", () => {
  it("counts consecutive fully-adherent days, most recent first", () => {
    const dayMap = {
      "2026-01-03": { taken: 2, missed: 0, pending: 0, total: 2 },
      "2026-01-02": { taken: 2, missed: 0, pending: 0, total: 2 },
      "2026-01-01": { taken: 1, missed: 1, pending: 0, total: 2 },
    };
    expect(currentStreak(dayMap)).toBe(2);
  });

  it("skips days with nothing scheduled without breaking the streak", () => {
    const dayMap = {
      "2026-01-03": { taken: 1, missed: 0, pending: 0, total: 1 },
      "2026-01-02": { taken: 0, missed: 0, pending: 0, total: 0 },
      "2026-01-01": { taken: 1, missed: 0, pending: 0, total: 1 },
    };
    expect(currentStreak(dayMap)).toBe(2);
  });

  it("stops the streak at an unfinished (pending) day", () => {
    const dayMap = {
      "2026-01-02": { taken: 0, missed: 0, pending: 1, total: 1 },
      "2026-01-01": { taken: 1, missed: 0, pending: 0, total: 1 },
    };
    expect(currentStreak(dayMap)).toBe(1);
  });
});

describe("byMedication", () => {
  it("aggregates resolved doses per medication", () => {
    const logs = [
      { medication_id: "a", medications: { name: "Metformin" }, status: "taken" },
      { medication_id: "a", medications: { name: "Metformin" }, status: "missed" },
      { medication_id: "b", medications: { name: "Atorvastatin" }, status: "taken" },
    ];
    const result = byMedication(logs);
    const metformin = result.find((r) => r.medication.name === "Metformin");
    expect(metformin.taken).toBe(1);
    expect(metformin.missed).toBe(1);
    expect(metformin.percentage).toBe(50);
  });
});
