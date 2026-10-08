import { describe, it, expect } from "vitest";
import {
  guessCategory,
  reminderTimesFor,
  prepareCards,
  dosageText,
  validateCard,
  cardToRow,
} from "../../src/lib/ocrMapping";

describe("guessCategory", () => {
  it("suggests a category from the medicine name", () => {
    expect(guessCategory("Amoxicillin 500mg")).toBe("Antibiotics");
    expect(guessCategory("Metformin & Sitagliptin")).toBe("Diabetes");
    expect(guessCategory("ATENOLOL")).toBe("Heart");
    expect(guessCategory("Amlodipine")).toBe("Blood Pressure");
  });

  it("returns an empty string when nothing matches", () => {
    expect(guessCategory("Unknownol")).toBe("");
    expect(guessCategory()).toBe("");
  });
});

describe("reminderTimesFor", () => {
  it("returns no reminders for as-needed or unknown frequency", () => {
    expect(reminderTimesFor({ as_needed: true, doses_per_day: 2 })).toEqual([]);
    expect(reminderTimesFor({})).toEqual([]);
  });

  it("spreads times evenly when no slots are given", () => {
    expect(reminderTimesFor({ doses_per_day: 1 })).toEqual(["08:00"]);
    expect(reminderTimesFor({ doses_per_day: 3 })).toEqual(["08:00", "14:00", "20:00"]);
    expect(reminderTimesFor({ doses_per_day: 5 })).toEqual(["06:00", "10:00", "14:00", "18:00", "22:00"]);
  });

  it("uses the named slots when they match the dose count", () => {
    expect(reminderTimesFor({ doses_per_day: 2, times_of_day: ["night", "morning"] })).toEqual(["08:00", "21:00"]);
  });

  it("falls back to spreading when slots do not match the dose count", () => {
    expect(reminderTimesFor({ doses_per_day: 2, times_of_day: ["morning"] })).toEqual(["08:00", "20:00"]);
  });
});

describe("prepareCards", () => {
  it("creates an editable card per medicine", () => {
    const cards = prepareCards([{ name: "Amoxicillin", doses_per_day: 3 }]);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: "0-Amoxicillin",
      include: true,
      disease_category: "Antibiotics",
      times: ["08:00", "14:00", "20:00"],
    });
  });

  it("handles an empty scan", () => {
    expect(prepareCards()).toEqual([]);
  });
});

describe("dosageText", () => {
  it("shows the strength alone for one unit", () => {
    expect(dosageText({ units_per_dose: 1, strength: "500mg" })).toBe("500mg");
  });

  it("mentions units per dose when more than one", () => {
    expect(dosageText({ units_per_dose: 2, strength: "500mg", form: "cap" })).toBe("500mg (2 capsules per dose)");
  });

  it("falls back to units when the strength is missing", () => {
    expect(dosageText({ units_per_dose: 1 })).toBe("1 tablet per dose");
    expect(dosageText({ units_per_dose: 2 })).toBe("2 tablets per dose");
  });
});

describe("validateCard", () => {
  const good = { name: "Atenolol", times: ["08:00"], units_per_dose: 1, quantity: 30 };

  it("accepts a complete card", () => {
    expect(validateCard(good)).toEqual([]);
  });

  it("requires a name", () => {
    expect(validateCard({ ...good, name: " " })).toContain("Medicine name is required.");
  });

  it("requires reminder times unless as needed", () => {
    expect(validateCard({ ...good, times: [] })).toContain("Add at least one reminder time.");
    expect(validateCard({ ...good, times: [], as_needed: true })).toEqual([]);
  });

  it("rejects malformed times, negative quantity and zero units", () => {
    expect(validateCard({ ...good, times: ["25:00"] })).toContain("Reminder times must be HH:MM.");
    expect(validateCard({ ...good, quantity: -1 })).toContain("Quantity cannot be negative.");
    expect(validateCard({ ...good, units_per_dose: 0 })).toContain("Units per dose must be more than 0.");
  });
});

describe("cardToRow", () => {
  it("builds a medications row with sorted times and source ocr", () => {
    const row = cardToRow(
      {
        name: " Atenolol ",
        strength: "100mg",
        units_per_dose: 1,
        times: ["20:00", "08:00"],
        quantity: "30",
        disease_category: "Heart",
        duration_days: 10,
        food_instruction: "after food",
      },
      "patient-1",
    );
    expect(row).toMatchObject({
      patient_id: "patient-1",
      name: "Atenolol",
      dosage: "100mg",
      frequency_per_day: 2,
      reminder_times: ["08:00", "20:00"],
      quantity_on_hand: 30,
      disease_category: "Heart",
      source: "ocr",
      active: true,
    });
  });

  it("marks as-needed medicines with no reminders", () => {
    const row = cardToRow({ name: "Paracetamol", as_needed: true, times: [], units_per_dose: 1, quantity: "" }, "p");
    expect(row.frequency_per_day).toBe(0);
    expect(row.reminder_times).toEqual([]);
    expect(row.notes).toBe("As needed (SOS)");
    expect(row.quantity_on_hand).toBeNull();
  });
});