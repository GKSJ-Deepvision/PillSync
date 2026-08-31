import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DoseRing from "../../src/features/dashboard/DoseRing";

describe("DoseRing", () => {
  it("exposes an accessible label for today's dosing windows", () => {
    render(<DoseRing />);
    expect(
      screen.getByLabelText("today's dosing windows")
    ).toBeInTheDocument();
  });

  it("renders each dosing window passed in", () => {
    render(<DoseRing windows={["morning", "night"]} />);
    expect(screen.getByText("morning")).toBeInTheDocument();
    expect(screen.getByText("night")).toBeInTheDocument();
  });
});
