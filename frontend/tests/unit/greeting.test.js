import { describe, it, expect } from "vitest";
import { timeOfDayGreeting } from "../../src/utils/greeting";

describe("timeOfDayGreeting", () => {
  it("returns a morning greeting for 9am", () => {
    const result = timeOfDayGreeting(new Date(2026, 0, 1, 9, 0));
    expect(result.window).toBe("dawn");
    expect(result.label).toBe("Good morning");
  });

  it("returns a night greeting for 11pm", () => {
    const result = timeOfDayGreeting(new Date(2026, 0, 1, 23, 0));
    expect(result.window).toBe("night");
  });
});
