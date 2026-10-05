import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import RemindersPage from "../../src/pages/RemindersPage";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  fetchReminders: vi.fn(),
  updateReminderStatusApi: vi.fn(),
  fetchNotificationsApi: vi.fn(),
}));

describe("RemindersPage Component", () => {
  it("renders loading indicator initially", () => {
    api.fetchReminders.mockReturnValue(new Promise(() => {}));
    render(<RemindersPage />);
    expect(screen.getByText(/Loading reminder schedules/i)).toBeInTheDocument();
  });

  it("renders list of reminders once loaded", async () => {
    api.fetchReminders.mockResolvedValue([
      {
        id: 1,
        medicationId: 10,
        name: "Morning Metformin",
        dosage: "500 mg",
        time: "08:00 AM",
        period: "Morning",
        foodTiming: "after_food",
        status: "pending",
        disease: "Diabetes",
      },
    ]);

    render(<RemindersPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Metformin")).toBeInTheDocument();
    });

    expect(screen.getByText("08:00 AM")).toBeInTheDocument();
    expect(screen.getByText(/Mark Taken/i)).toBeInTheDocument();
  });
});
