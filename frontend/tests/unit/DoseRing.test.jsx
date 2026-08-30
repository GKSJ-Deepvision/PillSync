import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DoseRing from "../../src/components/common/DoseRing";

describe("DoseRing", () => {
  it("renders the four dosing-window arcs with an accessible label", () => {
    render(<DoseRing />);
    expect(screen.getByRole("img", { name: /today's dosing windows/i })).toBeInTheDocument();
  });
});
