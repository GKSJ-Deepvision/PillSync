import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import AnalyticsPage from "../../src/pages/AnalyticsPage";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  fetchAnalyticsOverview: vi.fn(),
}));

describe("AnalyticsPage Component", () => {
  it("renders loading state initially", () => {
    api.fetchAnalyticsOverview.mockReturnValue(new Promise(() => {}));
    render(<AnalyticsPage />);
    expect(screen.getByText(/Calculating real adherence & refill analytics/i)).toBeInTheDocument();
  });

  it("renders analytics data and compliance score once fetched", async () => {
    api.fetchAnalyticsOverview.mockResolvedValue({
      adherenceRate: 94,
      takenDoses: 20,
      missedDoses: 1,
      pendingDoses: 2,
      refillAlertsCount: 1,
      weeklyTrend: [
        { day: "Mon", rate: 90 },
        { day: "Tue", rate: 94 },
      ],
      doseBreakdown: [
        { name: "Taken", value: 20, color: "#10b981" },
        { name: "Missed", value: 1, color: "#f43f5e" },
        { name: "Pending", value: 2, color: "#f59e0b" },
      ],
      medicationAnalytics: [
        {
          id: 1,
          name: "Metformin",
          dosage: "500 mg",
          stock: 25,
          daysLeft: 12,
          adherenceRate: 95,
          status: "Sufficient",
        },
      ],
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText("94%")).toBeInTheDocument();
    });

    expect(screen.getByText("Medication Adherence & Health Consistency Analytics")).toBeInTheDocument();
    expect(screen.getByText("Metformin")).toBeInTheDocument();
  });
});
