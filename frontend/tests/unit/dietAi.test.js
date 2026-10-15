import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "../../src/lib/supabaseClient";
import { generateDietPlan } from "../../src/features/fitness/api/dietAi";

describe("generateDietPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the authenticated Edge Function and filters unknown exercise ids", async () => {
    const plan = { summary: "A balanced plan" };
    supabase.functions.invoke.mockResolvedValue({
      data: { plan, exerciseIds: ["brisk_walk", "unknown_exercise"] },
      error: null,
    });

    const result = await generateDietPlan({
      ageGroup: "middle",
      gender: "female",
      goal: "General health",
      dietaryPreference: "Vegetarian",
      activityLevel: "Active",
      conditions: ["hypertension"],
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("diet-ai", {
      body: {
        ageGroup: "middle",
        gender: "female",
        goal: "General health",
        dietaryPreference: "Vegetarian",
        activityLevel: "Active",
        conditions: ["hypertension"],
      },
    });
    expect(result).toEqual({ plan, exerciseIds: ["brisk_walk"] });
  });

  it("surfaces Edge Function errors", async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error("Not authenticated."),
    });

    await expect(generateDietPlan({})).rejects.toThrow(
      "Diet plan service failed: Not authenticated."
    );
  });

  it("rejects an empty function response", async () => {
    supabase.functions.invoke.mockResolvedValue({ data: {}, error: null });

    await expect(generateDietPlan({})).rejects.toThrow(
      "Diet plan service returned an empty response."
    );
  });
});
