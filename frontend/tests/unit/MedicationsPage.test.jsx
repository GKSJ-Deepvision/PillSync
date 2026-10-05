import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import MedicationsPage from "../../src/pages/MedicationsPage";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  fetchMedications: vi.fn(),
  addMedication: vi.fn(),
  deleteMedicationApi: vi.fn(),
  searchFdaDrugs: vi.fn(),
  takeDoseApi: vi.fn(),
}));

describe("MedicationsPage Component", () => {
  it("renders loading spinner initially", () => {
    api.fetchMedications.mockReturnValue(new Promise(() => {}));
    render(<MedicationsPage />);
    expect(screen.getByText(/Loading medications inventory/i)).toBeInTheDocument();
  });

  it("renders medication list after fetching data", async () => {
    api.fetchMedications.mockResolvedValue([
      {
        id: 1,
        name: "Lisinopril",
        dosage: "10 mg",
        stock: 20,
        totalStock: 30,
        frequency: "1 time daily",
        diseaseCategory: "Hypertension",
        timesOfDay: ["Morning"],
        foodTiming: "after_food",
        stockDays: 20,
        refillThreshold: 10,
      },
    ]);

    render(<MedicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Lisinopril")).toBeInTheDocument();
    });

    expect(screen.getByText("10 mg")).toBeInTheDocument();
  });
});
