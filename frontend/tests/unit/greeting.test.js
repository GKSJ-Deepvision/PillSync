import { describe, it, expect } from "vitest";
import { getGreeting } from "../../src/lib/greeting";

describe("getGreeting", () => {
  it("returns morning at the 9am boundary onward within range", () => {
    expect(getGreeting(9).window).toBe("morning");
  });

  it("returns night at the 11pm boundary", () => {
    expect(getGreeting(23).window).toBe("night");
  });

  it("returns afternoon and evening windows correctly", () => {
    expect(getGreeting(13).window).toBe("afternoon");
    expect(getGreeting(18).window).toBe("evening");
  });
});
