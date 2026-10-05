import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import RefillsPage from "../../src/pages/RefillsPage";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  fetchRefillPredictionsApi: vi.fn(),
  requestRefillApi: vi.fn(),
  updateStockApi: vi.fn(),
}));

describe("RefillsPage Component", () => {
  it("renders loading indicator initially", () => {
    api.fetchRefillPredictionsApi.mockReturnValue(new Promise(() => {}));
    render(<RefillsPage />);
    expect(screen.getByText(/Calculating real stock depletion/i)).toBeInTheDocument();
  });

  it("renders refill predictions cards", async () => {
    api.fetchRefillPredictionsApi.mockResolvedValue([
      {
        medicationId: 101,
        medicationName: "Metformin",
        dosage: "500 mg",
        diseaseCategory: "Diabetes",
        status: "WARNING",
        initialQuantity: 15,
        totalStock: 60,
        effectiveStockDays: 7,
        depletionDate: "2026-10-08",
        recommendedRefillDate: "2026-10-05",
      },
    ]);

    render(<RefillsPage />);

    await waitFor(() => {
      expect(screen.getByText("Metformin (500 mg)")).toBeInTheDocument();
    });

    expect(screen.getByText("WARNING")).toBeInTheDocument();
    expect(screen.getByText("Request Refill Order")).toBeInTheDocument();
  });
});
